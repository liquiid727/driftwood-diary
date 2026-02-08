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

test('编辑页渲染并显示选择照片按钮', async () => {
  if (!miniProgram) return
  const page = await miniProgram.reLaunch('/pages/edit/index')
  await page.waitFor(200)
  const btn = await page.$('button')
  expect(btn).toBeTruthy()
})

