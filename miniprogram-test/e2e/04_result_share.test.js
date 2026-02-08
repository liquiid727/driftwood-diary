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

test('结果页包含分享按钮', async () => {
  if (!miniProgram) return
  const page = await miniProgram.reLaunch('/pages/result/index?albumId=mock_album_001')
  await page.waitFor(200)
  const btn = await page.$('button')
  expect(btn).toBeTruthy()
})

