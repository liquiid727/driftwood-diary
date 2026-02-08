const sharp = require('sharp')
const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { albumsCollection } = require('@horse/cf-shared/db')
const { getStorage } = require('@horse/cf-shared/tcb')
const { albumShareImgPath, albumJsonPath } = require('@horse/cf-shared/albumPaths')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  coverFileId: Joi.string().min(1).required()
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

async function uploadJson(cloudPath, obj) {
  const buf = Buffer.from(JSON.stringify(obj))
  const res = await getStorage().uploadFile({ cloudPath, fileContent: buf })
  return res && res.fileID ? res.fileID : ''
}

async function downloadJson(fileID) {
  const res = await getStorage().downloadFile({ fileID })
  const buf = Buffer.isBuffer(res.fileContent) ? res.fileContent : Buffer.from(res.fileContent)
  return JSON.parse(buf.toString('utf8'))
}

async function buildShareJpeg(coverBuf) {
  const base = sharp(coverBuf).rotate().resize(1000, 800, { fit: 'cover' })
  let quality = 78
  for (let i = 0; i < 6; i += 1) {
    const out = await base.clone().jpeg({ quality }).toBuffer()
    if (out.length <= 200 * 1024) return out
    quality -= 8
  }
  return base.jpeg({ quality: 45 }).toBuffer()
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const albumRes = await albumsCollection().where({ albumId: value.albumId }).limit(1).get()
  const album = (albumRes.data || [])[0]
  if (!album || !album.albumJsonFileId) return fail(404, 'album_not_found')

  const cover = await downloadToBuffer(value.coverFileId)
  const shareBuf = await buildShareJpeg(cover)
  const shareFileId = await uploadBuffer(albumShareImgPath(value.albumId), shareBuf)

  const albumJson = await downloadJson(album.albumJsonFileId)
  albumJson.shareImg = shareFileId
  albumJson.updatedAt = Date.now()
  const newAlbumJsonFileId = await uploadJson(albumJsonPath(value.albumId), albumJson)

  await albumsCollection()
    .where({ albumId: value.albumId })
    .update({
      shareImgFileId: shareFileId,
      albumJsonFileId: newAlbumJsonFileId,
      updatedAt: Date.now()
    })

  return ok({ albumId: value.albumId, fileId: shareFileId })
}
