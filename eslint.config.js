import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // Build scripts run under Node, not in the browser.
  {
    name: 'app/node-scripts',
    files: ['scripts/**', '*.config.{js,mjs}'],
    languageOptions: {
      globals: { process: 'readonly', Buffer: 'readonly' },
    },
  },
]
