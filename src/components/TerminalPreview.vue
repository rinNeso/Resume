<template>
  <figure class="term">
    <div class="bar mono">
      {{ title }}
    </div>
    <div class="body">
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
  import { computed } from 'vue'

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
.line { display: flex; white-space: pre; width: max-content; min-width: 100%; min-height: 1.55em; }
.stamp { flex: none; }
.stamp { color: var(--t-dim); }
.head { color: var(--t-head); font-weight: 500; }
.good { color: var(--t-good); }
.bad { color: var(--t-bad); }
.sum { color: var(--t-fg); font-weight: 500; }
</style>
