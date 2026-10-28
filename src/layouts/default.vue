<template>
  <v-main>
    <router-view />
  </v-main>

  <AppFooter />
  <BackToTop />
</template>

<style scoped>
/* VFooter grows by default, so on a short page (not found) it swallowed half
   the screen. Let the main area take the slack instead. */
.v-footer { flex: 0 0 auto; }
</style>
