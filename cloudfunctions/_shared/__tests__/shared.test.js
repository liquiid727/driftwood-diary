const { sha256Hex } = require('@horse/cf-shared/crypto')
const { signDoubaoRequest } = require('@horse/cf-shared/doubaoSign')
const { albumJsonPath, albumShareImgPath, albumPosterPath } = require('@horse/cf-shared/albumPaths')
const { Joi, validate } = require('@horse/cf-shared/validate')

test('sha256Hex returns stable hash', () => {
  expect(sha256Hex('a')).toBe(sha256Hex('a'))
  expect(sha256Hex('a')).not.toBe(sha256Hex('b'))
})

test('albumPaths builds expected paths', () => {
  expect(albumJsonPath('x')).toBe('albums/x/album.json')
  expect(albumPosterPath('x')).toBe('albums/x/poster.jpg')
  expect(albumShareImgPath('x')).toBe('albums/x/share/share-5x4.jpg')
})

test('validate strips unknown and reports message', () => {
  const schema = Joi.object({ a: Joi.number().required() })
  const ok = validate(schema, { a: 1, b: 2 })
  expect(ok.errorMsg).toBe(null)
  expect(ok.value.b).toBeUndefined()
  const bad = validate(schema, { b: 2 })
  expect(bad.errorMsg).toContain('"a"')
})

test('signDoubaoRequest produces required headers', () => {
  const body = JSON.stringify({ x: 1 })
  const signed = signDoubaoRequest({
    accessKey: 'ak',
    secretKey: 'sk',
    host: 'example.com',
    region: 'cn-north-1',
    service: 'doubao',
    method: 'POST',
    canonicalUri: '/api/v3/chat/completions',
    queryString: '',
    body
  })
  expect(signed.headers).toHaveProperty('Authorization')
  expect(signed.headers).toHaveProperty('x-content-sha256')
  expect(signed.headers['x-content-sha256']).toBe(sha256Hex(body))
})

test('postJson uses axios with POST', async () => {
  jest.resetModules()
  const axiosMock = jest.fn(async () => ({ data: { ok: true } }))
  jest.doMock('axios', () => axiosMock)
  const { postJson } = require('@horse/cf-shared/http')
  const out = await postJson('https://example.com/api', { a: 1 }, { h: 'v' }, 1234)
  expect(out.ok).toBe(true)
  expect(axiosMock).toHaveBeenCalledWith({
    method: 'POST',
    url: 'https://example.com/api',
    data: { a: 1 },
    headers: { h: 'v' },
    timeout: 1234
  })
})

test('tcb exports getDb/getStorage via initialized app', () => {
  jest.resetModules()
  const initMock = jest.fn(() => ({
    database: () => ({ tag: 'db' }),
    storage: () => ({ tag: 'storage' })
  }))
  jest.doMock('tcb-admin-node', () => ({
    init: initMock,
    SYMBOL_CURRENT_ENV: '__ENV__'
  }))
  const { getDb, getStorage } = require('@horse/cf-shared/tcb')
  expect(getDb().tag).toBe('db')
  expect(getStorage().tag).toBe('storage')
})
