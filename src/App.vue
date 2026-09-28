<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import Navbar from './components/Navbar.vue'

const PROTECTED_ROUTES = new Set(['tango', 'buscaminas', 'patches', 'juego-2048'])
const SAVE_KEYS = {
  tango: 'bender.tango.save.v1',
  buscaminas: 'bender.buscaminas.save.v1',
  patches: 'bender.patches.save.v1',
  'juego-2048': 'bender.2048.save.v1',
}

const route = useRoute()
const router = useRouter()
const exitDialogOpen = ref(false)
const pendingExitTarget = ref(null)
const continueButton = ref(null)
const isProtectedRoute = computed(() => PROTECTED_ROUTES.has(route.name))

// Dirección de la transición de vista: home es el nivel 0 y los juegos
// el 1. Bajar de nivel entra hacia abajo, subir hacia arriba, y entre
// juegos del mismo nivel no hay dirección (solo crossfade).
const ROUTE_DEPTH = { home: 0, tango: 1, buscaminas: 1, patches: 1, 'juego-2048': 1 }
const pageTransition = ref('page-fade')

function depthOf(name) {
  return ROUTE_DEPTH[name] ?? 0
}

let previouslyFocused = null
let allowNextNavigation = false
let removeBackButtonListener = null

function setAppInert(inert) {
  const appRoot = document.getElementById('app')
  if (!appRoot) return
  if (inert) {
    appRoot.setAttribute('inert', '')
  } else {
    appRoot.removeAttribute('inert')
  }
}

function hasSavedGame(routeName) {
  const key = SAVE_KEYS[routeName]
  if (!key) return false
  try {
    return Boolean(localStorage.getItem(key))
  } catch {
    return false
  }
}

function setDialogPageState(open) {
  document.documentElement.classList.toggle('exit-dialog-open', open)
  setAppInert(open)
}

async function openExitDialog(target) {
  if (!exitDialogOpen.value) {
    previouslyFocused = document.activeElement
  }
  pendingExitTarget.value = target
  exitDialogOpen.value = true
  setDialogPageState(true)
  await nextTick()
  continueButton.value?.focus()
}

async function closeExitDialog() {
  if (!exitDialogOpen.value) return
  exitDialogOpen.value = false
  setDialogPageState(false)
  pendingExitTarget.value = null
  await nextTick()
  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
}

async function confirmExit() {
  const target = pendingExitTarget.value
  if (!target) return
  exitDialogOpen.value = false
  setDialogPageState(false)
  pendingExitTarget.value = null
  allowNextNavigation = true
  try {
    await router.replace(target.location)
  } catch {
    allowNextNavigation = false
    await openExitDialog(target)
  }
}

const removeNavigationGuard = router.beforeEach((to, from) => {
  const fromDepth = depthOf(from.name)
  const toDepth = depthOf(to.name)
  pageTransition.value =
    toDepth > fromDepth ? 'page-forward' : toDepth < fromDepth ? 'page-back' : 'page-fade'

  if (allowNextNavigation) {
    allowNextNavigation = false
    return true
  }
  if (
    !PROTECTED_ROUTES.has(from.name) ||
    to.fullPath === from.fullPath ||
    !hasSavedGame(from.name)
  ) {
    return true
  }
  openExitDialog({
    fullPath: to.fullPath,
    location: {
      path: to.path,
      query: { ...to.query },
      hash: to.hash,
    },
  })
  return false
})

async function handleNativeBack() {
  if (exitDialogOpen.value) {
    await closeExitDialog()
    return
  }
  if (isProtectedRoute.value && hasSavedGame(route.name)) {
    await openExitDialog({
      fullPath: '/',
      location: { path: '/' },
    })
    return
  }
  if (window.history.state?.back) {
    window.history.back()
    return
  }
  await CapacitorApp.exitApp()
}

onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    removeBackButtonListener = await CapacitorApp.addListener(
      'backButton',
      handleNativeBack,
    )
  } catch {}
})

onBeforeUnmount(() => {
  removeNavigationGuard()
  removeBackButtonListener?.remove()
  setDialogPageState(false)
})
</script>

<template>
  <div class="flex min-h-screen">
    <Navbar />

    <div class="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">
      <RouterView v-slot="{ Component }">
        <Transition :name="pageTransition" mode="out-in">
          <component :is="Component" :key="route.name" />
        </Transition>
      </RouterView>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="exitDialogOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
        @click.self="closeExitDialog"
        @keydown.esc.stop.prevent="closeExitDialog"
      >
        <section
          class="game-dialog-panel w-full max-w-md rounded-2xl border border-ink-600 bg-ink-900 p-6 text-center shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
          aria-describedby="exit-dialog-description"
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/15 text-2xl"
            aria-hidden="true"
          >
            ↩
          </div>
          <h2 id="exit-dialog-title" class="m-0 text-2xl font-extrabold text-white">
            ¿Quieres salir del juego?
          </h2>
          <p id="exit-dialog-description" class="mt-3 mb-6 text-mist-300">
            Si tienes una partida en curso, se guarda automáticamente para continuar cuando vuelvas.
          </p>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="min-h-12 rounded-lg border border-ink-600 px-5 py-3 font-bold text-mist-200 transition hover:bg-ink-800 hover:text-white"
              @click="confirmExit"
            >
              Salir
            </button>
            <button
              ref="continueButton"
              type="button"
              class="min-h-12 rounded-lg bg-orange-500 px-5 py-3 font-extrabold text-white transition hover:bg-orange-600"
              @click="closeExitDialog"
            >
              Seguir jugando
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:global(html.exit-dialog-open),
:global(html.exit-dialog-open body) {
  overflow: hidden;
  overscroll-behavior: none;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity var(--dur-in) var(--ease-out-soft);
}

.dialog-leave-active {
  transition-duration: var(--dur-out);
}

.dialog-enter-active .game-dialog-panel {
  transition:
    opacity var(--dur-in) var(--ease-out-soft),
    transform var(--dur-in) var(--ease-pop);
}

.dialog-leave-active .game-dialog-panel {
  transition:
    opacity var(--dur-out) var(--ease-out-soft),
    transform var(--dur-out) var(--ease-out-soft);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .game-dialog-panel {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.dialog-leave-to .game-dialog-panel {
  opacity: 0;
  transform: scale(0.98);
}
</style>
