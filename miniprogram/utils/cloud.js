const mockAlbum = require('../config/mock-album.json')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function callFunctionOnce(name, data, timeoutMs) {
  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (done) return
      done = true
      reject(new Error('timeout'))
    }, timeoutMs)

    wx.cloud
      .callFunction({ name, data })
      .then((res) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(res && res.result ? res.result : res)
      })
      .catch((err) => {
        if (done) return
        done = true
        clearTimeout(timer)
        reject(err)
      })
  })
}

async function call(name, data, options) {
  const opts = options || {}
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 3000
  const retries = typeof opts.retries === 'number' ? opts.retries : 2
  const fallbackMock = Boolean(opts.fallbackMockAlbum)

  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await callFunctionOnce(name, data || {}, timeoutMs)
      const code = typeof result.code === 'number' ? result.code : 0
      if (code === 0) return result
      lastErr = new Error(result.msg || 'cloud_function_error')
    } catch (e) {
      lastErr = e
    }
    if (attempt < retries) {
      await sleep(120 * (attempt + 1))
    }
  }

  if (fallbackMock) {
    return { code: 0, data: mockAlbum, msg: 'fallback_mock' }
  }

  return { code: -1, data: null, msg: lastErr ? String(lastErr.message || lastErr) : 'unknown_error' }
}

module.exports = { call }

