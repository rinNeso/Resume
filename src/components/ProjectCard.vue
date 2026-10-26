<template>
  <v-card
    :id="project.id"
    variant="outlined"
    class="card d-flex flex-column flex-grow-1"
    :class="{ linked: hasPage }"
  >
    <div class="d-flex justify-space-between align-start ga-4">
      <h3 class="ma-0">
        <router-link
          v-if="hasPage"
          :to="`/projects/${project.id}`"
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

    <div :class="project.specs ? 'cols' : 'stack'">
      <div class="stack">
        <p class="muted ma-0">
          {{ project.lede }}
        </p>
        <ul class="points">
          <li
            v-for="(p, i) in project.points"
            :key="i"
            v-html="p"
          />
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
        class="text-none mono above"
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
  import { computed } from 'vue'
  import { mdiArrowRight, mdiArrowTopRight, mdiGithub } from '@mdi/js'
  import { details } from '@/data/details'

  const props = defineProps({
    project: { type: Object, required: true },
  })

  // Cards with a project page are clickable anywhere; the repo button
  // stays its own link on top.
  const hasPage = computed(() => Boolean(details[props.project.id]))
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

.kind { margin-top: 0.15rem; white-space: nowrap; }
.stack { display: grid; gap: 0.85rem; min-width: 0; align-content: start; }
.cols { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.5rem 2.5rem; }
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
@media (max-width: 720px) {
  .cols { grid-template-columns: minmax(0, 1fr); }
}
</style>
