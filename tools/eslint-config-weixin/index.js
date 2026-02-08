module.exports = {
  env: {
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script'
  },
  rules: {
    'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
    'no-undef': 'error',
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error'
  }
}

