<template>
  <v-fade-transition>
    <v-btn
      v-show="visible"
      :icon="mdiArrowUp"
      class="to-top no-print"
      color="primary"
      variant="flat"
      size="large"
      aria-label="Back to top"
      title="Back to top"
      @click="toTop"
    />
  </v-fade-transition>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { mdiArrowUp } from '@mdi/js'
  import { scrollToY } from '@/utils/scroll'

  // Shows once the visitor is about a screen down the page.
  const visible = ref(false)
  const update = () => { visible.value = window.scrollY > window.innerHeight * 0.8 }

  // The button hides once the page is back at the top, which would drop
  // keyboard focus to <body>; hand it to the page's heading instead.
  function toTop () {
    scrollToY(0)
    const heading = document.querySelector('main h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('scroll', update))
</script>

<style scoped>
.to-top {
  position: fixed;
  right: calc(max(16px, env(safe-area-inset-right, 0px)) + 4px);
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 20;
  box-shadow: 0 4px 14px rgba(16, 26, 43, 0.25);
}
</style>
