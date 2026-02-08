const crypto = require('crypto')

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function hmacSha256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

function hmacSha256Hex(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex')
}

module.exports = { sha256Hex, hmacSha256, hmacSha256Hex }

