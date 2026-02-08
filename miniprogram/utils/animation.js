function createFadeIn() {
  const animation = wx.createAnimation({
    duration: 300,
    timingFunction: 'ease-out'
  })
  animation.opacity(0).translateY(8).step({ duration: 0 })
  animation.opacity(1).translateY(0).step()
  return animation.export()
}

module.exports = { createFadeIn }

