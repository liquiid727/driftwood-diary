const Joi = require('joi')

function validate(schema, payload) {
  const result = schema.validate(payload, { abortEarly: false, stripUnknown: true })
  if (result.error) {
    const details = result.error.details.map((d) => d.message).join('; ')
    return { value: null, errorMsg: details }
  }
  return { value: result.value, errorMsg: null }
}

module.exports = { Joi, validate }

