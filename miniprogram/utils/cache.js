const { cacheKeyPrefix, cacheTtlMs } = require('../config/env')

function now() {
  return Date.now()
}

function buildKey(key) {
  return `${cacheKeyPrefix}${key}`
}

function setWithExpiry(key, value, ttlMs) {
  const ttl = typeof ttlMs === 'number' ? ttlMs : cacheTtlMs
  wx.setStorageSync(buildKey(key), {
    value,
    expiresAt: now() + ttl
  })
}

function getWithExpiry(key) {
  const raw = wx.getStorageSync(buildKey(key))
  if (!raw || typeof raw !== 'object') return null
  if (!raw.expiresAt || raw.expiresAt <= now()) {
    wx.removeStorageSync(buildKey(key))
    return null
  }
  return raw.value
}

module.exports = { setWithExpiry, getWithExpiry }

