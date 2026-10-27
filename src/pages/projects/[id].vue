<template>
  <div
    v-if="project"
    class="project"
  >
    <v-sheet
      border="b"
      tag="header"
    >
      <div class="page mx-auto top">
        <router-link
          :to="`/#${project.id}`"
          class="back label"
        >
          <v-icon
            :icon="mdiArrowLeft"
            size="14"
          /> {{ profile.name }} · All projects
        </router-link>

        <div class="title-row">
          <img
            v-if="detail.icon"
            :src="detail.icon"
            :alt="`${project.name} app icon`"
            class="icon"
            width="72"
            height="72"
          >
          <div class="title-text">
            <p class="label ma-0">
              {{ project.kind }}
            </p>
            <h1 class="name">
              {{ project.name }}
            </h1>
          </div>
        </div>
        <p class="lede ma-0">
          {{ project.lede }}
        </p>

        <div class="d-flex flex-wrap align-center ga-2">
          <v-btn
            v-if="project.repo && !project.private"
            :href="`https://github.com/${project.repo}`"
            target="_blank"
            rel="noopener"
            :prepend-icon="mdiGithub"
            :append-icon="mdiArrowTopRight"
            variant="tonal"
            color="primary"
            class="text-none mono"
          >
            {{ project.repo }}
          </v-btn>
          <v-chip
            v-else
            class="mono"
            :color="project.private ? 'lock' : undefined"
            :variant="project.private ? 'tonal' : 'outlined'"
          >
            {{ project.private ? 'Private repo' : project.where }}
          </v-chip>
          <v-chip
            v-for="t in project.tags"
            :key="t"
            class="mono tag"
            variant="outlined"
          >
            {{ t }}
          </v-chip>
        </div>
      </div>
    </v-sheet>

    <div class="page mx-auto body">
      <section
        class="preview"
        aria-label="Preview"
      >
        <v-card
          variant="outlined"
          class="preview-card"
          :class="{ bare: detail.preview.type === 'terminal' }"
        >
          <FlowDiagram
            v-if="detail.preview.type === 'flow'"
            :rows="detail.preview.rows"
          />
          <TerminalPreview
            v-else-if="detail.preview.type === 'terminal'"
            :title="detail.preview.title"
            :text="detail.preview.text"
          />
          <HapticsPreview v-else-if="detail.preview.type === 'haptics'" />
          <CalendarPreview
            v-else-if="detail.preview.type === 'calendar'"
            :feed="detail.preview.feed"
            :subscribe="detail.preview.subscribe"
          />
        </v-card>
        <p
          v-if="detail.preview.caption"
          class="caption muted ma-0"
        >
          {{ detail.preview.caption }}
        </p>

        <div
          v-if="detail.screenshots?.length"
          class="shots"
        >
          <figure
            v-for="s in detail.screenshots"
            :key="s.src"
            :class="['shot', s.device]"
          >
            <img
              :src="s.src"
              :alt="s.alt"
              loading="lazy"
            >
          </figure>
        </div>
      </section>

      <section
        v-if="project.specs"
        aria-label="Hardware"
      >
        <h2 class="section-title">
          Hardware
        </h2>
        <div :class="{ hardware: project.photo }">
          <a
            v-if="project.photo"
            :href="project.photo.full"
            target="_blank"
            class="rack-photo"
            title="Open full size"
          >
            <img
              :src="project.photo.src"
              :srcset="`${project.photo.src} 800w, ${project.photo.full} 1600w`"
              sizes="(max-width: 720px) 100vw, 22rem"
              :alt="project.photo.alt"
              width="800"
              height="1067"
            >
          </a>
          <div class="hardware-text">
            <dl class="specs">
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
            <div
              v-if="project.photo?.rack"
              class="rack-list"
            >
              <p class="label ma-0">
                In the rack, top to bottom
              </p>
              <ol class="points">
                <li
                  v-for="r in project.photo.rack"
                  :key="r"
                >
                  {{ r }}
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section
        v-for="s in detail.sections"
        :key="s.title"
      >
        <h2 class="section-title">
          {{ s.title }}
        </h2>
        <div class="prose">
          <blockquote
            v-if="s.quote"
            class="quote"
          >
            {{ s.quote }}
          </blockquote>
          <div
            v-if="s.table"
            class="table-wrap"
          >
            <table class="table">
              <thead>
                <tr>
                  <th
                    v-for="h in s.table.head"
                    :key="h"
                    class="label"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, i) in s.table.rows"
                  :key="i"
                >
                  <td
                    v-for="(c, j) in r"
                    :key="j"
                    :class="{ mono: j === 0 && s.table.head[0] === 'Command' }"
                  >
                    {{ c }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-for="(p, i) in s.paragraphs"
            :key="i"
            v-html="p"
          />
          <ul
            v-if="s.points"
            class="points"
          >
            <li
              v-for="(p, i) in s.points"
              :key="i"
              v-html="p"
            />
          </ul>
        </div>
      </section>

      <nav
        class="pager"
        aria-label="More projects"
      >
        <router-link
          v-if="prev"
          :to="`/projects/${prev.id}`"
          class="pager-link"
        >
          <span class="label">Previous</span>
          <span>{{ prev.name }}</span>
        </router-link>
        <span v-else />
        <router-link
          v-if="next"
          :to="`/projects/${next.id}`"
          class="pager-link right"
        >
          <span class="label">Next</span>
          <span>{{ next.name }}</span>
        </router-link>
      </nav>
    </div>
  </div>

  <div
    v-else
    class="page mx-auto missing"
  >
    <h1 class="section-title">
      Project not found
    </h1>
    <p>
      There's no project at this address. <router-link to="/#projects">
        See all projects
      </router-link>.
    </p>
  </div>
</template>

<script setup>
  import { computed, watchEffect } from 'vue'
  import { useRoute } from 'vue-router'
  import { mdiArrowLeft, mdiArrowTopRight, mdiGithub } from '@mdi/js'
  import { profile, projects } from '@/data/resume'
  import { details } from '@/data/details'

  const route = useRoute()
  const withPages = projects.filter(p => details[p.id])
  const index = computed(() => withPages.findIndex(p => p.id === route.params.id))
  const project = computed(() => withPages[index.value])
  const detail = computed(() => details[route.params.id])
  const prev = computed(() => withPages[index.value - 1])
  const next = computed(() => withPages[index.value + 1])

  watchEffect(() => {
    document.title = project.value ? `${project.value.name} · ${profile.name}` : profile.name
  })
</script>

<style scoped>
.top { display: grid; gap: 1.1rem; padding-block: 2rem 2.25rem; }
.back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  text-decoration: none;
  color: var(--muted) !important;
  justify-self: start;
}
.back:hover { color: rgb(var(--v-theme-on-surface)) !important; }
.title-row { display: flex; align-items: center; gap: 1.25rem; }
.title-text { display: grid; gap: 0.25rem; min-width: 0; }
.icon { width: 72px; height: 72px; border-radius: 16px; flex: none; box-shadow: 0 0 0 1px var(--line); }
.name {
  font-family: var(--display);
  font-stretch: 118%;
  font-weight: 800;
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  line-height: 1.05;
  margin: 0;
  text-wrap: balance;
}
.lede { font-size: 1.1875rem; max-width: 44rem; }
.tag { color: var(--muted); }

.body { display: grid; gap: 3rem; padding-block: 2.5rem 4rem; }
.preview { display: grid; gap: 0.6rem; }
.preview-card { padding: 1.5rem; border-color: var(--line); background: rgb(var(--v-theme-surface)); }
.preview-card.bare { padding: 0; border: 0; background: none; }
.caption { font-size: 0.875rem; max-width: 44rem; }

.shots { display: flex; flex-wrap: wrap; gap: 1.5rem; padding-top: 1rem; }
.shot { margin: 0; }
.shot img { display: block; border-radius: 1.5rem; box-shadow: 0 0 0 1px var(--line); }
.shot.phone img { width: min(240px, 100%); }
.shot.watch img { width: min(180px, 100%); border-radius: 2.2rem; }

.prose { display: grid; gap: 0.85rem; max-width: 44rem; }
.prose p { margin: 0; }
.quote {
  margin: 0;
  padding: 0.25rem 0 0.25rem 1rem;
  border-left: 3px solid rgb(var(--v-theme-primary));
  font-family: var(--display);
  font-stretch: 105%;
  font-weight: 650;
  font-size: 1.3rem;
  line-height: 1.3;
  text-wrap: balance;
}
.points :deep(strong) { font-weight: 650; }

.specs { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.4rem 1.5rem; margin: 0; }
.specs dt { padding-top: 0.15rem; }
.specs dd { margin: 0; }
.hardware { display: grid; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); gap: 1.5rem 2.5rem; align-items: start; }
.hardware-text { display: grid; gap: 1.5rem; align-content: start; }
.rack-list { display: grid; gap: 0.5rem; }
.rack-list .points { padding-left: 1.5rem; }
.rack-photo img { display: block; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 0 0 1px var(--line); }

.table-wrap { overflow-x: auto; }
.table { border-collapse: collapse; width: 100%; font-size: 0.9375rem; }
.table th { text-align: left; font-weight: 500; padding: 0 1rem 0.4rem 0; border-bottom: 1px solid var(--line); }
.table td { padding: 0.5rem 1rem 0.5rem 0; border-bottom: 1px dashed var(--line); vertical-align: top; }
.table td.mono { font-size: 0.875rem; white-space: nowrap; }

.pager { display: flex; justify-content: space-between; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
.pager-link { display: grid; gap: 0.15rem; text-decoration: none; max-width: 48%; }
.pager-link.right { text-align: right; }
.pager-link span:last-child { font-weight: 600; }
.missing { padding-block: 4rem; }
@media (max-width: 720px) {
  .icon { width: 56px; height: 56px; border-radius: 13px; }
  .preview-card { padding: 1rem; }
  .hardware { grid-template-columns: minmax(0, 1fr); }
  .rack-photo { max-width: 24rem; }
}
</style>
