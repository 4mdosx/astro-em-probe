const puppeteer = require('puppeteer')
const fs = require('node:fs/promises')
const config = require('./config.json')
const { account, domain } = config

async function main () {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  async function checkAuth (page) {
    console.log('Connecting to ' + domain + ' to check...')
    await page.goto(domain + '/empire.aspx', { waitUntil: 'networkidle2' })

    const url = await page.url()
    if (url !== domain + '/empire.aspx') {
      console.log('Not logged in, using config to log in...')
      await page.goto(domain, { waitUntil: 'networkidle2' })
      await page.screenshot({ path: 'screenshot.png' })
      const input = await page.waitForSelector('form input[name="email"]')
      await input.click()
      await input.type(account.email)
      await page.keyboard.press('Tab')
      await page.keyboard.type(account.password)
      await page.keyboard.press('Enter')
      await input.dispose()
      await fs.writeFile('cookies.json', JSON.stringify(await page.cookies()), 'utf8')
      await page.goto(domain + '/empire.aspx', { waitUntil: 'networkidle2' })
      await page.screenshot({ path: 'screenshot.png' })
      if (await page.url() !== domain + '/empire.aspx') {
        console.log('Failed to log in, check credentials in config.json')
        process.exit(1)
      }
    }
    console.log('Logged in')
  }

  const cookies = JSON.parse(await fs.readFile('cookies.json', 'utf8'))
  await page.setCookie(...cookies)
  await checkAuth(page)
  await page.screenshot({ path: 'screenshot.png' })
  globalThis.page = page
  globalThis.browser = browser
}

const probe = {
  screenshot: async () => {
    await page.screenshot({ path: 'screenshot.png' })
    console.log('Screenshot taken')
    return 'ok'
  }
}
;(async () => {
  console.clear()
  console.log('--- Probe Online ---')
  await main()
  console.log('--- Probe Ready, Input Command ---')
})()