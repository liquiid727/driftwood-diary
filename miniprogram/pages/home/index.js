const mockAlbum = require('../../config/mock-album.json')
const { createFadeIn } = require('../../utils/animation')

Page({
  data: {
    title: '马年新春相册',
    subtitle: '选择照片，一键生成带动效与音乐的 H5 相册',
    wall: [],
    enterAnim: null
  },
  onLoad() {
    const wall = []
    for (let i = 0; i < 9; i += 1) {
      wall.push({ id: `w${i + 1}`, url: '' })
    }
    const firstPage = (mockAlbum.pages || [])[0] || {}
    const coverAsset = (firstPage.assets || [])[0] || {}
    wall[0].url = coverAsset.thumbUrl || coverAsset.mediumUrl || coverAsset.largeUrl || ''
    this.setData({ wall })
  },
  onShow() {
    this.setData({ enterAnim: createFadeIn() })
  },
  onStart() {
    wx.navigateTo({ url: '/pages/edit/index' })
  }
})
