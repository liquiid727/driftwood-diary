const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId, pickRequestId } = require('@horse/cf-shared/request')
const { analyticsCollection } = require('@horse/cf-shared/db')

const schema = Joi.object({
  eventName: Joi.string().min(1).max(64).required(),
  albumId: Joi.string().allow('').max(128).default(''),
  pageId: Joi.string().allow('').max(64).default(''),
  extra: Joi.object().unknown(true).default({})
})

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  await analyticsCollection().add({
    requestId: pickRequestId(context),
    createdAt: Date.now(),
    ...value
  })

  return ok({ stored: true })
}
