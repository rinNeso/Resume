<template>
  <div class="cal">
    <p
      v-if="state === 'loading'"
      class="muted ma-0"
    >
      Loading the live schedule…
    </p>
    <p
      v-else-if="state === 'error'"
      class="ma-0"
    >
      Couldn't load the live feed right now. It's published at
      <a
        :href="feed"
        target="_blank"
        rel="noopener"
      >{{ feed }}</a>.
    </p>
    <template v-else>
      <div
        v-for="group in groups"
        :key="group.title"
        class="group"
      >
        <h3 class="label ma-0">
          {{ group.title }}
        </h3>
        <ul class="events">
          <li
            v-for="e in group.events"
            :key="e.uid"
            class="event"
          >
            <span class="when mono">{{ e.when }}</span>
            <span class="what">
              {{ e.match }}
              <span
                v-if="e.live"
                class="live label"
              >Live</span>
            </span>
            <span class="stage muted">{{ e.stage }}</span>
          </li>
        </ul>
      </div>
      <p class="sub ma-0">
        <span class="label">Subscribe</span>
        <code class="mono">{{ subscribe }}</code>
      </p>
    </template>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'

  const props = defineProps({
    feed: { type: String, required: true },
    subscribe: { type: String, required: true },
  })

  const state = ref('loading')
  const events = ref([])

  // Minimal iCalendar reader: unfold continuation lines, then read the few
  // fields worlds-cal writes (UID, DTSTART, SUMMARY).
  function parse (ics) {
    const text = ics.replace(/\r?\n[ \t]/g, '')
    return text.split('BEGIN:VEVENT').slice(1).map(block => {
      const get = k => (block.match(new RegExp(`^${k}[^:]*:(.*)$`, 'm')) || [])[1]?.trim()
      const s = get('DTSTART') || ''
      const start = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11), +s.slice(11, 13)))
      const [match, stage] = (get('SUMMARY') || '').replace(/\\,/g, ',').split(' · ')
      return { uid: get('UID'), start, match, stage, done: /\d+[–-]\d+/.test(match) }
    }).filter(e => !isNaN(e.start))
  }

  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const groups = computed(() => {
    const done = events.value.filter(e => e.done).sort((a, b) => b.start - a.start).slice(0, 3)
    // A match without a score that began over 3 hours ago is stale feed data, not upcoming.
    const now = Date.now()
    const next = events.value.filter(e => !e.done && e.start > now - 3 * 3600e3).sort((a, b) => a.start - b.start).slice(0, 5)
    const show = list => list.map(e => ({ ...e, when: fmt.format(e.start), live: !e.done && e.start <= now }))
    return [
      { title: 'Coming up', events: show(next) },
      { title: 'Latest results', events: show(done) },
    ].filter(g => g.events.length)
  })

  onMounted(async () => {
    try {
      const res = await fetch(props.feed, { cache: 'no-store' })
      if (!res.ok) throw new Error(res.status)
      events.value = parse(await res.text())
      state.value = events.value.length ? 'ready' : 'error'
    } catch {
      state.value = 'error'
    }
  })
</script>

<style scoped>
.cal { display: grid; gap: 1.25rem; }
.group { display: grid; gap: 0.5rem; }
.events { list-style: none; margin: 0; padding: 0; display: grid; }
.event {
  display: grid;
  grid-template-columns: 12rem minmax(0, 1fr) auto;
  gap: 0.25rem 1rem;
  padding-block: 0.5rem;
  border-top: 1px dashed var(--line);
  align-items: baseline;
}
.when { font-size: 0.8125rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.what { font-weight: 600; }
.stage { font-size: 0.875rem; }
.live { margin-left: 0.4rem; color: rgb(var(--v-theme-ok)); font-size: 0.6875rem; }
.sub { display: flex; flex-wrap: wrap; gap: 0.5rem 0.75rem; align-items: baseline; }
.sub code { font-size: 0.8125rem; overflow-wrap: anywhere; }
@media (max-width: 720px) {
  .event { grid-template-columns: minmax(0, 1fr) auto; }
  .when { grid-column: 1 / -1; }
}
</style>
