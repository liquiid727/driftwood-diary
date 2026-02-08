const sharp = require('sharp')
const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { getStorage } = require('@horse/cf-shared/tcb')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  assets: Joi.array()
    .items(
      Joi.object({
        assetId: Joi.string().min(1).max(64).required(),
        originalFileId: Joi.string().min(1).required()
      })
    )
    .min(1)
    .max(500)
    .required()
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

async function resizeJpeg(buffer, width, quality) {
  return sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer()
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const results = []
  for (const asset of value.assets) {
    const item = {
      assetId: asset.assetId,
      originalFileId: asset.originalFileId,
      thumbFileId: '',
      mediumFileId: '',
      largeFileId: '',
      error: ''
    }
    try {
      const original = await downloadToBuffer(asset.originalFileId)
      try {
        const thumbBuf = await resizeJpeg(original, 360, 70)
        item.thumbFileId = await uploadBuffer(`albums/${value.albumId}/images/thumb/${asset.assetId}.jpg`, thumbBuf)
      } catch (e) {
        item.error = item.error || 'thumb_failed'
      }

      try {
        const mediumBuf = await resizeJpeg(original, 720, 72)
        item.mediumFileId = await uploadBuffer(
          `albums/${value.albumId}/images/medium/${asset.assetId}.jpg`,
          mediumBuf
        )
      } catch (e) {
        item.error = item.error || 'medium_failed'
      }

      try {
        const largeBuf = await resizeJpeg(original, 1440, 75)
        item.largeFileId = await uploadBuffer(`albums/${value.albumId}/images/large/${asset.assetId}.jpg`, largeBuf)
      } catch (e) {
        item.error = item.error || 'large_failed'
      }
    } catch (e) {
      item.error = item.error || 'download_failed'
    }

    results.push(item)
  }

  return ok({ albumId: value.albumId, assets: results })
}
