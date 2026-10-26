<template>
  <ol class="flow">
    <li
      v-for="(row, i) in rows"
      :key="i"
      class="row"
    >
      <span class="label source">{{ row[0] }}</span>
      <template
        v-for="(step, j) in row.slice(1)"
        :key="j"
      >
        <v-icon
          :icon="mdiArrowRight"
          size="16"
          class="arrow"
          aria-hidden="true"
        />
        <span
          class="step"
          :class="{ last: j === row.length - 2 }"
        >{{ step }}</span>
      </template>
    </li>
  </ol>
</template>

<script setup>
  import { mdiArrowRight } from '@mdi/js'

  defineProps({
    rows: { type: Array, required: true },
  })
</script>

<style scoped>
.flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--line);
}
.row:last-child { border-bottom: 0; padding-bottom: 0; }
.source { min-width: 11rem; }
.arrow { color: var(--muted); }
.step {
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: rgb(var(--v-theme-background));
  font-size: 0.9375rem;
  line-height: 1.35;
}
.step.last { border-color: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-primary)); }
@media (max-width: 720px) {
  .source { min-width: 0; width: 100%; }
}
</style>
