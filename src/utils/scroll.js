/**
 * utils/scroll.js
 *
 * Animated scrolling for in-page jumps (section links, back to top), so a
 * click glides instead of teleporting. CSS `scroll-behavior: smooth` isn't
 * used: browsers drop it entirely for visitors with reduced motion, and an
 * instant jump is exactly what's disorienting. Those visitors get a short,
 * quick glide instead of a long one.
 */

// Clears the sticky section bar when landing on a heading.
export const STICKY_OFFSET = 72

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
let frame = 0

export function scrollToY (target) {
  cancelAnimationFrame(frame)
  const start = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const end = Math.max(0, Math.min(target, max))
  const distance = end - start
  if (Math.abs(distance) < 2) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Longer trips take a little longer, within limits, so nothing feels sluggish.
  const duration = reduced ? 200 : Math.min(750, 300 + Math.abs(distance) / 8)
  const t0 = performance.now()

  const step = now => {
    const t = Math.min(1, (now - t0) / duration)
    window.scrollTo({ top: start + distance * ease(t), behavior: 'instant' })
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)

  // Any wheel, touch or key input takes over from the animation.
  const stop = () => cancelAnimationFrame(frame)
  for (const ev of ['wheel', 'touchstart', 'keydown']) {
    window.addEventListener(ev, stop, { once: true, passive: true })
  }
}

export function scrollToElement (el) {
  if (!el) return
  scrollToY(el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET)
}
