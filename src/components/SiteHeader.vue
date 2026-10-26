<template>
  <v-sheet
    border="b"
    tag="header"
  >
    <div class="page mx-auto header">
      <p class="label ma-0">
        {{ profile.location }} · {{ profile.title }}
      </p>
      <h1 class="name">
        {{ profile.name }}
      </h1>
      <p
        class="role"
        v-html="profile.role"
      />

      <div
        class="d-flex flex-wrap ga-2"
        aria-label="Credentials"
      >
        <v-chip
          v-for="c in profile.credentials"
          :key="c.text"
          class="mono"
          :color="c.key ? 'primary' : undefined"
          :variant="c.key ? 'tonal' : 'outlined'"
        >
          {{ c.text }}
        </v-chip>
      </div>

      <div class="d-flex flex-wrap align-center ga-2 contact">
        <v-btn
          :href="`mailto:${profile.email}`"
          :prepend-icon="mdiEmailOutline"
          variant="text"
          class="text-none px-2"
        >
          {{ profile.email }}
        </v-btn>
        <v-btn
          :icon="mdiContentCopy"
          size="small"
          variant="text"
          class="no-print"
          :aria-label="`Copy ${profile.email}`"
          @click="copyEmail"
        />
        <v-btn
          :href="`https://github.com/${profile.github}`"
          :prepend-icon="mdiGithub"
          target="_blank"
          rel="noopener"
          variant="text"
          class="text-none px-2"
        >
          github.com/{{ profile.github }}
        </v-btn>
        <v-btn
          href="/Nathan-Heiland-Resume.pdf"
          download
          :prepend-icon="mdiFileDownloadOutline"
          variant="tonal"
          color="primary"
          class="text-none no-print download"
        >
          Download resume (PDF)
        </v-btn>
      </div>
    </div>

    <v-snackbar
      v-model="copied"
      :timeout="1800"
      location="bottom"
    >
      {{ copyMessage }}
    </v-snackbar>
  </v-sheet>
</template>

<script setup>
  import { ref } from 'vue'
  import { mdiContentCopy, mdiEmailOutline, mdiFileDownloadOutline, mdiGithub } from '@mdi/js'
  import { profile } from '@/data/resume'

  const copied = ref(false)
  const copyMessage = ref('')

  async function copyEmail () {
    try {
      await navigator.clipboard.writeText(profile.email)
      copyMessage.value = 'Email address copied'
    } catch {
      copyMessage.value = `Couldn't copy. The address is ${profile.email}`
    }
    copied.value = true
  }
</script>

<style scoped>
.header {
  display: grid;
  gap: 1.25rem;
  padding-block: 3.5rem 2.5rem;
}
/* Expanded caps, like aircraft tail lettering. */
.name {
  font-family: var(--display);
  font-stretch: 125%;
  font-weight: 850;
  font-size: clamp(2.25rem, 7vw, 4.25rem);
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-wrap: balance;
  margin: 0;
}
.role { font-size: 1.1875rem; max-width: 40rem; margin: 0; }
.role :deep(strong) { font-weight: 650; }
.contact { margin-left: -0.5rem; }
.download { margin-left: 0.5rem; }
@media (max-width: 720px) {
  .header { padding-block: 2.5rem 2rem; }
}
</style>
