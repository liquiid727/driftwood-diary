const path = require('path')
const automator = require('miniprogram-automator')

async function launch() {
  const cliPath = process.env.WECHAT_IDE_CLI_PATH || ''
  const projectPath = process.env.MINIPROGRAM_PROJECT_PATH || path.resolve(__dirname, '../../')
  if (!cliPath) return null
  const miniProgram = await automator.launch({
    projectPath,
    cliPath
  })
  return miniProgram
}

module.exports = { launch }

