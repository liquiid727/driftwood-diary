const mockAlbum = require('../../config/mock-album.json')
const { createFadeIn } = require('../../utils/animation')
const { loadAlbum, ensureShareImg, getTempUrl } = require('../../utils/album')

Page({
  data: {
    title: '',
    subtitle: '',
    albumId: '',
    shareImgUrl: '',
    enterAnim: null
  },
  async onLoad(query) {
    const albumId = query && query.albumId ? query.albumId : mockAlbum.albumId
    const album = await loadAlbum(albumId)
    const shareFileId = await ensureShareImg(album)
    const shareImgUrl = shareFileId ? await getTempUrl(shareFileId) : ''
    this.setData({
      title: album.title || '马年相册',
      subtitle: album.subtitle || '',
      albumId,
      shareImgUrl
    })
  },
  onShow() {
    this.setData({ enterAnim: createFadeIn() })
  },
  onShareAppMessage() {
    const path = `/pages/preview/index?albumId=${encodeURIComponent(this.data.albumId)}`
    return {
      title: this.data.title,
      path,
      imageUrl: this.data.shareImgUrl || ''
    }
  },
  onBackHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  }
})
