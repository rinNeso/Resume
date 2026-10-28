/**
 * router/index.js
 *
 * File routes from `./src/pages/*.vue`, wrapped in `./src/layouts`.
 */

// Composables
import { nextTick } from 'vue'
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { STICKY_OFFSET } from '@/utils/scroll'

const SITE_TITLE = 'Nathan Heiland'

// The element a hash names, or null. The hash comes straight from the
// address bar, so a bad escape ('#%E0') or an id like '#2024' that isn't a
// valid selector must not throw.
function hashTarget (hash) {
  if (!hash || hash.length < 2) return null
  let id = hash.slice(1)
  try { id = decodeURIComponent(id) } catch { /* malformed escape: use it as is */ }
  return document.getElementById(id)
}

// '/projects/soloref' and '/projects/soloref/' are the same page.
const samePage = (a, b) => a.path.replace(/\/$/, '') === b.path.replace(/\/$/, '')

// Set by scrollBehavior when back/forward restores a saved position, and read
// by afterEach. Both wait on the same render tick and scrollBehavior queues
// first, so the value is current when afterEach looks.
let restoredScroll = false

// Focus without scrolling; headings and cards get tabindex=-1 to allow it.
function land (el) {
  if (!el.hasAttribute('tabindex') && !el.matches('a, button, input, select, textarea')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}
const inView = el => {
  const r = el.getBoundingClientRect()
  return r.bottom > STICKY_OFFSET && r.top < window.innerHeight
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // There's no projects index page; the list is a section of the home page.
    // Listed first so it wins over the generated '/projects' parent route.
    { path: '/projects', redirect: { path: '/', hash: '#projects' } },
    ...setupLayouts(routes),
  ],
  // Back to the home page lands on the project's card (/#soloref); a project
  // page opens at the top; browser back/forward restores where you were. A
  // hash change on the same page comes from the section links, which glide
  // there themselves, so the router doesn't jump there first.
  scrollBehavior (to, from, saved) {
    restoredScroll = Boolean(saved)
    if (saved) return saved
    if (from !== START_LOCATION && samePage(to, from)) return false
    const el = hashTarget(to.hash)
    if (el) return { el, top: STICKY_OFFSET }
    return { top: 0 }
  },
})

// Storage can throw (blocked site data, some private modes). Without it, a
// module-level flag still limits the reload to once per page load.
let reloadedWithoutStorage = false
const RELOAD_KEY = 'vuetify:dynamic-reload'
function storage (fn) {
  try { return fn(localStorage) } catch { return undefined }
}

// A tab left open across a deploy asks for route chunks that no longer
// exist; reload once to pick up the new build.
// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    const already = storage(s => s.getItem(RELOAD_KEY)) ?? (reloadedWithoutStorage ? 'true' : null)
    if (!already) {
      console.log('Reloading page to fix dynamic import error')
      if (storage(s => s.setItem(RELOAD_KEY, 'true')) === undefined) reloadedWithoutStorage = true
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  storage(s => s.removeItem(RELOAD_KEY))
})

router.afterEach((to, from, failure) => {
  const initial = from === START_LOCATION
  // A hash or query change on the same page keeps its title and focus.
  if (failure || (!initial && samePage(to, from))) return

  // Pages set their own title after this runs (their setup or watchers come
  // later), so this is only the fallback for a page that doesn't.
  document.title = SITE_TITLE

  // On a client-side page change, move focus to the new page so screen
  // readers announce it and the next Tab starts there: the hash target when
  // the link names one (back to a project card, or a section's heading),
  // otherwise the page's h1. The first load is left to the browser.
  if (initial) return
  nextTick(() => {
    if (restoredScroll) {
      // Back/forward puts the page back where it was, and the h1 is usually
      // far above that, so the next Tab would jump to the top. Land in view
      // instead, once the position is applied: on the card of the project
      // just left, or the first heading on screen.
      requestAnimationFrame(() => {
        const current = document.activeElement
        if (current && current !== document.body && inView(current)) return
        const card = from.params?.id ? document.getElementById(String(from.params.id)) : null
        const el = card && inView(card)
          ? card.querySelector('h3 a') ?? card
          : [...document.querySelectorAll('main h1, main h2, main h3')].find(inView)
        if (el) land(el)
      })
      return
    }
    let el = hashTarget(to.hash)
    if (el?.matches('section')) el = el.querySelector('h1, h2, h3') ?? el
    el ??= document.querySelector('main h1') ?? document.querySelector('h1')
    if (el) land(el)
  })
})

export default router
