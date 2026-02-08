const { call } = require('./cloud')
const { getWithExpiry, setWithExpiry } = require('./cache')
const mockAlbum = require('../config/mock-album.json')

function albumCacheKey(albumId) {
  return `album_${albumId}`
}

async function loadAlbum(albumId) {
  const cached = getWithExpiry(albumCacheKey(albumId))
  if (cached) return cached

  const res = await call('getAlbumJson', { albumId }, { fallbackMockAlbum: true })
  const album = res && res.code === 0 ? res.data : mockAlbum
  setWithExpiry(albumCacheKey(albumId), album)
  return album
}

async function ensureShareImg(album) {
  if (album && album.shareImg) return album.shareImg
  const coverPage = (album.pages || [])[0] || {}
  const coverAsset = (coverPage.assets || [])[0] || {}
  const coverFileId = coverAsset.urlLarge || coverAsset.urlMedium || coverAsset.urlThumb || ''
  if (!coverFileId) return ''

  const gen = await call('genShareImg', { albumId: album.albumId, coverFileId }, { timeoutMs: 3000, retries: 2 })
  if (gen.code !== 0) return ''
  const fileId = gen.data && (gen.data.fileId || gen.data.fileID) ? (gen.data.fileId || gen.data.fileID) : gen.data
  if (!fileId) return ''

  album.shareImg = fileId
  setWithExpiry(albumCacheKey(album.albumId), album)
  return fileId
}

async function getTempUrl(fileId) {
  if (!fileId) return ''
  const res = await wx.cloud.getTempFileURL({
    fileList: [{ fileID: fileId, maxAge: 3600 }]
  })
  const item = (res.fileList || [])[0]
  return item && item.tempFileURL ? item.tempFileURL : ''
}

module.exports = { loadAlbum, ensureShareImg, getTempUrl }
