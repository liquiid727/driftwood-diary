const { cloudEnvId } = require('./config/env')

App({
  globalData: {
    currentAlbumId: '',
    draft: null
  },
  onLaunch() {
    if (!wx.cloud) {
      return
    }
    wx.cloud.init({
      env: cloudEnvId,
      traceUser: true
    })
  }
})

