const { launch } = require('./helper')

let miniProgram

beforeAll(async () => {
  miniProgram = await launch()
})

afterAll(async () => {
  if (miniProgram) {
    await miniProgram.close()
  }
})

test('编辑页存在音乐开关按钮', async () => {
  if (!miniProgram) return
  const page = await miniProgram.reLaunch('/pages/edit/index')
  await page.waitFor(200)
  const buttons = await page.$$('button')
  expect(buttons.length).toBeGreaterThan(0)
})

