const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { albumsCollection } = require('@horse/cf-shared/db')
const { getStorage } = require('@horse/cf-shared/tcb')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required()
})

function pickDescription(albumJson) {
  const raw = (albumJson && (albumJson.blessing || albumJson.subtitle)) || ''
  const txt = String(raw).trim()
  if (!txt) return ''
  if (txt.length <= 32) return txt
  return txt.slice(0, 32)
}

async function downloadJson(fileID) {
  const res = await getStorage().downloadFile({ fileID })
  const buf = Buffer.isBuffer(res.fileContent) ? res.fileContent : Buffer.from(res.fileContent)
  return JSON.parse(buf.toString('utf8'))
}

async function tempUrl(fileID) {
  if (!fileID) return ''
  const res = await getStorage().getTempFileURL({ fileList: [{ fileID, maxAge: 3600 }] })
  const item = (res.fileList || [])[0]
  return (item && item.tempFileURL) || ''
}

function buildHtml(meta, playerUrl) {
  const title = meta.title || ''
  const desc = meta.description || ''
  const img = meta.image || ''
  const safePlayerUrl = playerUrl || ''
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${img}" />
  <meta name="description" content="${desc}" />
  <title>${title}</title>
  <style>html,body{margin:0;padding:0;height:100%;}iframe{border:0;width:100%;height:100%;}</style>
</head>
<body>
  <iframe src="${safePlayerUrl}" allow="autoplay; fullscreen" referrerpolicy="no-referrer"></iframe>
</body>
</html>`
}

exports.main = async (event, context) => {
  logRequestId(context)
  const mergedEvent = event && event.queryStringParameters ? { ...event.queryStringParameters, ...event } : event
  const { value, errorMsg } = validate(schema, mergedEvent || {})
  if (errorMsg) return fail(400, errorMsg)

  const albumRes = await albumsCollection().where({ albumId: value.albumId }).limit(1).get()
  const album = (albumRes.data || [])[0]
  if (!album || !album.albumJsonFileId) return fail(404, 'album_not_found')

  const albumJson = await downloadJson(album.albumJsonFileId)
  const imageUrl = await tempUrl(albumJson.shareImg || album.posterFileId || '')
  const base = process.env.H5_PLAYER_BASE_URL || ''
  const playerUrl = base ? `${base}?albumId=${encodeURIComponent(value.albumId)}` : ''
  const html = buildHtml(
    {
      title: albumJson.title || '相册',
      description: pickDescription(albumJson),
      image: imageUrl
    },
    playerUrl
  )

  if (event && (event.httpMethod || event.headers)) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html
    }
  }

  return ok({ albumId: value.albumId, html })
}
