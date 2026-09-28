<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { games } from '../data/games.js'

const STORAGE_KEY = 'bender-sidebar-expanded'

const route = useRoute()
const isDesktop = ref(false)
const isExpanded = ref(true)
const isMobileOpen = ref(false)
const panelId = 'app-navigation'
const closeButton = ref(null)
const expandButton = ref(null)
const mobileMenuButton = ref(null)
let desktopQuery

const showLabels = computed(() => !isDesktop.value || isExpanded.value)

function syncViewport(event) {
  isDesktop.value = event.matches
  if (event.matches) isMobileOpen.value = false
}

function openMobileSidebar() {
  isMobileOpen.value = true
  nextTick(() => closeButton.value?.focus())
}

async function closeMobileSidebar() {
  if (!isMobileOpen.value) return
  isMobileOpen.value = false
  await nextTick()
  mobileMenuButton.value?.focus()
}

async function toggleSidebar() {
  if (!isDesktop.value) {
    if (isMobileOpen.value) {
      await closeMobileSidebar()
    } else {
      openMobileSidebar()
    }
    return
  }

  isExpanded.value = !isExpanded.value
  await nextTick()
  if (isExpanded.value) {
    closeButton.value?.focus()
  } else {
    expandButton.value?.focus()
  }
}

function closeFromKeyboard() {
  closeMobileSidebar()
}

watch(isExpanded, (expanded) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(expanded))
  }
})

watch(
  () => route.fullPath,
  () => {
    if (!isDesktop.value) closeMobileSidebar()
  },
)

watch(isMobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  desktopQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = desktopQuery.matches
  isExpanded.value = localStorage.getItem(STORAGE_KEY) !== 'false'
  desktopQuery.addEventListener('change', syncViewport)
})

onBeforeUnmount(() => {
  desktopQuery?.removeEventListener('change', syncViewport)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="contents">
    <div
      class="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-ink-700 bg-ink-950/95 px-3 backdrop-blur-md md:hidden"
    >
      <RouterLink
        to="/"
        class="flex min-h-11 items-center gap-2.5 text-base font-extrabold tracking-tight text-white no-underline"
      >
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-xs font-extrabold"
          aria-hidden="true"
          >BJ</span
        >
        <span>Bender Juegos</span>
      </RouterLink>
      <button
        ref="mobileMenuButton"
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-mist-200 hover:bg-ink-800 hover:text-white"
        :aria-expanded="isMobileOpen"
        :aria-controls="panelId"
        @click="openMobileSidebar"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span>Menú</span>
      </button>
    </div>

    <aside
      :id="panelId"
      class="fixed inset-y-0 left-0 z-50 h-dvh w-72 border-r border-ink-700 bg-ink-900 shadow-2xl transition-[width,transform] duration-200 md:sticky md:top-0 md:z-20 md:h-dvh md:translate-x-0 md:shadow-none"
      :class="[
        isDesktop && !isExpanded ? 'md:w-20' : 'md:w-72',
        !isDesktop && !isMobileOpen ? '-translate-x-full' : 'translate-x-0',
      ]"
      :aria-hidden="!isDesktop && !isMobileOpen"
      :inert="!isDesktop && !isMobileOpen"
      @keydown.esc="closeFromKeyboard"
    >
      <div class="flex h-full min-h-0 flex-col">
        <div
          class="flex h-16 shrink-0 items-center border-b border-ink-700"
          :class="showLabels ? 'justify-between gap-3 px-4' : 'justify-center px-2'"
        >
          <RouterLink
            to="/"
            class="flex min-h-11 items-center gap-2.5 rounded-lg text-white no-underline"
            aria-label="Bender Juegos, ir al inicio"
          >
            <span
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500 text-xs font-extrabold"
              aria-hidden="true"
              >BJ</span
            >
            <span v-if="showLabels" class="truncate text-base font-extrabold tracking-tight"
              >Bender Juegos</span
            >
          </RouterLink>
          <button
            v-if="showLabels"
            ref="closeButton"
            type="button"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-mist-300 hover:bg-ink-800 hover:text-white"
            :aria-label="isDesktop ? 'Contraer menú lateral' : 'Cerrar menú lateral'"
            :aria-expanded="isDesktop ? isExpanded : isMobileOpen"
            :aria-controls="panelId"
            @click="toggleSidebar"
          >
            <svg
              v-if="isDesktop"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <button
          v-if="!showLabels"
          ref="expandButton"
          type="button"
          class="mx-auto mt-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-mist-300 hover:bg-ink-800 hover:text-white"
          aria-label="Expandir menú lateral"
          :aria-expanded="isExpanded"
          :aria-controls="panelId"
          @click="toggleSidebar"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <nav
          class="min-h-0 flex-1 overflow-y-auto px-3 py-4"
          :class="showLabels ? '' : 'px-2'"
          aria-label="Navegación principal"
        >
          <RouterLink
            to="/"
            class="nav-link flex min-h-12 w-full items-center rounded-lg text-[0.95rem] font-semibold text-mist-300 no-underline transition-colors hover:bg-ink-800 hover:text-white"
            :class="showLabels ? 'gap-3 px-3' : 'justify-center px-2'"
            active-class="active"
            exact
            title="Inicio"
            aria-label="Inicio"
          >
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m3 11 9-8 9 8" />
              <path d="M5 10v10h14V10M9 20v-6h6v6" />
            </svg>
            <span v-if="showLabels">Inicio</span>
          </RouterLink>

          <div v-if="showLabels" class="px-3 pt-6 pb-2 text-xs font-bold tracking-widest text-mist-500 uppercase">
            Juegos
          </div>
          <div v-else class="mx-auto my-3 h-px w-8 bg-ink-700" />

          <RouterLink
            v-for="game in games"
            :key="game.id"
            :to="game.route"
            class="nav-link flex min-h-12 w-full items-center rounded-lg text-[0.95rem] font-semibold text-mist-300 no-underline transition-colors hover:bg-ink-800 hover:text-white"
            :class="showLabels ? 'gap-3 px-3' : 'justify-center px-2'"
            active-class="active"
            :title="showLabels ? undefined : game.title"
            :aria-label="game.title"
          >
            <span
              class="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-ink-600 bg-ink-950 px-1.5 text-[0.68rem] font-extrabold text-mist-200"
              aria-hidden="true"
              >{{ game.monogram }}</span
            >
            <span v-if="showLabels">{{ game.title }}</span>
          </RouterLink>
        </nav>

        <footer
          v-if="showLabels"
          class="shrink-0 border-t border-ink-700 px-6 py-4 text-xs leading-relaxed text-mist-500"
        >
          <p class="m-0 font-bold text-mist-300">Bender Juegos</p>
          <p class="m-0 mt-1">{{ games.length }} juegos para jugar sin conexión.</p>
        </footer>
      </div>
    </aside>

    <Transition name="drawer-backdrop">
      <button
        v-if="!isDesktop && isMobileOpen"
        type="button"
        class="fixed inset-0 z-40 cursor-default bg-black/65 backdrop-blur-[2px] md:hidden"
        aria-label="Cerrar menú lateral"
        @click="closeMobileSidebar"
      />
    </Transition>
  </div>
</template>

<style scoped>
.nav-link.active {
  color: #fff;
  background: #f97316;
}

.nav-link.active:hover {
  background: #f97316;
}

.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity var(--dur-in) var(--ease-out-soft);
}

.drawer-backdrop-leave-active {
  transition-duration: var(--dur-out);
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}
</style>
