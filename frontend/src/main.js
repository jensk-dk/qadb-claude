import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light'
  }
})

// Create Pinia store
const pinia = createPinia()

// Attach app to a global variable for debugging
const app = createApp(App)

// Workaround for reactivity issues
app.config.unwrapInjectedRef = true

// Add a global mixin for debugging component lifecycle
app.mixin({
  created() {
    console.log(`Component "${this.$options.name}" created`)
  },
  beforeUnmount() {
    console.log(`Component "${this.$options.name}" beforeUnmount`)
  },
  unmounted() {
    console.log(`Component "${this.$options.name}" unmounted`)
  }
})

// Use the plugins
app.use(router)
app.use(pinia)
app.use(vuetify)

// Mount the app
app.mount('#app')

// Expose the app globally for debugging
window.vueApp = app