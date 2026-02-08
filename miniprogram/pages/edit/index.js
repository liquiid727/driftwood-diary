const tracksConfig = require('../../config/music')
const { createFadeIn } = require('../../utils/animation')
const { createAudioManager } = require('../../utils/audio')
const { buildPagesFromPhotos } = require('../../utils/organize')
const { h5PlayerBaseUrl } = require('../../config/env')
const { call } = require('../../utils/cloud')

Page({
  data: {
    photos: [],
    tracks: tracksConfig,
    selectedTrackId: 'M1',
    musicEnabled: false,
    enterAnim: null,
    publishing: false,
    publishText: '建议：照片越多越好看（80-200 张最佳），发布约 1-3 分钟'
  },
  onShow() {
    this.setData({ enterAnim: createFadeIn() })
  },
  onLoad() {
    const app = getApp()
    if (!app.globalData.audioManager) {
      app.globalData.audioManager = createAudioManager()
    }
  },
  onChoosePhotos() {
    wx.chooseMedia({
      count: 200,
      mediaType: ['image'],
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = (res.tempFiles || []).map((f, idx) => ({
          id: `p_${idx + 1}`,
          path: f.tempFilePath,
          size: f.size || 0,
          capturedAt: 0
        }))
        this.setData({ photos: files })
        const app = getApp()
        const pages = buildPagesFromPhotos(files)
        app.globalData.draft = { selectedTrackId: this.data.selectedTrackId, photos: files, pages }
      }
    })
  },
  async onMusicChange(e) {
    const selectedTrackId = e.detail.value
    this.setData({ selectedTrackId })
    const app = getApp()
    if (app.globalData.draft) {
      app.globalData.draft.selectedTrackId = selectedTrackId
    }
    const track = (this.data.tracks || []).find((t) => t.trackId === selectedTrackId) || null
    if (!track || !track.fileId) return
    const res = await wx.cloud.getTempFileURL({ fileList: [{ fileID: track.fileId, maxAge: 3600 }] })
    const url = (res.fileList || [])[0] && (res.fileList || [])[0].tempFileURL ? (res.fileList || [])[0].tempFileURL : ''
    if (!url) return
    app.globalData.audioManager.setTrack({ trackId: track.trackId, title: track.title, url })
    if (this.data.musicEnabled) {
      app.globalData.audioManager.enable()
    }
  },
  onToggleMusic() {
    const app = getApp()
    const enabled = !this.data.musicEnabled
    this.setData({ musicEnabled: enabled })
    if (enabled) {
      app.globalData.audioManager.enable()
    } else {
      app.globalData.audioManager.pause()
    }
  },
  onPreview() {
    const app = getApp()
    const albumId = (app.globalData.currentAlbumId || '').trim()
    const src = `${h5PlayerBaseUrl}?albumId=${encodeURIComponent(albumId || 'mock')}`
    wx.navigateTo({ url: `/pages/preview/index?src=${encodeURIComponent(src)}&albumId=${encodeURIComponent(albumId || 'mock')}` })
  },
  async onPublish() {
    if (this.data.publishing) return
    if (!this.data.photos.length) return

    this.setData({ publishing: true, publishText: '创建草稿中...' })
    const app = getApp()

    const templateId = 'horse-newyear-v1'
    const themeId = 'horseNewYear'
    const assetsMeta = this.data.photos.map((p) => ({
      assetId: p.id,
      name: String(p.path || '').split('/').pop() || '',
      mime: 'image/jpeg',
      size: p.size || 0,
      capturedAt: p.capturedAt || 0
    }))

    const created = await call('createPublishJob', { templateId, themeId, assetsMeta }, { timeoutMs: 3000, retries: 2 })
    if (!created || created.code !== 0 || !created.data || !created.data.albumId) {
      this.setData({ publishing: false, publishText: '创建失败，已降级为本地预览' })
      wx.showToast({ title: '创建失败', icon: 'none' })
      return
    }

    const albumId = created.data.albumId
    app.globalData.currentAlbumId = albumId

    const uploadedAssets = []
    const photos = this.data.photos.slice()
    let cursor = 0
    const poolSize = 3

    const uploadWorker = async () => {
      while (true) {
        const i = cursor
        cursor += 1
        if (i >= photos.length) return
        const p = photos[i]
        this.setData({ publishText: `上传照片 ${i + 1}/${photos.length} ...` })
        const ext = (String(p.path).split('.').pop() || 'jpg').toLowerCase()
        const cloudPath = `albums/${albumId}/images/original/${p.id}.${ext}`
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: p.path })
        uploadedAssets.push({ assetId: p.id, fileId: up.fileID })
      }
    }

    try {
      await Promise.all(Array.from({ length: poolSize }).map(() => uploadWorker()))
    } catch (e) {
      this.setData({ publishing: false, publishText: '上传失败，已降级为本地预览' })
      wx.showToast({ title: '上传失败', icon: 'none' })
      return
    }

    await call('finalizeUpload', { albumId, uploadedAssets }, { timeoutMs: 3000, retries: 2 })

    this.setData({ publishText: '生成多规格图片中...' })
    const processed = await call(
      'processAssets',
      {
        albumId,
        assets: uploadedAssets.map((x) => ({ assetId: x.assetId, originalFileId: x.fileId }))
      },
      { timeoutMs: 3000, retries: 2 }
    )
    if (!processed || processed.code !== 0 || !processed.data || !Array.isArray(processed.data.assets)) {
      this.setData({ publishing: false, publishText: '处理失败，已降级为本地预览' })
      wx.showToast({ title: '处理失败', icon: 'none' })
      return
    }

    const assetMap = new Map()
    for (const a of processed.data.assets) {
      assetMap.set(a.assetId, {
        urlThumb: a.thumbFileId || '',
        urlMedium: a.mediumFileId || '',
        urlLarge: a.largeFileId || ''
      })
    }

    const draft = app.globalData.draft || { pages: buildPagesFromPhotos(this.data.photos) }
    const pageMetas = (draft.pages || []).map((p) => ({
      pageType: p.pageType,
      layoutId: p.layoutId,
      imageSummary: {
        count: (p.assets || []).length
      }
    }))

    this.setData({ publishText: 'AI 生成文案中（失败会自动回退）...' })
    const ai = await call(
      'generateAiText',
      {
        albumId,
        themeId,
        templateId,
        tone: 'warm',
        strength: 'normal',
        pages: pageMetas
      },
      { timeoutMs: 3000, retries: 2 }
    )
    const aiResult = ai && ai.code === 0 ? ai.data.result : null

    const cover = (aiResult && aiResult.cover) || { title: '马年新春相册', subtitle: '把团圆装订成册', blessing: '' }
    const pageTexts = (aiResult && aiResult.pages) || []

    const musicTrack = (this.data.tracks || []).find((t) => t.trackId === this.data.selectedTrackId) || this.data.tracks[0]
    let musicUrl = ''
    if (musicTrack && musicTrack.fileId) {
      try {
        const res = await wx.cloud.getTempFileURL({ fileList: [{ fileID: musicTrack.fileId, maxAge: 3600 }] })
        musicUrl = (res.fileList || [])[0] && (res.fileList || [])[0].tempFileURL ? (res.fileList || [])[0].tempFileURL : ''
      } catch (e) {
        musicUrl = ''
      }
    }

    const pages = (draft.pages || []).map((p, idx) => {
      const assets = (p.assets || []).map((x) => {
        const map = assetMap.get(x.assetId) || { urlThumb: '', urlMedium: '', urlLarge: '' }
        return { assetId: x.assetId, ...map }
      })
      return {
        pageId: p.pageId,
        pageType: p.pageType,
        layoutId: p.layoutId,
        text: pageTexts[idx] || {},
        assets
      }
    })

    this.setData({ publishText: '固化 album.json 中...' })
    const built = await call(
      'buildAlbumJson',
      {
        albumId,
        themeId,
        templateId,
        motionPreset: 'T1',
        title: cover.title || '马年新春相册',
        subtitle: cover.subtitle || '',
        blessing: cover.blessing || '',
        music: { trackId: musicTrack.trackId, title: musicTrack.title, url: musicUrl, defaultMuted: true },
        pages
      },
      { timeoutMs: 3000, retries: 2 }
    )
    if (!built || built.code !== 0) {
      this.setData({ publishing: false, publishText: '发布失败，已降级为本地预览' })
      wx.showToast({ title: '发布失败', icon: 'none' })
      return
    }

    const coverAsset = (pages[0] && pages[0].assets && pages[0].assets[0]) || null
    const coverFileId = coverAsset ? coverAsset.urlLarge || coverAsset.urlMedium || coverAsset.urlThumb : ''
    if (coverFileId) {
      await call(
        'generatePoster',
        { albumId, coverFileId, title: cover.title || '', subtitle: cover.subtitle || '' },
        { timeoutMs: 3000, retries: 1 }
      )
      await call('genShareImg', { albumId, coverFileId }, { timeoutMs: 3000, retries: 1 })
    }

    this.setData({ publishing: false, publishText: '发布成功，已生成分享图' })
    wx.navigateTo({ url: `/pages/result/index?albumId=${encodeURIComponent(albumId)}` })
  },
  onHide() {
    const app = getApp()
    if (app.globalData.audioManager) {
      app.globalData.audioManager.pause()
    }
  }
})
