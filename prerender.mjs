import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const routes = ['/about', '/how-to-play', '/terms', '/contact']

// Start vite preview server
const server = exec('npx vite preview --port 4173')
await new Promise(r => setTimeout(r, 3000))

const browser = await puppeteer.launch({ headless: 'new' })
for (const route of routes) {
  const page = await browser.newPage()
  await page.goto(`http://localhost:4173${route}`, { waitUntil: 'networkidle0', timeout: 15000 })
  const html = await page.content()
  const dir = path.join('dist', route.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), html)
  console.log(`✓ Prerendered ${route}`)
}

await browser.close()
server.kill()
console.log('Done!')