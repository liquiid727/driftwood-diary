const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { albumsCollection } = require('@horse/cf-shared/db')
const { newId } = require('@horse/cf-shared/id')

const schema = Joi.object({
  templateId: Joi.string().min(1).max(128).required(),
  themeId: Joi.string().min(1).max(64).default('horseNewYear'),
  assetsMeta: Joi.array()
    .items(
      Joi.object({
        assetId: Joi.string().min(1).max(64).required(),
        name: Joi.string().allow('').max(256).default(''),
        mime: Joi.string().allow('').max(64).default(''),
        width: Joi.number().integer().min(1).max(20000).optional(),
        height: Joi.number().integer().min(1).max(20000).optional(),
        size: Joi.number().integer().min(0).max(1024 * 1024 * 50).optional(),
        capturedAt: Joi.number().integer().min(0).optional()
      })
    )
    .max(500)
    .default([])
})

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const albumId = newId('album')
  const now = Date.now()

  await albumsCollection().add({
    albumId,
    themeId: value.themeId,
    templateId: value.templateId,
    assetsMeta: value.assetsMeta,
    status: 'draft',
    createdAt: now,
    updatedAt: now
  })

  return ok({ albumId })
}
