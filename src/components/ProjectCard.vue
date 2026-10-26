<template>
  <v-card
    :id="project.id"
    variant="outlined"
    class="card d-flex flex-column flex-grow-1"
  >
    <div class="d-flex justify-space-between align-start ga-4">
      <h3 class="ma-0">
        {{ project.name }}
      </h3>
      <span class="label kind">{{ project.kind }}</span>
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
        v-if="project.repo"
        :href="`https://github.com/${project.repo}`"
        target="_blank"
        rel="noopener"
        :prepend-icon="mdiGithub"
        :append-icon="mdiArrowTopRight"
        variant="tonal"
        color="primary"
        size="small"
        class="text-none mono"
      >
        {{ project.repo }}
      </v-btn>
      <v-chip
        v-else
        class="mono"
        variant="outlined"
      >
        {{ project.where }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
  import { mdiArrowTopRight, mdiGithub } from '@mdi/js'

  defineProps({
    project: { type: Object, required: true },
  })
</script>

<style scoped>
.card {
  padding: 1.5rem;
  gap: 0.85rem;
  border-color: var(--line);
  background: rgb(var(--v-theme-surface));
  scroll-margin-top: 4rem;
}
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
