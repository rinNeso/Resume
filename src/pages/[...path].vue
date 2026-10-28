<template>
  <NotFound title="Page not found">
    There's nothing at <span class="mono path">{{ route.path }}</span>. The link
    may be mistyped or cut short.
  </NotFound>
</template>

<script setup>
  import { watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { profile } from '@/data/resume'

  // Catches every address no other page claims. GitHub Pages answers those
  // with dist/404.html (a copy of the app), so the router lands here.
  const route = useRoute()

  // The router resets the title on every navigation, and this page stays
  // mounted when one unknown address follows another, so set it per path.
  watch(() => route.path, () => {
    document.title = `Page not found · ${profile.name}`
  }, { immediate: true })
</script>

<style scoped>
.path { overflow-wrap: anywhere; }
</style>
