const sharp = require('sharp')
const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { getStorage } = require('@horse/cf-shared/tcb')
const { albumPosterPath } = require('@horse/cf-shared/albumPaths')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  coverFileId: Joi.string().min(1).required(),
  title: Joi.string().allow('').max(24).default(''),
  subtitle: Joi.string().allow('').max(32).default(''),
  hint: Joi.string().allow('').max(32).default('长按识别，打开相册'),
  qrFileId: Joi.string().allow('').default('')
})

async function downloadToBuffer(fileID) {
  const res = await getStorage().downloadFile({ fileID })
  if (!res || !res.fileContent) {
    throw new Error('downloadFile_failed')
  }
  return Buffer.isBuffer(res.fileContent) ? res.fileContent : Buffer.from(res.fileContent)
}

async function uploadBuffer(cloudPath, buffer) {
  const res = await getStorage().uploadFile({
    cloudPath,
    fileContent: buffer
  })
  return res && res.fileID ? res.fileID : ''
}

function buildOverlaySvg(input) {
  const title = String(input.title || '').trim() || '马年新春相册'
  const subtitle = String(input.subtitle || '').trim() || '把团圆装订成册'
  const hint = String(input.hint || '').trim() || '长按识别，打开相册'
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  <defs>
    <linearGradient id="fade" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1080" height="1920" fill="url(#fade)"/>
  <rect x="72" y="1460" width="936" height="372" rx="36" fill="#FFF6E8" fill-opacity="0.92"/>
  <text x="112" y="1548" font-size="52" font-family="PingFang SC, Microsoft YaHei, Arial" font-weight="700" fill="#1F1A17">${title}</text>
  <text x="112" y="1616" font-size="30" font-family="PingFang SC, Microsoft YaHei, Arial" font-weight="400" fill="#1F1A17" opacity="0.78">${subtitle}</text>
  <text x="112" y="1726" font-size="28" font-family="PingFang SC, Microsoft YaHei, Arial" font-weight="400" fill="#1F1A17" opacity="0.78">${hint}</text>
  <rect x="760" y="1520" width="220" height="220" rx="24" fill="#FFFFFF" stroke="#F5C542" stroke-width="6"/>
  <text x="870" y="1784" font-size="24" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, Arial" font-weight="500" fill="#1F1A17" opacity="0.72">扫码打开</text>
</svg>`)
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const cover = await downloadToBuffer(value.coverFileId)
  const base = sharp(cover)
    .rotate()
    .resize(1080, 1920, { fit: 'cover' })
  const overlaySvg = buildOverlaySvg(value)

  const composites = [{ input: overlaySvg, left: 0, top: 0 }]
  if (value.qrFileId) {
    try {
      const qrBuf = await downloadToBuffer(value.qrFileId)
      const qrPng = await sharp(qrBuf).rotate().resize(220, 220, { fit: 'cover' }).png().toBuffer()
      composites.push({ input: qrPng, left: 760, top: 1520 })
    } catch (e) {}
  }

  const poster = await base.composite(composites).jpeg({ quality: 82 }).toBuffer()

  const fileID = await uploadBuffer(albumPosterPath(value.albumId), poster)
  return ok({ albumId: value.albumId, posterFileId: fileID })
}
