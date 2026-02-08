function createAudioManager() {
  const ctx = wx.createInnerAudioContext()
  ctx.loop = true

  let enabled = false
  let current = { trackId: '', title: '', url: '' }

  function setTrack(track) {
    current = {
      trackId: track.trackId || '',
      title: track.title || '',
      url: track.url || ''
    }
    if (enabled && current.url) {
      ctx.src = current.url
      ctx.play()
    }
  }

  function enable() {
    enabled = true
    if (current.url) {
      ctx.src = current.url
      ctx.play()
    }
  }

  function pause() {
    ctx.pause()
  }

  function stop() {
    ctx.stop()
  }

  function disable() {
    enabled = false
    stop()
  }

  function isEnabled() {
    return enabled
  }

  function getCurrent() {
    return current
  }

  return { setTrack, enable, pause, stop, disable, isEnabled, getCurrent, _ctx: ctx }
}

module.exports = { createAudioManager }

