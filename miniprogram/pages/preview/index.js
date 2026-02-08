const { h5PlayerBaseUrl } = require('../../config/env')

Page({
  data: {
    src: 'https://example.com'
  },
  onLoad(query) {
    const albumId = query && query.albumId ? query.albumId : ''
    const src = query && query.src ? decodeURIComponent(query.src) : albumId ? `${h5PlayerBaseUrl}?albumId=${encodeURIComponent(albumId)}` : 'https://example.com'
    this.setData({ src })
  },
  onHide() {
    const app = getApp()
    if (app.globalData.audioManager) {
      app.globalData.audioManager.pause()
    }
  }
})
