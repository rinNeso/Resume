<template>
  <v-footer
    border="t"
    color="background"
    class="pa-0"
  >
    <div class="page mx-auto w-100 d-flex flex-wrap justify-space-between ga-4 muted foot">
      <span>{{ profile.name }} · {{ profile.location }}</span>
      <span>
        Built with Vue and Vuetify ·
        <a
          href="https://github.com/rinNeso/Resume"
          target="_blank"
          rel="noopener"
        >source</a>
      </span>
    </div>
  </v-footer>
</template>

<script setup>
  import { profile } from '@/data/resume'
</script>

<style scoped>
.foot { padding-block: 2rem 3rem; font-size: 0.9375rem; }
/* On a phone the footer wraps to two lines and the Back to top button
   (56px, 20px off the bottom) would sit on the 'source' link; leave room. */
@media (max-width: 600px) {
  .foot { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px)); }
}
</style>
