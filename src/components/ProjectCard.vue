<template>
  <v-card
    :id="project.id"
    variant="outlined"
    class="card d-flex flex-column flex-grow-1"
    :class="{ linked: hasPage }"
    :link="false"
    @click="openFromCard"
    @auxclick="openFromCard"
  >
    <div class="head d-flex flex-wrap justify-space-between align-start">
      <h3 class="ma-0">
        <router-link
          v-if="hasPage"
          :to="to"
          class="stretched"
        >
          {{ project.name }}
        </router-link>
        <template v-else>
          {{ project.name }}
        </template>
      </h3>
      <span class="label kind">
        {{ project.kind }}
        <v-icon
          v-if="hasPage"
          :icon="mdiArrowRight"
          size="14"
          class="go"
          aria-hidden="true"
        />
      </span>
    </div>

    <div :class="[project.specs ? 'cols' : 'stack', { 'with-photo': project.photo }]">
      <div class="stack">
        <p class="muted ma-0">
          {{ project.lede }}
        </p>
        <ul class="points">
          <!-- eslint-disable vue/no-v-html -- trusted static content from src/data -->
          <li
            v-for="(p, i) in project.points"
            :key="i"
            v-html="p"
          />
          <!-- eslint-enable vue/no-v-html -->
        </ul>
      </div>
      <dl
        v-if="project.specs"
        class="specs"
      >
        <template
          v-for="[k, v] in project.specs"
          :key="k"
        >
          <dt class="label">
            {{ k }}
          </dt>
          <dd>{{ v }}</dd>
        </template>
      </dl>
      <img
        v-if="project.photo"
        :src="project.photo.thumb"
        :alt="project.photo.alt"
        class="photo"
        width="400"
        height="533"
        loading="lazy"
      >
    </div>

    <div class="foot mt-auto">
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="t in project.tags"
          :key="t"
          class="mono tag"
          variant="outlined"
        >
          {{ t }}
        </v-chip>
      </div>
      <v-btn
        v-if="project.repo && !project.private"
        :href="`https://github.com/${project.repo}`"
        target="_blank"
        rel="noopener"
        :prepend-icon="mdiGithub"
        :append-icon="mdiArrowTopRight"
        variant="tonal"
        color="primary"
        size="small"
        class="text-none mono above repo"
      >
        {{ project.repo }}
      </v-btn>
      <v-chip
        v-else
        class="mono"
        :color="project.private ? 'lock' : undefined"
        :variant="project.private ? 'tonal' : 'outlined'"
      >
        {{ project.private ? 'Private repo' : project.where }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
  import { computed, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  import { mdiArrowRight, mdiArrowTopRight, mdiGithub } from '@mdi/js'
  import { details } from '@/data/details'

  const props = defineProps({
    project: { type: Object, required: true },
  })
  const router = useRouter()

  // Cards with a project page are clickable anywhere; the repo button
  // stays its own link on top. The trailing slash is the address GitHub
  // Pages serves directly, so a copied URL doesn't take a redirect.
  const hasPage = computed(() => Boolean(details[props.project.id]))
  const to = computed(() => `/projects/${props.project.id}/`)

  // The title link covers the card, but the text sits above it so it can be
  // selected and copied. A plain click on that text still opens the page,
  // after a short wait: the first click of a double- or triple-click (word or
  // paragraph selection) arrives looking like a plain one, so the page only
  // opens if no second click and no selection follow. Drag-selecting, or
  // clicking a real link or button, never opens it. The title link stays the
  // one keyboard and screen-reader target.
  const DOUBLE_CLICK_MS = 250
  let pending = 0
  const cancelPending = () => { clearTimeout(pending); pending = 0 }
  const hasSelection = () => Boolean(String(window.getSelection?.() ?? '').trim())

  function openFromCard (e) {
    cancelPending()
    if (!hasPage.value || e.defaultPrevented || e.button > 1) return
    if (e.target.closest('a, button')) return
    if (hasSelection()) return
    // Middle-click or a modifier opens a tab, as it would on the link.
    if (e.button === 1 || e.metaKey || e.ctrlKey || e.shiftKey) {
      window.open(router.resolve(to.value).href, '_blank', 'noopener')
    } else if (e.detail === 1) {
      pending = setTimeout(() => {
        pending = 0
        if (!hasSelection()) router.push(to.value)
      }, DOUBLE_CLICK_MS)
    } else if (e.detail === 0) {
      // A click with no pointer behind it (assistive tech) has nothing to wait for.
      router.push(to.value)
    }
  }
  onBeforeUnmount(cancelPending)
</script>

<style scoped>
.card {
  padding: 1.5rem;
  gap: 0.85rem;
  border-color: var(--line);
  background: rgb(var(--v-theme-surface));
  scroll-margin-top: 4rem;
  position: relative;
  transition: border-color 120ms;
}
.card.linked:hover, .card.linked:focus-within { border-color: rgb(var(--v-theme-primary)); }
.stretched { color: inherit !important; text-decoration: none; }
.stretched::after { content: ''; position: absolute; inset: 0; z-index: 0; }
.stretched:focus-visible { outline: none; }
.card:has(.stretched:focus-visible) { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.above { position: relative; z-index: 1; }
.go { margin-left: 0.15rem; transition: transform 120ms; }
.card.linked:hover .go { transform: translateX(3px); }
.card :deep(a:not(.stretched)) { position: relative; z-index: 1; }
/* Text above the stretched link, so it can be selected (see openFromCard). */
.linked .stack, .linked .specs { position: relative; z-index: 1; cursor: pointer; }

.head { gap: 0.25rem 1rem; }
.kind { margin-top: 0.15rem; white-space: nowrap; }
/* On phones a long title would push some labels onto their own line and
   leave others beside it; stacking every one keeps the cards alike. */
@media (max-width: 600px) {
  .head { flex-direction: column; }
  .kind { margin-top: 0; }
}
/* A long repo name wraps instead of pushing the card past a 320px screen. */
.repo.v-btn { height: auto; min-height: var(--v-btn-height); padding-block: 4px; }
.repo :deep(.v-btn__content) { white-space: normal; overflow-wrap: anywhere; min-width: 0; text-align: left; }
.stack { display: grid; gap: 0.85rem; min-width: 0; align-content: start; }
.cols { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.5rem 2.5rem; }
.cols.with-photo { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) 9.5rem; }
.photo { display: block; width: 100%; height: auto; border-radius: 6px; box-shadow: 0 0 0 1px var(--line); }
.points { font-size: 0.9375rem; }
.specs {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.35rem 1rem;
  margin: 0;
  font-size: 0.9375rem;
  align-content: start;
}
.specs dt { padding-top: 0.15rem; }
.specs dd { margin: 0; }
.foot {
  padding-top: 0.85rem;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem 1rem;
}
.tag { font-size: 0.75rem; color: var(--muted); }
@media (max-width: 960px) {
  .cols.with-photo { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
  .cols.with-photo > .stack { grid-row: span 2; }
  .cols.with-photo .photo { max-width: 12rem; }
}
@media (max-width: 720px) {
  .cols, .cols.with-photo { grid-template-columns: minmax(0, 1fr); }
  .cols.with-photo > .stack { grid-row: auto; }
}
@media print {
  .card { padding: 1rem; gap: 0.6rem; }
  /* The homelab card is most of a page; kept whole it strands the Projects
     heading and leaves half a page blank. Its parts still stay whole. */
  .card:has(.with-photo) { break-inside: auto; }
  .head { break-after: avoid; }
  .specs > * { break-inside: avoid; }
  .foot { padding-top: 0.6rem; }
  /* The rack photo has its own page; on paper it only stretches the card. */
  .photo { display: none; }
  .cols.with-photo { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
}
</style>
