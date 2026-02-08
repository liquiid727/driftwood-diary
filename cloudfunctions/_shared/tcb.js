const tcb = require('tcb-admin-node')

let app = null

function getApp() {
  if (app) return app
  app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })
  return app
}

function getDb() {
  return getApp().database()
}

function getStorage() {
  return getApp().storage()
}

module.exports = { getApp, getDb, getStorage }

