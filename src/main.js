import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { gameColorVars } from './data/games.js'

for (const [name, value] of Object.entries(gameColorVars)) {
  document.documentElement.style.setProperty(name, value)
}

createApp(App).use(router).mount('#app')
