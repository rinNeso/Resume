/**
 * plugins/index.js
 *
 * Every app plugin, registered from main.js.
 */

// Plugins
import vuetify from './vuetify'
import router from '@/router'

export function registerPlugins (app) {
  app
    .use(vuetify)
    .use(router)
}
