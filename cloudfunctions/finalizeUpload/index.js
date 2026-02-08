const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { albumsCollection } = require('@horse/cf-shared/db')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  uploadedAssets: Joi.array()
    .items(
      Joi.object({
        assetId: Joi.string().min(1).max(64).required(),
        fileId: Joi.string().min(1).required()
      })
    )
    .max(500)
    .default([])
})

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const now = Date.now()
  await albumsCollection()
    .where({ albumId: value.albumId })
    .update({
      uploadedAssets: value.uploadedAssets,
      status: 'uploaded',
      updatedAt: now
    })

  return ok({ albumId: value.albumId })
}
