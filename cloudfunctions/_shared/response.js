function ok(data) {
  return { code: 0, data, msg: 'ok' }
}

function fail(code, msg, data) {
  return { code, data: data || null, msg: msg || 'error' }
}

module.exports = { ok, fail }

