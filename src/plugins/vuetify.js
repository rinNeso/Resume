/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'vuetify/styles'
import '@/styles/main.scss'

// Composables
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

// Cool paper and navy ink, with USAF blue lifted enough to read as link text.
// `muted`, `line`, `ok` and `lock` are custom colors used by the components.
const light = {
  dark: false,
  colors: {
    background: '#f3f5f8',
    surface: '#ffffff',
    'on-background': '#101a2b',
    'on-surface': '#101a2b',
    primary: '#1d4fb8',
    muted: '#566278',
    line: '#d8dde6',
    ok: '#1d7a4a',
    lock: '#7a5a12',
  },
  variables: { 'border-color': '#566278', 'border-opacity': 0.28 },
}

const dark = {
  dark: true,
  colors: {
    background: '#0d1420',
    surface: '#141d2c',
    'on-background': '#e6ebf3',
    'on-surface': '#e6ebf3',
    primary: '#8fb0ff',
    muted: '#9aa6ba',
    line: '#263246',
    ok: '#7fd3a4',
    lock: '#e7c477',
  },
  variables: { 'border-color': '#9aa6ba', 'border-opacity': 0.22 },
}

// Follow the visitor's system setting; App.vue keeps it in sync if it changes.
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: prefersDark ? 'dark' : 'light',
    themes: { light, dark },
  },
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  defaults: {
    VChip: { label: true, size: 'small' },
  },
})
