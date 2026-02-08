const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { albumsCollection } = require('@horse/cf-shared/db')
const { getStorage } = require('@horse/cf-shared/tcb')

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required()
})

async function downloadJson(fileID) {
  const res = await getStorage().downloadFile({ fileID })
  const buf = Buffer.isBuffer(res.fileContent) ? res.fileContent : Buffer.from(res.fileContent)
  return JSON.parse(buf.toString('utf8'))
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const albumRes = await albumsCollection().where({ albumId: value.albumId }).limit(1).get()
  const album = (albumRes.data || [])[0]
  if (!album || !album.albumJsonFileId) return fail(404, 'album_not_found')

  const albumJson = await downloadJson(album.albumJsonFileId)
  return ok(albumJson)
}
