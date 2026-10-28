<template>
  <SiteHeader />

  <div class="jump no-print">
    <v-sheet border="b">
      <nav
        class="page mx-auto d-flex ga-1 overflow-x-auto"
        aria-label="Sections"
      >
        <v-btn
          v-for="s in sections"
          :key="s.id"
          :href="`#${s.id}`"
          variant="text"
          size="small"
          class="label jump-link"
          @click.prevent="jump(s.id)"
        >
          {{ s.label }}
        </v-btn>
      </nav>
    </v-sheet>
  </div>

  <div
    class="page mx-auto body"
    @click="onLinkClick"
  >
    <section aria-label="Summary">
      <p class="summary ma-0">
        {{ summary }}
      </p>
    </section>

    <section id="experience">
      <h2 class="section-title">
        Experience
      </h2>
      <article
        v-for="job in experience"
        :key="job.org + job.when"
        class="dated job"
      >
        <div class="when">
          <b>{{ job.when }}</b>
          {{ job.where }}
        </div>
        <div class="stack">
          <h3 class="ma-0">
            {{ job.title }}
          </h3>
          <p class="muted ma-0">
            {{ job.org }}<template v-if="job.grade">
              · <span class="mono grade">{{ job.grade }}</span>
            </template>
          </p>
          <ul class="points">
            <!-- eslint-disable vue/no-v-html -- trusted static content from src/data -->
            <li
              v-for="(p, i) in job.points"
              :key="i"
              v-html="p"
            />
            <!-- eslint-enable vue/no-v-html -->
          </ul>
        </div>
      </article>
    </section>

    <section id="projects">
      <h2 class="section-title">
        Projects
      </h2>
      <v-row dense>
        <v-col
          v-for="p in projects"
          :key="p.id"
          cols="12"
          :md="p.wide ? 12 : 6"
          class="d-flex"
        >
          <ProjectCard :project="p" />
        </v-col>
      </v-row>
    </section>

    <section id="skills">
      <h2 class="section-title">
        Skills
      </h2>
      <dl class="skills">
        <template
          v-for="[label, items] in skills"
          :key="label"
        >
          <dt class="label">
            {{ label }}
          </dt>
          <!-- eslint-disable-next-line vue/no-v-html -- trusted static content from src/data -->
          <dd v-html="items" />
        </template>
      </dl>
    </section>

    <section id="education">
      <h2 class="section-title">
        Education
      </h2>
      <div
        v-for="e in education"
        :key="e.school"
        class="dated edu"
      >
        <div class="when">
          <b>{{ e.when }}</b>
        </div>
        <div><strong>{{ e.school }}</strong> · {{ e.detail }}</div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import { nextTick, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useInternalLinks } from '@/utils/links'
  import { scrollToElement } from '@/utils/scroll'
  import { education, experience, profile, projects, skills, summary } from '@/data/resume'

  const sections = [
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
  ]

  const router = useRouter()
  const onLinkClick = useInternalLinks()

  // Section links glide to their section instead of jumping, and update the
  // address so the link can be copied. The address goes through the router,
  // or its next save would drop the hash and Back from a project would land
  // on '/' instead of the section (the router leaves the scrolling to this).
  // `.prevent` also cancels the browser's own focus move, so focus goes to
  // the heading by hand: the next Tab then continues inside the section and
  // screen readers announce where they are.
  function jump (id) {
    const section = document.getElementById(id)
    scrollToElement(section)
    router.replace({ hash: `#${id}` })
    const heading = section?.querySelector('h2')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }

  onMounted(() => {
    // A project page sets its own title, so coming back has to reset it.
    document.title = profile.name

    // A link like resume.heiland.tv/#projects arrives before the page has
    // rendered, so the browser can't scroll to it by itself. The hash is
    // looked up as an id, not a selector, so '#2024' or an encoded hash
    // can't throw.
    if (!location.hash) return
    let id = location.hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* malformed escape: use it as is */ }
    nextTick(() => document.getElementById(id)?.scrollIntoView())
  })
</script>

<style scoped>
.jump {
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 5;
}
.jump nav { padding-block: 0.4rem; }
.jump-link { letter-spacing: 0.08em; }
/* All four links fit down to 320px; narrower than that the row scrolls, and
   the fade on the right edge says so. */
@media (max-width: 400px) {
  .jump nav { gap: 0 !important; }
  .jump-link { letter-spacing: 0.02em; padding-inline: 7px !important; }
}
@media (max-width: 359px) {
  .jump-link { padding-inline: 4px !important; }
}
@media (max-width: 319px) {
  .jump nav { mask-image: linear-gradient(to left, transparent, #000 2rem); }
}
.body {
  display: grid;
  gap: 4rem;
  padding-block: 3rem 4rem;
}
section { scroll-margin-top: 4rem; }
.summary { font-size: 1.1875rem; line-height: 1.55; max-width: 44rem; }
.stack { display: grid; gap: 0.6rem; max-width: 44rem; min-width: 0; }

/* Date gutter on the left, content on the right. */
.dated { display: grid; grid-template-columns: 11rem minmax(0, 1fr); gap: 0.5rem 2rem; }
.job { padding-block: 1.75rem; border-top: 1px solid var(--line); }
.job:first-of-type { border-top: 0; padding-top: 0; }
.edu + .edu { margin-top: 0.75rem; }
.when {
  font-family: var(--mono);
  font-size: 0.8125rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  padding-top: 0.2rem;
}
.when b { display: block; color: rgb(var(--v-theme-on-background)); font-weight: 500; }
.grade { font-size: 0.8125rem; }

.skills { display: grid; grid-template-columns: 9rem minmax(0, 1fr); gap: 0.85rem 2rem; margin: 0; }
.skills dt { padding-top: 0.2rem; }
.skills dd { margin: 0; }

@media (max-width: 720px) {
  .body { gap: 3rem; }
  .dated { grid-template-columns: minmax(0, 1fr); }
  .when b { display: inline; margin-right: 0.5rem; }
  .skills { grid-template-columns: minmax(0, 1fr); gap: 0.25rem; }
  .skills dd { margin-bottom: 0.75rem; }
}
@media print {
  .body { gap: 1.25rem; padding-block: 1.25rem 0; }
  .job { padding-block: 1rem; }
  /* A job's title and employer stay with its first bullet (its dates share
     the row). Chrome ignores break-after between grid rows, so on paper the
     stack is a flex column, which honours it. */
  .job .stack { display: flex; flex-direction: column; }
  .job .stack > h3, .job .stack > p { break-after: avoid; }
  /* Paper is narrower than the md breakpoint; keep the two-up card grid. */
  #projects :deep(.v-col-md-6) { flex: 0 0 50%; max-width: 50%; }
}
</style>
