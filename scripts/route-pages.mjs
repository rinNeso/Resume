// After `vite build`: give every project page its own index.html so GitHub
// Pages serves /projects/<id> with a 200 instead of a 404. The app is a
// single page; each copy boots it and the router shows the right project.
import { copyFileSync, mkdirSync } from 'node:fs'
import { details } from '../src/data/details.js'

const index = new URL('../dist/index.html', import.meta.url)
for (const id of Object.keys(details)) {
  const dir = new URL(`../dist/projects/${id}/`, import.meta.url)
  mkdirSync(dir, { recursive: true })
  copyFileSync(index, new URL('index.html', dir))
}
copyFileSync(index, new URL('../dist/404.html', import.meta.url))
console.log(`route pages: ${Object.keys(details).length} projects + 404.html`)
