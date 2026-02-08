const axios = require('axios')

async function postJson(url, body, headers, timeoutMs) {
  const res = await axios({
    method: 'POST',
    url,
    data: body,
    headers,
    timeout: timeoutMs
  })
  return res.data
}

module.exports = { postJson }

