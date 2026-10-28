<template>
  <figure class="term">
    <div class="bar mono">
      {{ title }}
    </div>
    <!-- Long lines scroll sideways on phones; then it's focusable so arrow
         keys can scroll it too. When everything fits it's not a Tab stop. -->
    <div
      ref="body"
      class="body"
      :tabindex="scrolls ? 0 : undefined"
      :role="scrolls ? 'region' : undefined"
      :aria-label="scrolls ? (title ? `${title} output` : 'Terminal output') : undefined"
    >
      <div
        v-for="(l, i) in lines"
        :key="i"
        :class="['line', l.kind]"
      >
        <span
          v-if="l.stamp"
          class="stamp"
        >{{ l.stamp }}</span>
        <span>{{ l.text }}</span>
      </div>
    </div>
  </figure>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

  const props = defineProps({
    title: { type: String, default: '' },
    text: { type: String, required: true },
  })

  // Colour real output the way a terminal would: section headers, passes,
  // failures, and dimmed timestamps.
  const STAMP = /^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\s+)/
  const lines = computed(() => props.text.split('\n').map(raw => {
    const m = raw.match(STAMP)
    const text = m ? raw.slice(m[1].length) : raw
    let kind = ''
    if (/^==/.test(text)) kind = 'head'
    else if (/\bDRIFT\b|FAILED|stalled|giving up/.test(text)) kind = 'bad'
    else if (/^\s*ok\b|done - |tray ejected/.test(text)) kind = 'good'
    else if (/^\d+ ok/.test(text)) kind = 'sum'
    return { stamp: m ? m[1] : '', text, kind }
  }))

  // Whether the output is wider than its box, rechecked as the box resizes.
  const body = ref(null)
  const scrolls = ref(false)
  let observer
  const measure = () => {
    const el = body.value
    if (el) scrolls.value = el.scrollWidth > el.clientWidth
  }
  onMounted(() => {
    // Without a way to watch it, stay focusable rather than risk a box that
    // scrolls but can't be reached from the keyboard.
    if (typeof ResizeObserver === 'undefined') { scrolls.value = true; return }
    measure()
    // The mono font arriving late changes the line widths, not the box.
    document.fonts?.ready.then(measure)
    observer = new ResizeObserver(measure)
    observer.observe(body.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
/* A terminal stays dark in both themes, so it carries its own palette. */
.term {
  --t-bg: #0b111b;
  --t-bar: #141c2a;
  --t-fg: #d5dce8;
  --t-dim: #7c879a;
  --t-good: #7fd3a4;
  --t-bad: #f0a35e;
  --t-head: #8fb0ff;
  margin: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #263246;
  background: var(--t-bg);
}
.bar {
  background: var(--t-bar);
  color: var(--t-dim);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  padding: 0.45rem 0.9rem;
  border-bottom: 1px solid #263246;
}
.body {
  padding: 0.9rem;
  overflow-x: auto;
  color: var(--t-fg);
  font: 0.8125rem/1.55 var(--mono);
}
/* Inset, since the rounded frame clips anything outside it. */
.body:focus-visible { outline: 2px solid var(--t-head); outline-offset: -2px; }
.line { display: flex; white-space: pre; width: max-content; min-width: 100%; min-height: 1.55em; }
.stamp { flex: none; }
.stamp { color: var(--t-dim); }
.head { color: var(--t-head); font-weight: 500; }
.good { color: var(--t-good); }
.bad { color: var(--t-bad); }
.sum { color: var(--t-fg); font-weight: 500; }
/* Paper can't scroll: wrap long lines instead of clipping them, and let a
   long log run across pages rather than leave a blank one before it. */
@media print {
  .term { break-inside: auto; }
  .bar { break-after: avoid; }
  .body { overflow: visible; }
  .line { white-space: pre-wrap; width: auto; overflow-wrap: anywhere; break-inside: avoid; }
  .line > span:last-child { min-width: 0; }
}
</style>
