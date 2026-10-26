<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
  import { onBeforeUnmount, onMounted } from 'vue'
  import { useTheme } from 'vuetify'

  // Track the system light/dark setting while the page is open.
  const theme = useTheme()
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => { theme.global.name.value = media.matches ? 'dark' : 'light' }

  onMounted(() => media.addEventListener('change', sync))
  onBeforeUnmount(() => media.removeEventListener('change', sync))
</script>
