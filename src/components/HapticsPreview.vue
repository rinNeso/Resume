<template>
  <div class="haptics">
    <div
      class="scale mono"
      aria-hidden="true"
    >
      <span />
      <div class="ticks">
        <span
          v-for="t in ticks"
          :key="t"
          :style="{ left: pct(t) }"
        >{{ t === 0 ? '0' : `${t / 1000}s` }}</span>
      </div>
    </div>

    <div
      v-for="cue in cues"
      :key="cue.id"
      class="cue"
    >
      <div class="meta">
        <v-btn
          :icon="playing === cue.id ? mdiStop : mdiPlay"
          size="small"
          variant="tonal"
          color="primary"
          :aria-label="`${playing === cue.id ? 'Stop' : 'Play'} ${cue.name}`"
          @click="play(cue)"
        />
        <div>
          <div class="name">
            {{ cue.name }}
          </div>
          <div class="when muted">
            {{ cue.when }}
          </div>
        </div>
      </div>

      <div
        class="track"
        role="img"
        :aria-label="describe(cue)"
      >
        <span
          v-for="([type, at], i) in cue.steps"
          :key="i"
          class="pulse"
          :class="{ crit: critical.has(type), lit: playing === cue.id && elapsed >= at && elapsed < at + durations[type] }"
          :style="{ left: pct(at), width: pct(durations[type]) }"
          :title="`${type} at ${at} ms`"
        />
        <span
          v-if="playing === cue.id"
          class="head"
          :style="{ left: pct(Math.min(elapsed, spanMs)) }"
        />
      </div>
    </div>

    <div class="legend mono">
      <span><i class="swatch crit" /> pulse reserved for critical cues</span>
      <span><i class="swatch" /> other pulse</span>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, ref } from 'vue'
  import { mdiPlay, mdiStop } from '@mdi/js'
  import { critical, cues, durations, spanMs } from '@/data/soloref-haptics'

  const ticks = [0, 500, 1000, 1500]
  const pct = ms => `${(ms / spanMs) * 100}%`
  const describe = cue => `${cue.name}: ` + cue.steps.map(([t, at]) => `${t} at ${at} ms`).join(', ')

  const playing = ref(null)
  const elapsed = ref(0)
  let raf = 0

  function stop () {
    cancelAnimationFrame(raf)
    playing.value = null
    try { navigator.vibrate?.(0) } catch { /* not supported */ }
  }

  function play (cue) {
    if (playing.value === cue.id) return stop()
    stop()
    // Vibration API (Android browsers): alternate on/off durations.
    const pattern = []
    let cursor = 0
    for (const [type, at] of cue.steps) {
      if (pattern.length) pattern.push(Math.max(0, at - cursor))
      pattern.push(durations[type])
      cursor = at + durations[type]
    }
    try { navigator.vibrate?.(pattern) } catch { /* not supported */ }

    const end = cue.steps.reduce((m, [t, at]) => Math.max(m, at + durations[t]), 0)
    playing.value = cue.id
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    const tick = now => {
      elapsed.value = reduce ? end : now - t0
      if (now - t0 < end + 150) raf = requestAnimationFrame(tick)
      else playing.value = null
    }
    raf = requestAnimationFrame(tick)
  }

  onBeforeUnmount(stop)
</script>

<style scoped>
.haptics { display: grid; gap: 0.25rem; }
.scale, .cue { display: grid; grid-template-columns: minmax(0, 17rem) minmax(0, 1fr); gap: 1rem; align-items: center; }
.ticks { position: relative; height: 1.2rem; }
.ticks span { position: absolute; transform: translateX(-50%); font-size: 0.6875rem; color: var(--muted); }
.ticks span:first-child { transform: none; }
.cue { padding-block: 0.6rem; border-top: 1px dashed var(--line); }
.meta { display: flex; gap: 0.75rem; align-items: center; min-width: 0; }
.name { font-weight: 600; line-height: 1.3; }
.when { font-size: 0.875rem; line-height: 1.35; }
.track {
  position: relative;
  height: 2.25rem;
  border-radius: 3px;
  background: repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px calc(100% / 18)), rgb(var(--v-theme-background));
  border: 1px solid var(--line);
}
.pulse {
  position: absolute;
  top: 22%;
  height: 56%;
  border-radius: 2px;
  background: var(--muted);
  opacity: 0.55;
  transition: opacity 80ms, transform 80ms;
}
.pulse.crit { background: rgb(var(--v-theme-primary)); opacity: 0.85; }
.pulse.lit { opacity: 1; transform: scaleY(1.35); }
.head { position: absolute; top: -3px; bottom: -3px; width: 2px; background: rgb(var(--v-theme-on-surface)); }
.legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; font-size: 0.75rem; color: var(--muted); padding-top: 0.75rem; }
.swatch { display: inline-block; width: 0.9rem; height: 0.55rem; border-radius: 2px; background: var(--muted); opacity: 0.55; vertical-align: middle; margin-right: 0.35rem; }
.swatch.crit { background: rgb(var(--v-theme-primary)); opacity: 0.85; }
@media (max-width: 720px) {
  .scale, .cue { grid-template-columns: minmax(0, 1fr); gap: 0.5rem; }
  .scale > span { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pulse { transition: none; }
}
</style>
