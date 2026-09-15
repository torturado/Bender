import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// Vistas placeholder de cada juego.
// Cuando implementemos cada juego, editaremos su fichero en src/views/.
import TangoView from '../views/TangoView.vue'
import BuscaminasView from '../views/BuscaminasView.vue'
import PatchesView from '../views/PatchesView.vue'
import Juego2048View from '../views/Juego2048View.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Inicio' },
  },
  {
    path: '/juegos/tango',
    name: 'tango',
    component: TangoView,
    meta: { title: 'Tango' },
  },
  {
    path: '/juegos/buscaminas',
    name: 'buscaminas',
    component: BuscaminasView,
    meta: { title: 'Buscaminas' },
  },
  {
    path: '/juegos/patches',
    name: 'patches',
    component: PatchesView,
    meta: { title: 'Patches' },
  },
  {
    path: '/juegos/2048',
    name: 'juego-2048',
    component: Juego2048View,
    meta: { title: '2048' },
  },
  // Cualquier ruta desconocida vuelve al inicio
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
