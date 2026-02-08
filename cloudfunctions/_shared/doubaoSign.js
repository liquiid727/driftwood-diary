const { sha256Hex, hmacSha256, hmacSha256Hex } = require('./crypto')

function toAmzDate(date) {
  const pad = (n) => `${n}`.padStart(2, '0')
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}` +
    'T' +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}` +
    'Z'
  )
}

function toDateStamp(date) {
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

function buildCanonicalHeaders(headers) {
  const keys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
  const canonicalHeaders = keys
    .map((k) => `${k}:${String(headers[k]).trim()}\n`)
    .join('')
  const signedHeaders = keys.join(';')
  return { canonicalHeaders, signedHeaders }
}

function signDoubaoRequest(params) {
  const {
    accessKey,
    secretKey,
    host,
    region,
    service,
    method,
    canonicalUri,
    queryString,
    body
  } = params

  const now = new Date()
  const xDate = toAmzDate(now)
  const dateStamp = toDateStamp(now)
  const payloadHash = sha256Hex(body)

  const headers = {
    host,
    'content-type': 'application/json',
    'x-date': xDate,
    'x-content-sha256': payloadHash
  }

  const { canonicalHeaders, signedHeaders } = buildCanonicalHeaders(headers)

  const canonicalRequest =
    `${method}\n` +
    `${canonicalUri}\n` +
    `${queryString || ''}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`

  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/request`
  const stringToSign =
    `${algorithm}\n` +
    `${xDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`

  const kDate = hmacSha256(secretKey, dateStamp)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  const kSigning = hmacSha256(kService, 'request')
  const signature = hmacSha256Hex(kSigning, stringToSign)

  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    headers: {
      ...headers,
      Authorization: authorization
    }
  }
}

module.exports = { signDoubaoRequest }

