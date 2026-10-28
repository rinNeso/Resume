/**
 * utils/links.js
 *
 * Links written into the data files (rendered with v-html) are plain <a>
 * tags, so a click on one would reload the whole site. Attach the handler
 * from useInternalLinks() to the element that holds them, and links to other
 * pages of the site become router navigations: no reload, and focus lands on
 * the new page's heading like any other page change.
 */

import { useRouter } from 'vue-router'

export function useInternalLinks () {
  const router = useRouter()

  return function onClick (e) {
    // Modified and middle clicks open a tab, as the browser would.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href]')
    if (!a || !e.currentTarget.contains(a)) return
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return

    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin) return
    // Files such as the PDF aren't pages of the app, and a link to a spot on
    // this same page is left to the browser.
    if (/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname === location.pathname) return

    e.preventDefault()
    router.push(url.pathname + url.search + url.hash)
  }
}
