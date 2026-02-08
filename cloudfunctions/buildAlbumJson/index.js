const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { getStorage } = require('@horse/cf-shared/tcb')
const { albumsCollection } = require('@horse/cf-shared/db')
const { albumJsonPath } = require('@horse/cf-shared/albumPaths')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  title: Joi.string().max(64).allow('').default(''),
  subtitle: Joi.string().max(64).allow('').default(''),
  blessing: Joi.string().max(64).allow('').default(''),
  themeId: Joi.string().min(1).max(64).default('horseNewYear'),
  templateId: Joi.string().min(1).max(128).required(),
  motionPreset: Joi.string().valid('T1', 'T2', 'T3').default('T1'),
  music: Joi.object({
    trackId: Joi.string().min(1).max(16).required(),
    title: Joi.string().allow('').max(64).default(''),
    url: Joi.string().allow('').default(''),
    defaultMuted: Joi.boolean().default(true)
  }).required(),
  pages: Joi.array()
    .items(
      Joi.object({
        pageId: Joi.string().min(1).max(64).required(),
        pageType: Joi.string().min(1).max(32).required(),
        layoutId: Joi.string().min(1).max(64).required(),
        text: Joi.object().unknown(true).default({}),
        assets: Joi.array()
          .items(
            Joi.object({
              assetId: Joi.string().min(1).max(64).required(),
              urlThumb: Joi.string().allow('').default(''),
              urlMedium: Joi.string().allow('').default(''),
              urlLarge: Joi.string().allow('').default('')
            })
          )
          .default([])
      })
    )
    .min(1)
    .max(30)
    .required()
})

async function uploadJson(cloudPath, obj) {
  const buf = Buffer.from(JSON.stringify(obj))
  const res = await getStorage().uploadFile({ cloudPath, fileContent: buf })
  return res && res.fileID ? res.fileID : ''
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const now = Date.now()
  const albumJson = {
    version: 1,
    albumId: value.albumId,
    themeId: value.themeId,
    title: value.title,
    subtitle: value.subtitle,
    blessing: value.blessing,
    motionPreset: value.motionPreset,
    shareImg: '',
    music: value.music,
    pages: value.pages.map((p) => ({
      pageId: p.pageId,
      pageType: p.pageType,
      layoutId: p.layoutId,
      text: p.text,
      assets: p.assets.map((a) => ({
        assetId: a.assetId,
        urlThumb: a.urlThumb,
        urlMedium: a.urlMedium,
        urlLarge: a.urlLarge
      }))
    })),
    updatedAt: now
  }

  const fileID = await uploadJson(albumJsonPath(value.albumId), albumJson)
  await albumsCollection()
    .where({ albumId: value.albumId })
    .update({
      albumJsonFileId: fileID,
      status: 'albumJsonReady',
      updatedAt: now
    })

  return ok({ albumId: value.albumId, albumJsonFileId: fileID })
}
