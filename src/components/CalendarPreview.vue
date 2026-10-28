<template>
  <div class="cal">
    <!-- After the Finals: the champion, then the knockout rounds. -->
    <div
      v-if="board.mode === 'concluded'"
      class="over"
    >
      <div class="champ">
        <h2 class="over-title">
          {{ tournament }} is over
        </h2>
        <div class="champ-row">
          <span
            class="trophy"
            aria-hidden="true"
          >
            <v-icon
              :icon="mdiTrophyOutline"
              size="26"
            />
          </span>
          <div class="champ-text">
            <p class="label ma-0">
              Champion
            </p>
            <p class="champ-name ma-0">
              {{ board.final.winner }}
            </p>
            <p class="ma-0">
              Beat {{ board.final.loser }} {{ board.final.score }} in the Finals
              on {{ longDay(board.final.start) }}.
            </p>
          </div>
        </div>
        <p
          v-if="next"
          class="next ma-0"
        >
          {{ next.name }} starts {{ day(next.start) }}.
        </p>
      </div>

      <div class="rounds">
        <div
          v-for="g in rounds"
          :key="g.stage"
          class="group"
        >
          <h3 class="group-title label ma-0">
            {{ g.stage }}
          </h3>
          <ul class="events">
            <li
              v-for="e in g.events"
              :key="e.uid"
              class="event round"
            >
              <!-- Spaces kept on one line survive Vue's whitespace condensing, so
                   copied text and screen readers get "Sat, Nov 14 T1 3–1 GEN"
                   rather than "Sat, Nov 14T13–1GEN". -->
              <span class="when mono">{{ day(e.start) }}</span> <span class="what">
                <template v-if="e.result">
                  <span class="winner">{{ e.result.winner }}</span> <span class="score mono">{{ e.result.score }}</span> <span class="loser">{{ e.result.loser }}</span>
                </template>
                <template v-else>
                  {{ e.match }}
                  <span class="badge label">Result pending</span>
                </template>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- During the tournament, or a feed that stopped short of the end. -->
    <template v-else>
      <div
        v-if="groups.length"
        class="list"
      >
        <div
          v-for="group in groups"
          :key="group.title"
          class="group"
        >
          <h2 class="group-title label ma-0">
            {{ group.title }}
          </h2>
          <ul class="events">
            <li
              v-for="e in group.events"
              :key="e.uid"
              class="event"
            >
              <span class="when mono">{{ when(e.start) }}</span> <span class="what">
                {{ e.match }}
                <span
                  v-if="e.status === 'live'"
                  class="badge live label"
                >Live</span>
              </span> <span class="stage muted">{{ e.stage }}</span>
            </li>
            <li
              v-if="group.note"
              class="event more muted"
            >
              {{ group.note }}
            </li>
          </ul>
        </div>
      </div>
      <p
        v-else
        class="ma-0"
      >
        Couldn't load the schedule right now. It's published at
        <a :href="feed">{{ feed }}</a>.
      </p>
    </template>

    <div class="sub">
      <p class="sub-row ma-0">
        <span class="label">Subscribe</span>
        <span class="addr">
          <a
            :href="subscribe"
            class="mono"
          >{{ subscribe }}</a>
          <v-btn
            :icon="mdiContentCopy"
            size="x-small"
            variant="text"
            class="copy no-print"
            aria-label="Copy the calendar address"
            @click="copy"
          />
        </span>
      </p>
      <p
        v-if="board.mode === 'concluded'"
        class="hint muted ma-0"
      >
        <template v-if="next">
          The feed already has {{ next.name }}'s schedule, so a subscription fills it in on its own.
        </template>
        <template v-else>
          The feed follows the newest Worlds, so a subscription fills in next year's matches on its own.
        </template>
      </p>
      <!-- webcal: does nothing in a desktop browser with no calendar handler. -->
      <p class="hint muted ma-0">
        No calendar app? <a :href="feed">Download the .ics file</a>.
      </p>
    </div>

    <p class="status muted ma-0">
      {{ status }}
    </p>

    <v-snackbar
      v-model="copied"
      :timeout="1800"
      location="bottom"
    >
      {{ copyMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
  import { mdiContentCopy, mdiTrophyOutline } from '@mdi/js'
  import { compareTournaments, fromSnapshot, parseIcs, pickFeed, result, view } from '@/utils/ics'
  import snapshotJson from '@/data/worlds-snapshot.json'

  const props = defineProps({
    feed: { type: String, required: true },
    subscribe: { type: String, required: true },
  })

  // The bundled snapshot renders straight away and the live feed replaces it
  // if it's as new or newer. On most days the two agree and the swap only
  // updates text; if they're in different states (say the snapshot predates
  // the Final) the card changes shape once.
  const snapshot = fromSnapshot(snapshotJson)
  const live = shallowRef(null)
  const feedState = ref('loading') // loading | ok | failed
  const now = ref(Date.now())

  const source = computed(() => pickFeed(snapshot, live.value, now.value))
  const data = computed(() => source.value === 'live' ? live.value : snapshot)
  const board = computed(() => view(data.value.events, now.value))

  const clean = calendar => (calendar || 'Worlds').replace(/^LoL\s+/, '')
  const tournament = computed(() => clean(data.value.calendar))

  // Next year's feed, before it begins: the card keeps the final results and
  // says when the next one starts.
  const next = computed(() => {
    const l = live.value
    if (source.value !== 'snapshot' || !l?.events.length || compareTournaments(l, snapshot) <= 0) return null
    return { name: clean(l.calendar), start: l.events[0].start }
  })

  // Name the tournament in the heading when it isn't plainly the current one:
  // before its first match, or from another year.
  const named = computed(() => {
    const first = data.value.events[0]?.start
    const year = Number(/\b(\d{4})\b/.exec(data.value.calendar || '')?.[1])
    return (first && first > now.value) || (year && year !== new Date(now.value).getFullYear())
  })

  function upcomingTitle (rows) {
    const live = rows.filter(e => e.status === 'live').length
    if (!live) return 'Coming up'
    return live === rows.length ? 'Live now' : 'Live and coming up'
  }

  // Finished matches the feed hasn't scored, as one line: a couple by name,
  // the rest counted, so a frozen feed can't crowd out the real results.
  // TBD placeholders say nothing by name, so they're only counted.
  function awaiting (pending) {
    if (!pending.length) return null
    const names = pending.filter(e => !/\bTBD\b/.test(e.match)).slice(0, 2).map(e => e.match)
    const rest = pending.length - names.length
    if (!names.length) return `${rest} ${rest === 1 ? 'match' : 'matches'} awaiting results`
    return `Awaiting results: ${names.join(', ')}${rest ? `, and ${rest} more` : ''}`
  }

  const groups = computed(() => {
    const b = board.value
    const extra = (b.pending?.length ?? 0) - 3
    const list = b.mode === 'stale'
      ? [
        { title: 'Awaiting results', events: b.pending.slice(0, 3), note: extra > 0 ? `and ${extra} more ${extra === 1 ? 'match' : 'matches'} with no result yet` : null },
        { title: 'Latest results', events: b.results },
      ]
      : [
        { title: upcomingTitle(b.upcoming), events: b.upcoming },
        { title: 'Latest results', events: b.results, note: awaiting(b.pending) },
      ]
    const shown = list.filter(g => g.events.length || g.note)
    if (named.value && shown.length) shown[0] = { ...shown[0], title: `${tournament.value} · ${shown[0].title}` }
    return shown
  })

  // Knockout rows with the winner first.
  const rounds = computed(() => (board.value.knockouts || []).map(g => ({
    ...g,
    events: g.events.map(e => ({ ...e, result: result(e) })),
  })))

  // Dates more than about six months off, or in another year, carry the year.
  function dated (options) {
    const near = new Intl.DateTimeFormat(undefined, options)
    const far = new Intl.DateTimeFormat(undefined, { ...options, year: 'numeric' })
    return d => {
      const away = Math.abs(d - now.value) > 182 * 864e5 || d.getFullYear() !== new Date(now.value).getFullYear()
      return (away ? far : near).format(d)
    }
  }
  const when = dated({ weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const day = dated({ weekday: 'short', month: 'short', day: 'numeric' })
  const longDay = dated({ weekday: 'long', month: 'long', day: 'numeric' })
  const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  function ago (d) {
    const mins = Math.round((d - now.value) / 60e3)
    if (mins > -1) return 'just now'
    if (mins > -60) return rtf.format(mins, 'minute')
    const hours = Math.round(mins / 60)
    if (hours > -48) return rtf.format(hours, 'hour')
    return rtf.format(Math.round(hours / 24), 'day')
  }

  // Says where the card's data came from and how old it is.
  const status = computed(() => {
    const b = board.value
    if (source.value === 'live') {
      const stamp = live.value.feedStamp
      if (b.mode === 'concluded') return stamp ? `Final results · live feed, updated ${ago(stamp)}` : 'Final results · live feed'
      if (b.mode === 'stale') {
        return stamp ? `Live feed · last updated ${date.format(stamp)}, and some results aren't in` : 'Live feed · some results aren\'t in'
      }
      const updated = stamp ? `Live feed · updated ${ago(stamp)}` : 'Live feed'
      return b.pending.length ? `${updated}, and some results aren't in` : updated
    }
    const from = date.format(snapshot.feedStamp || snapshot.fetchedAt)
    if (b.mode === 'concluded') return `Final results · snapshot from ${from}`
    if (feedState.value === 'loading') return `Snapshot from ${from} · checking the live feed`
    if (feedState.value === 'failed') return `Live feed unreachable · showing a snapshot from ${from}`
    return `Snapshot from ${from}`
  })

  const copied = ref(false)
  const copyMessage = ref('')

  async function copy () {
    try {
      await navigator.clipboard.writeText(props.subscribe)
      copyMessage.value = 'Calendar address copied'
    } catch {
      copyMessage.value = `Couldn't copy. The address is ${props.subscribe}`
    }
    copied.value = true
  }

  let controller
  let timeout
  let tick

  onMounted(async () => {
    // Keeps "Live" badges and "updated N ago" right on a page left open.
    tick = setInterval(() => (now.value = Date.now()), 60e3)
    // GitHub Pages already caches the feed for 10 minutes; give up after 8 s.
    controller = new AbortController()
    timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(props.feed, { signal: controller.signal })
      if (!res.ok) throw new Error(res.status)
      const parsed = parseIcs(await res.text())
      if (!parsed.events.length) throw new Error('empty feed')
      live.value = parsed
      feedState.value = 'ok'
    } catch {
      feedState.value = 'failed'
    } finally {
      clearTimeout(timeout)
      now.value = Date.now()
    }
  })

  onBeforeUnmount(() => {
    clearInterval(tick)
    clearTimeout(timeout)
    controller?.abort()
  })
</script>

<style scoped>
.cal { display: grid; gap: 1.25rem; }
/* One column grid per list, shared down to every row through subgrid, so the
   time column grows to fit a long zone name (GMT+5:30) or a year and still
   lines up across groups. */
.list {
  display: grid;
  grid-template-columns: minmax(13.5rem, max-content) minmax(0, 1fr) auto;
  gap: 1.25rem 1rem;
}
.group, .events, .event { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }
.group { row-gap: 0.5rem; }
.group-title { grid-column: 1 / -1; font-weight: 500; line-height: 1.3; }
.events { list-style: none; margin: 0; padding: 0; }
.event {
  gap: 0.25rem 1rem;
  padding-block: 0.5rem;
  border-top: 1px dashed var(--line);
  align-items: baseline;
}
.when { font-size: 0.8125rem; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.what { font-weight: 600; }
.stage { font-size: 0.875rem; }
.more { display: block; grid-column: 1 / -1; font-size: 0.875rem; }
.badge { margin-left: 0.4rem; font-size: 0.6875rem; font-weight: 500; white-space: nowrap; }
.live { color: rgb(var(--v-theme-ok)); }
.live::before {
  content: '';
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.3rem;
  border-radius: 50%;
  background: currentColor;
  vertical-align: 0.05em;
}

/* Concluded: champion on the left, knockout rounds on the right. */
.over {
  display: grid;
  grid-template-columns: minmax(0, 17rem) minmax(0, 1fr);
  gap: 1.5rem 2.5rem;
  align-items: start;
}
.champ { display: grid; gap: 1rem; }
.over-title {
  font-family: var(--display);
  font-stretch: 112%;
  font-weight: 750;
  font-size: 1.25rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-wrap: balance;
  margin: 0;
}
.champ-row { display: flex; gap: 1rem; align-items: flex-start; }
.trophy {
  display: grid;
  place-items: center;
  flex: none;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
}
.champ-text { display: grid; gap: 0.15rem; min-width: 0; }
.champ-name {
  font-family: var(--display);
  font-stretch: 125%;
  font-weight: 850;
  font-size: clamp(2rem, 6vw, 2.75rem);
  line-height: 1;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  overflow-wrap: anywhere;
}
.rounds {
  display: grid;
  grid-template-columns: minmax(7.5rem, max-content) minmax(0, 1fr);
  gap: 1.25rem 1rem;
}
.next { font-size: 0.875rem; color: var(--muted); }
/* Fixed-width winner so the scores line up down the column. The real spaces
   between the three fill part of each gap, so the width and margin here are
   that much smaller. */
.winner { display: inline-block; min-width: 3rem; }
.score { font-weight: 500; margin-right: 0.1rem; }
.loser { color: var(--muted); font-weight: 400; }

.sub { display: grid; gap: 0.25rem; }
.sub-row { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; align-items: center; }
.addr { display: inline-flex; align-items: center; gap: 0.25rem; min-width: 0; max-width: 100%; }
.addr a { font-size: 0.8125rem; overflow-wrap: anywhere; min-width: 0; }
.copy { color: var(--muted); }
.hint { font-size: 0.8125rem; }
.status {
  font-size: 0.8125rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line);
}
@media (max-width: 720px) {
  .list { grid-template-columns: minmax(0, 1fr) auto; }
  .when { grid-column: 1 / -1; }
  .rounds { grid-template-columns: minmax(6.5rem, max-content) minmax(0, 1fr); }
  .round .when { grid-column: auto; }
  .over { grid-template-columns: minmax(0, 1fr); }
}
</style>
