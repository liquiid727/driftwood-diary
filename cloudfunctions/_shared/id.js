const crypto = require('crypto')

function newId(prefix) {
  const id = crypto.randomBytes(16).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

module.exports = { newId }

