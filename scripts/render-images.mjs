// Renders the static images in public/ that are drawn from HTML templates:
//   scripts/og-image.html -> public/og-image.png       1200x630 link preview
//   scripts/icon.html     -> public/apple-touch-icon.png  180x180
//                         -> public/favicon.ico          16, 32 and 48 px
// Re-run after changing the name, role or theme colors:
//   npm run images            (needs `npm ci` for the fonts)
// Uses a locally installed Chrome or Chromium; set CHROME to pick one.
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const candidates = [process.env.CHROME, 'chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'].filter(Boolean)
const chrome = candidates.find(c => {
  try { execFileSync(c, ['--version'], { stdio: 'ignore' }); return true } catch { return false }
})
if (!chrome) throw new Error('No Chrome or Chromium found; set CHROME=/path/to/chrome')
if (!existsSync(new URL('../node_modules/@fontsource-variable/archivo/', import.meta.url))) {
  throw new Error('Fonts missing: run `npm ci` first')
}

const publicFile = name => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

function render (template, width, height, out) {
  execFileSync(chrome, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    // The templates load the fonts from node_modules over file://.
    '--allow-file-access-from-files',
    // Gives the web fonts time to load before the capture.
    '--virtual-time-budget=3000',
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    new URL(template, import.meta.url).href,
  ], { stdio: 'ignore' })
  console.log(`${out} (${Math.round(statSync(out).size / 1024)} KB)`)
}

render('og-image.html', 1200, 630, publicFile('og-image.png'))
render('icon.html?size=180&square', 180, 180, publicFile('apple-touch-icon.png'))

// An .ico is a small directory of images; modern ones can hold PNGs as is.
const tmp = mkdtempSync(join(tmpdir(), 'icons-'))
const pngs = [16, 32, 48].map(size => {
  const file = join(tmp, `${size}.png`)
  render(`icon.html?size=${size}`, size, size, file)
  return { size, data: readFileSync(file) }
})
const header = Buffer.alloc(6 + 16 * pngs.length)
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(pngs.length, 4)
let offset = header.length
pngs.forEach(({ size, data }, i) => {
  const entry = 6 + 16 * i
  header.writeUInt8(size, entry) // width
  header.writeUInt8(size, entry + 1) // height
  header.writeUInt16LE(1, entry + 4) // color planes
  header.writeUInt16LE(32, entry + 6) // bits per pixel
  header.writeUInt32LE(data.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += data.length
})
writeFileSync(publicFile('favicon.ico'), Buffer.concat([header, ...pngs.map(p => p.data)]))
rmSync(tmp, { recursive: true })
console.log(`${publicFile('favicon.ico')} (16, 32, 48 px)`)
