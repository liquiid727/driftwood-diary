const { getDb } = require('./tcb')

const COLLECTION_ALBUMS = 'albums'
const COLLECTION_ANALYTICS = 'analytics'

function albumsCollection() {
  return getDb().collection(COLLECTION_ALBUMS)
}

function analyticsCollection() {
  return getDb().collection(COLLECTION_ANALYTICS)
}

module.exports = { COLLECTION_ALBUMS, COLLECTION_ANALYTICS, albumsCollection, analyticsCollection }

