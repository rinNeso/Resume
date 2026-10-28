// After `vite build`: give every project page its own index.html so GitHub
// Pages serves /projects/<id>/ with a 200 instead of a 404, and give each
// page its own title, description, link-preview tags and canonical URL.
// Link unfurlers and many crawlers don't run JS, so this is what they see.
// Each page also gets a <noscript> copy of its content from src/data, for
// readers and tools without JavaScript. Also writes 404.html (unknown paths
// boot the app, which shows "Page not found"), sitemap.xml and robots.txt.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { education, experience, profile, projects, skills, summary } from '../src/data/resume.js'
import { details } from '../src/data/details.js'

const SITE = 'https://resume.heiland.tv'
const PDF = '/Nathan-Heiland-Resume.pdf'
const SOURCE = 'https://github.com/rinNeso/Resume'
const dist = new URL('../dist/', import.meta.url)
const template = readFileSync(new URL('index.html', dist), 'utf8')
const withPages = projects.filter(p => details[p.id])

// --- escaping ---------------------------------------------------------------

// Plain text from the data files, for element content or an attribute value.
const esc = s => String(s)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

// Attribute values as the browser reads them: entities decoded, so the href
// check sees the real URL and esc() doesn't double up '&amp;'.
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: '\u00a0' }
const decode = s => s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, name) => {
  if (name) return NAMED[name.toLowerCase()] ?? m
  const code = dec ? Number(dec) : parseInt(hex, 16)
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m
})

// Fields the app renders with v-html (points, paragraphs, role, skills) may
// hold inline <a> and <strong>. Keep exactly those, rebuilt with only href
// (web, mail or site-relative), target and rel, and escape everything else.
// Existing entities are kept so the text reads the same as in the app.
// Quoted values may contain '>'; an attribute name must stand on its own, so
// data-href isn't taken for href.
const INLINE_TAG = /<(\/?)(a|strong)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi
const SAFE_HREF = /^(?:https?:|mailto:|\/|#)/i
const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m ? decode(m[1] ?? m[2]) : null
}
function inlineHtml (value) {
  const s = String(value)
  let out = ''
  let last = 0
  for (const m of s.matchAll(INLINE_TAG)) {
    out += escText(s.slice(last, m.index))
    const [, close, tag, attrs] = m
    const name = tag.toLowerCase()
    if (close) out += `</${name}>`
    else if (name === 'a') {
      const kept = ['href', 'target', 'rel']
        .map(a => [a, attr(attrs, a)])
        .filter(([a, v]) => v !== null && (a !== 'href' || SAFE_HREF.test(v)))
        .map(([a, v]) => ` ${a}="${esc(v)}"`)
        .join('')
      out += `<a${kept}>`
    } else out += `<${name}>`
    last = m.index + m[0].length
  }
  return out + escText(s.slice(last))
}
function escText (s) {
  return s
    .replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

// --- page content without JS ------------------------------------------------

// Joins the non-empty parts of a page, one per line.
const lines = (...parts) => parts.filter(Boolean).join('\n')
const list = (items, render = inlineHtml) =>
  items?.length ? `<ul>${items.map(i => `<li>${render(i)}</li>`).join('')}</ul>` : ''
const external = (href, text) => `<a href="${esc(href)}" rel="noopener">${esc(text)}</a>`

const contact = `<p>
  <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> ·
  ${external(`https://github.com/${profile.github}`, `github.com/${profile.github}`)} ·
  <a href="${PDF}">Download the resume (PDF)</a>
</p>`

function homeContent () {
  const jobs = experience.map(j => `<h3>${esc(j.title)}</h3>
<p class="meta">${esc(j.org)}${j.grade ? ` · ${esc(j.grade)}` : ''} · ${esc(j.when)} · ${esc(j.where)}</p>
${list(j.points)}`).join('\n')
  const work = projects.map(p => {
    const name = details[p.id] ? `<a href="/projects/${esc(p.id)}/">${esc(p.name)}</a>` : esc(p.name)
    return `<li><strong>${name}</strong>: ${esc(p.lede)}</li>`
  }).join('')
  return `<p class="meta">${esc(profile.location)} · ${esc(profile.title)}</p>
<h1>${esc(profile.name)}</h1>
<p>${inlineHtml(profile.role)}</p>
${list(profile.credentials.map(c => c.text), esc)}
${contact}
<p>${esc(summary)}</p>
<h2>Experience</h2>
${jobs}
<h2>Projects</h2>
<ul>${work}</ul>
<h2>Skills</h2>
<ul>${skills.map(([label, items]) => `<li><strong>${esc(label)}:</strong> ${inlineHtml(items)}</li>`).join('')}</ul>
<h2>Education</h2>
<ul>${education.map(e => `<li><strong>${esc(e.school)}</strong> · ${esc(e.detail)} · ${esc(e.when)}</li>`).join('')}</ul>`
}

function projectContent (p) {
  const d = details[p.id]
  const repo = p.repo && !p.private
    ? `<p>${external(`https://github.com/${p.repo}`, `github.com/${p.repo}`)}</p>`
    : `<p class="meta">${p.private ? 'Private repo' : esc(p.where ?? '')}</p>`
  const specs = p.specs?.length
    ? `<ul>${p.specs.map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join('')}</ul>`
    : ''
  // A terminal preview is real text, and the page's copy refers back to it
  // ("like the output above"), so it comes along; the other previews are
  // pictures and stay out, captions and all.
  const preview = d.preview?.type === 'terminal' && `<figure>${
    d.preview.title ? `<p class="meta">${esc(d.preview.title)}</p>` : ''}<pre>${esc(d.preview.text)}</pre>${
    d.preview.caption ? `<figcaption class="meta">${esc(d.preview.caption)}</figcaption>` : ''}</figure>`
  const sections = (d.sections ?? []).map(s => lines(
    `<h2>${esc(s.title)}</h2>`,
    s.quote && `<blockquote>${esc(s.quote)}</blockquote>`,
    s.table && `<table><thead><tr>${s.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${
      s.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
    ...(s.paragraphs ?? []).map(t => `<p>${inlineHtml(t)}</p>`),
    list(s.points),
  ))
  return lines(
    `<p class="meta"><a href="/">${esc(profile.name)}</a> · ${esc(p.kind)}</p>`,
    `<h1>${esc(p.name)}</h1>`,
    `<p>${esc(p.lede)}</p>`,
    repo,
    preview,
    list(p.points),
    specs,
    ...sections,
    `<p><a href="/#projects">All projects</a> · <a href="${PDF}">Resume (PDF)</a></p>`,
  )
}

const notFoundContent = () => `<h1>Page not found</h1>
<p>There's nothing at this address.</p>
<p><a href="/">${esc(profile.name)}: resume and projects</a> · <a href="${PDF}">Resume (PDF)</a></p>`

// Vuetify's reset strips margins, and its theme colors arrive with JS, so the
// static copy carries a few rules of its own (theme hex values from
// src/plugins/vuetify.js). A <noscript> is inert when JS runs, style and all.
const STATIC_CSS = `body{background:#f3f5f8;color:#101a2b}
.static{max-width:44rem;margin:0 auto;padding:2.5rem 16px 4rem;font:1rem/1.6 'Public Sans Variable',system-ui,sans-serif}
.static h1{font:850 clamp(1.3rem,6.5vw,2.25rem)/1.05 'Archivo Variable',sans-serif;font-stretch:125%;text-transform:uppercase;overflow-wrap:anywhere;margin:.25rem 0 1rem}
.static h2{font:750 1.25rem/1.2 'Archivo Variable',sans-serif;font-stretch:112%;text-transform:uppercase;letter-spacing:.02em;margin:2.5rem 0 .75rem}
.static h3{font-size:1.1rem;margin:1.5rem 0 .25rem}
.static p,.static table,.static blockquote,.static figure{margin:0 0 .75rem}
.static pre{margin:0 0 .4rem;padding:.75rem;border:1px solid #d8dde6;border-radius:4px;font:.8125rem/1.5 'IBM Plex Mono',ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.static figure .meta{margin-bottom:.4rem}
.static ul{margin:0 0 .75rem;padding-left:1.1rem}
.static li{margin-bottom:.3rem}
.static .meta{color:#566278;font-size:.9rem}
.static a{color:#1d4fb8}
.static blockquote{border-left:3px solid #1d4fb8;padding-left:1rem;font-weight:650}
.static th,.static td{text-align:left;vertical-align:top;padding:.3rem 1rem .3rem 0;border-bottom:1px solid #d8dde6}
@media (prefers-color-scheme:dark){body{background:#0d1420;color:#e6ebf3}.static .meta{color:#9aa6ba}.static a{color:#8fb0ff}.static blockquote{border-color:#8fb0ff}.static th,.static td,.static pre{border-color:#263246}}`

const noscript = content => `<noscript>
      <style>${STATIC_CSS}</style>
      <main class="static">
${content}
<p class="meta">This page needs JavaScript for the full version. <a href="${SOURCE}" rel="noopener">Source</a></p>
      </main>
    </noscript>`

// --- head ---------------------------------------------------------------------

// Replace exactly one match, or fail the build: a silent miss would ship a
// page with the home page's tags.
function replaceOne (html, pattern, value) {
  const matches = html.match(new RegExp(pattern.source, 'g')) ?? []
  if (matches.length !== 1) throw new Error(`route-pages: expected one match for ${pattern}, found ${matches.length}`)
  return html.replace(pattern, () => value)
}
const metaContent = (html, attr, key, value) =>
  replaceOne(html, new RegExp(`<meta ${attr}="${key}" content="[^"]*">`), `<meta ${attr}="${key}" content="${esc(value)}">`)

function page ({ title, description, url, type, content, extraHead = '', noindex = false }) {
  let html = template
  if (title) {
    html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    html = metaContent(html, 'property', 'og:title', title)
    html = metaContent(html, 'name', 'twitter:title', title)
  }
  if (description) {
    html = metaContent(html, 'name', 'description', description)
    html = metaContent(html, 'property', 'og:description', description)
    html = metaContent(html, 'name', 'twitter:description', description)
  }
  if (type) html = metaContent(html, 'property', 'og:type', type)
  if (url) {
    html = metaContent(html, 'property', 'og:url', url)
    html = replaceOne(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(url)}">`)
  }
  if (noindex) {
    html = replaceOne(html, /\n\s*<link rel="canonical" href="[^"]*">/, '')
    extraHead += '\n    <meta name="robots" content="noindex">'
  }
  html = replaceOne(html, /<noscript>[\s\S]*?<\/noscript>/, noscript(content))
  return replaceOne(html, /\n(\s*)<\/head>/, `${extraHead}\n  </head>`)
}

// schema.org Person for the home page: public facts only, no contact details.
const [locality, region] = profile.location.split(/,\s*/)
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.title,
  worksFor: { '@type': 'Organization', name: experience[0].org },
  address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: 'US' },
  url: `${SITE}/`,
  sameAs: [`https://github.com/${profile.github}`],
}
// '<' escaped so no string in the data can close the script element.
const jsonLd = `\n    <script type="application/ld+json">${JSON.stringify(person).replaceAll('<', '\\u003c')}</script>`

// --- write --------------------------------------------------------------------

const urls = [`${SITE}/`]
writeFileSync(new URL('index.html', dist), page({ content: homeContent(), extraHead: jsonLd }))

for (const p of withPages) {
  const url = `${SITE}/projects/${p.id}/`
  const dir = new URL(`projects/${p.id}/`, dist)
  mkdirSync(dir, { recursive: true })
  writeFileSync(new URL('index.html', dir), page({
    title: `${p.name} · ${profile.name}`,
    description: p.lede,
    url,
    type: 'website',
    content: projectContent(p),
  }))
  urls.push(url)
}

writeFileSync(new URL('404.html', dist), page({ content: notFoundContent(), noindex: true }))

writeFileSync(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`)
writeFileSync(new URL('robots.txt', dist), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`route pages: home + ${withPages.length} projects + 404.html, sitemap.xml (${urls.length} URLs), robots.txt`)
