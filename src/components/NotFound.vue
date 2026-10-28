<template>
  <div class="page mx-auto missing">
    <h1 class="section-title">
      {{ title }}
    </h1>
    <p class="ma-0">
      <slot />
    </p>
    <ul class="links">
      <li>
        <router-link to="/">
          {{ profile.name }}: resume and projects
        </router-link>
      </li>
      <li>
        <router-link to="/#projects">
          All projects
        </router-link>
      </li>
      <li>
        <a href="/Nathan-Heiland-Resume.pdf">Resume (PDF)</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { profile } from '@/data/resume'

  // Shared by the unknown-address page and an unknown project, so both offer
  // the same ways back.
  defineProps({
    title: { type: String, required: true },
  })
</script>

<style scoped>
.missing { display: grid; gap: 1rem; padding-block: 4rem; }
.missing .section-title { margin-bottom: 0.5rem; }
.links { display: grid; gap: 0.4rem; margin: 0; padding-left: 1.1rem; }
.links li::marker { color: var(--muted); }
</style>
