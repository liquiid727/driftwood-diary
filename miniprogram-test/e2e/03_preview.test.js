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

test('预览页可打开 WebView', async () => {
  if (!miniProgram) return
  const page = await miniProgram.reLaunch('/pages/preview/index?src=https%3A%2F%2Fexample.com')
  await page.waitFor(200)
  const webview = await page.$('web-view')
  expect(webview).toBeTruthy()
})

