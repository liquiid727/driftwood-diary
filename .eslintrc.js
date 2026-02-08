module.exports = {
  root: true,
  extends: ['weixin'],
  env: {
    es6: true
  },
  globals: {
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    getApp: 'readonly',
    Component: 'readonly',
    require: 'readonly',
    module: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly'
  },
  overrides: [
    {
      files: ['cloudfunctions/**/*.js', 'tools/**/*.js', '*.config.js'],
      env: { node: true }
    },
    {
      files: ['cloudfunctions/**/__tests__/**/*.js', 'miniprogram-test/**/*.js'],
      env: { node: true, jest: true }
    }
  ]
}
