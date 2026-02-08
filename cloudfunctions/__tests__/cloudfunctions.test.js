const sharp = require('sharp')
const { mockContext, mockEvent } = require('tcb-testing-lib')
const { makeMockDb, makeMockStorage } = require('./helpers')

async function makeJpegBuffer() {
  return sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: { r: 200, g: 120, b: 40 }
    }
  })
    .jpeg({ quality: 80 })
    .toBuffer()
}

function setupMocks(opts) {
  const db = makeMockDb()
  const storage = makeMockStorage()
  const options = opts || {}

  jest.resetModules()
  jest.doMock('@horse/cf-shared/tcb', () => ({
    getDb: () => db,
    getStorage: () => storage
  }))

  jest.doMock('@horse/cf-shared/http', () => ({
    postJson: options.postJson || (async () => ({}))
  }))

  return { db, storage }
}

test('createPublishJob validates and writes album', async () => {
  const { db } = setupMocks()
  const fn = require('../createPublishJob/index').main

  const bad = await fn(mockEvent({}), mockContext())
  expect(bad.code).toBe(400)

  const ok = await fn(mockEvent({ templateId: 'horse-newyear-v1' }), mockContext())
  expect(ok.code).toBe(0)
  expect(ok.data.albumId).toContain('album_')

  const albums = db.collection('albums')
  const res = await albums.where({ albumId: ok.data.albumId }).limit(1).get()
  expect(res.data.length).toBe(1)
})

test('finalizeUpload updates album status', async () => {
  const { db } = setupMocks()
  const albumId = 'album_x'
  await db.collection('albums').add({ albumId, status: 'draft' })
  const fn = require('../finalizeUpload/index').main
  const out = await fn(
    mockEvent({ albumId, uploadedAssets: [{ assetId: 'a1', fileId: 'cloud://x' }] }),
    mockContext()
  )
  expect(out.code).toBe(0)
  const res = await db.collection('albums').where({ albumId }).limit(1).get()
  expect(res.data[0].status).toBe('uploaded')
})

test('processAssets generates resized images and uploads', async () => {
  const { storage } = setupMocks()
  const fn = require('../processAssets/index').main
  const buf = await makeJpegBuffer()
  const up = await storage.uploadFile({ cloudPath: 'tmp/original.jpg', fileContent: buf })

  const out = await fn(
    mockEvent({ albumId: 'album_a', assets: [{ assetId: 'a1', originalFileId: up.fileID }] }),
    mockContext()
  )
  expect(out.code).toBe(0)
  expect(out.data.assets[0].thumbFileId).toContain('albums/album_a/images/thumb/a1.jpg')
})

test('generateAiText falls back and caches', async () => {
  const { db } = setupMocks()
  const fn = require('../generateAiText/index').main
  const payload = {
    albumId: 'album_ai',
    templateId: 'horse-newyear-v1',
    pages: [{ pageType: 'cover', layoutId: 'cover-A', imageSummary: { count: 1 } }]
  }
  const out1 = await fn(mockEvent(payload), mockContext())
  expect(out1.code).toBe(0)
  expect(out1.data.result.cover.title).toBeTruthy()
  expect(out1.data.fromCache).toBe(false)

  const out2 = await fn(mockEvent(payload), mockContext())
  expect(out2.code).toBe(0)
  expect(out2.data.fromCache).toBe(true)

  const cache = await db.collection('ai_text_cache').where({ cacheKey: out1.data.cacheKey }).limit(1).get()
  expect(cache.data.length).toBe(1)
})

test('generateAiText validates and retries when Doubao is enabled', async () => {
  const envBackup = { ...process.env }
  process.env.DOUBAO_HOST = 'example.com'
  process.env.DOUBAO_REGION = 'cn-north-1'
  process.env.DOUBAO_SERVICE = 'doubao'
  process.env.DOUBAO_ACCESS_KEY = 'ak'
  process.env.DOUBAO_SECRET_KEY = 'sk'
  process.env.DOUBAO_API_PATH = '/api/v3/chat/completions'
  process.env.DOUBAO_MODEL = 'doubao'

  let called = 0
  const { db } = setupMocks({
    postJson: async () => {
      called += 1
      if (called === 1) {
        return { output: { cover: { title: '短', subtitle: '也短', blessing: '也短' }, pages: [{}] } }
      }
      return {
        output: {
          cover: {
            title: '马年新春团圆年册',
            subtitle: '把这一年的热闹与温柔，都装进这里',
            blessing: '愿你新岁顺遂，心里有光，脚下有路。'
          },
          pages: [{ paragraph: '灯火可亲，笑声入册。把最重要的人，放在最亮的一页。', captions: ['这一刻很值得记住', '我们在一起就很好呀'] }]
        }
      }
    }
  })

  const fn = require('../generateAiText/index').main
  const payload = {
    albumId: 'album_ai_2',
    templateId: 'horse-newyear-v1',
    pages: [{ pageType: 'groupPhoto', layoutId: 'group-hero', imageSummary: { count: 2 } }]
  }
  const out = await fn(mockEvent(payload), mockContext())
  expect(out.code).toBe(0)
  expect(out.data.fromAi).toBe(true)
  expect(called).toBeGreaterThan(1)

  const cache = await db.collection('ai_text_cache').where({ cacheKey: out.data.cacheKey }).limit(1).get()
  expect(cache.data.length).toBe(1)

  process.env = envBackup
})

test('buildAlbumJson uploads album.json and updates db', async () => {
  const { db, storage } = setupMocks()
  const albumId = 'album_json'
  await db.collection('albums').add({ albumId, status: 'draft' })
  const fn = require('../buildAlbumJson/index').main
  const out = await fn(
    mockEvent({
      albumId,
      templateId: 'horse-newyear-v1',
      motionPreset: 'T1',
      music: { trackId: 'M1', title: 'x', url: 'https://x', defaultMuted: true },
      pages: [{ pageId: 'p001', pageType: 'cover', layoutId: 'cover-A', text: {}, assets: [] }]
    }),
    mockContext()
  )
  expect(out.code).toBe(0)
  expect(out.data.albumJsonFileId).toBeTruthy()
  const res = await db.collection('albums').where({ albumId }).limit(1).get()
  expect(res.data[0].albumJsonFileId).toBeTruthy()
  const downloaded = await storage.downloadFile({ fileID: res.data[0].albumJsonFileId })
  expect(downloaded.fileContent.toString('utf8')).toContain('"albumId":"album_json"')
})

test('getAlbumJson and getAlbumInfo read album.json', async () => {
  const { db, storage } = setupMocks()
  const albumId = 'album_read'
  const albumJson = { albumId, title: 't', subtitle: 's', blessing: 'b', shareImg: '', music: { trackId: 'M1' } }
  const file = await storage.uploadFile({ cloudPath: `albums/${albumId}/album.json`, fileContent: Buffer.from(JSON.stringify(albumJson)) })
  await db.collection('albums').add({ albumId, albumJsonFileId: file.fileID })

  const getAlbumJson = require('../getAlbumJson/index').main
  const out1 = await getAlbumJson(mockEvent({ albumId }), mockContext())
  expect(out1.code).toBe(0)
  expect(out1.data.albumId).toBe(albumId)

  const getAlbumInfo = require('../getAlbumInfo/index').main
  const out2 = await getAlbumInfo(mockEvent({ albumId }), mockContext())
  expect(out2.code).toBe(0)
  expect(out2.data.title).toBe('t')
})

test('genShareImg creates <=200KB 5:4 image and updates album.json', async () => {
  const { db, storage } = setupMocks()
  const albumId = 'album_share'
  const baseAlbum = { albumId, title: 't', subtitle: 's', blessing: 'b', shareImg: '', music: { trackId: 'M1' }, pages: [] }
  const albumFile = await storage.uploadFile({
    cloudPath: `albums/${albumId}/album.json`,
    fileContent: Buffer.from(JSON.stringify(baseAlbum))
  })
  const cover = await makeJpegBuffer()
  const coverFile = await storage.uploadFile({ cloudPath: `albums/${albumId}/images/large/cover.jpg`, fileContent: cover })
  await db.collection('albums').add({ albumId, albumJsonFileId: albumFile.fileID })

  const fn = require('../genShareImg/index').main
  const out = await fn(mockEvent({ albumId, coverFileId: coverFile.fileID }), mockContext())
  expect(out.code).toBe(0)

  const res = await db.collection('albums').where({ albumId }).limit(1).get()
  const updated = await storage.downloadFile({ fileID: res.data[0].albumJsonFileId })
  const updatedJson = JSON.parse(updated.fileContent.toString('utf8'))
  expect(updatedJson.shareImg).toBeTruthy()

  const shareBuf = await storage.downloadFile({ fileID: updatedJson.shareImg })
  expect(shareBuf.fileContent.length).toBeLessThanOrEqual(200 * 1024)
})

test('generatePoster produces jpeg poster', async () => {
  const { storage } = setupMocks()
  const fn = require('../generatePoster/index').main
  const cover = await makeJpegBuffer()
  const coverFile = await storage.uploadFile({ cloudPath: 'tmp/cover.jpg', fileContent: cover })

  const out = await fn(mockEvent({ albumId: 'album_poster', coverFileId: coverFile.fileID, title: '马年新春团圆年册' }), mockContext())
  expect(out.code).toBe(0)
  expect(out.data.posterFileId).toBeTruthy()

  const posterBuf = await storage.downloadFile({ fileID: out.data.posterFileId })
  const meta = await sharp(posterBuf.fileContent).metadata()
  expect(meta.width).toBe(1080)
  expect(meta.height).toBe(1920)
})

test('renderSharePage returns HTML in http mode', async () => {
  const { db, storage } = setupMocks()
  const albumId = 'album_html'
  const albumJson = { albumId, title: 't', subtitle: 's', blessing: 'b', shareImg: '', music: { trackId: 'M1' } }
  const albumFile = await storage.uploadFile({
    cloudPath: `albums/${albumId}/album.json`,
    fileContent: Buffer.from(JSON.stringify(albumJson))
  })
  await db.collection('albums').add({ albumId, albumJsonFileId: albumFile.fileID })

  const fn = require('../renderSharePage/index').main
  const out = await fn(
    { httpMethod: 'GET', queryStringParameters: { albumId } },
    mockContext()
  )
  expect(out.statusCode).toBe(200)
  expect(out.body).toContain('og:title')
})

test('reportAnalytics stores event', async () => {
  const { db } = setupMocks()
  const fn = require('../reportAnalytics/index').main
  const out = await fn(mockEvent({ eventName: 'h5_open', albumId: 'a', pageId: 'p1' }), mockContext({ requestId: 'rid' }))
  expect(out.code).toBe(0)
  const res = await db.collection('analytics').where({ eventName: 'h5_open' }).limit(1).get()
  expect(res.data[0].requestId).toBe('rid')
})
