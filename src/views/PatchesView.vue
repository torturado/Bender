<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PatchesBoard from '../components/patches/PatchesBoard.vue'
import PatchesToolbar from '../components/patches/PatchesToolbar.vue'
import PatchesWinHero from '../components/patches/PatchesWinHero.vue'
import { SIZE } from '../games/patches/constants.js'
import { generatePuzzle } from '../games/patches/generator.js'
import { validatePlacement, checkWin } from '../games/patches/validators.js'

const status = ref('playing') // playing | won
const difficulty = ref('media')
const clues = ref([])
const patches = ref([]) // [{ id, r1, c1, r2, c2 }]
const history = ref([]) // [{ type: 'add' | 'delete', patch }]
const moves = ref(0)
const startTime = ref(0)
const winSeconds = ref(0)
const notice = ref(null)
let noticeTimer = null
let nextId = 1

function flashNotice(msg) {
  notice.value = msg
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 2600)
}

function newGame() {
  const puzzle = generatePuzzle()
  difficulty.value = puzzle.difficulty
  clues.value = puzzle.clues
  patches.value = []
  history.value = []
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  startTime.value = Date.now()
  status.value = 'playing'
}

function restart() {
  // Reiniciar: vacía el tablero, mismo puzzle y dificultad.
  patches.value = []
  history.value = []
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  startTime.value = Date.now()
  status.value = 'playing'
}

function onDraw(rect) {
  if (status.value !== 'playing') return
  const { ok, reason } = validatePlacement(rect, clues.value, patches.value)
  if (!ok) {
    flashNotice(reason)
    return
  }
  const patch = { id: nextId++, ...rect }
  patches.value = [...patches.value, patch]
  history.value.push({ type: 'add', patch })
  moves.value++
  if (checkWin(patches.value, clues.value, SIZE)) {
    winSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    status.value = 'won'
  }
}

function onDeletePatch(id) {
  if (status.value !== 'playing') return
  const patch = patches.value.find((p) => p.id === id)
  if (!patch) return
  patches.value = patches.value.filter((p) => p.id !== id)
  history.value.push({ type: 'delete', patch })
  moves.value++
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  if (last.type === 'add') {
    patches.value = patches.value.filter((p) => p.id !== last.patch.id)
  } else {
    patches.value = [...patches.value, last.patch]
  }
  moves.value++
}

onMounted(() => {
  // Entrada directa: sin menú, dificultad aleatoria.
  if (clues.value.length === 0) newGame()
})

onUnmounted(() => {
  if (noticeTimer) clearTimeout(noticeTimer)
})
</script>

<template>
  <main class="game-page">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>

    <!-- Fase 1: juego (entrada directa) -->
    <template v-if="status === 'playing'">
      <PatchesToolbar
        :difficulty="difficulty"
        :can-undo="history.length > 0"
        :moves="moves"
        @undo="undo"
        @restart="restart"
        @new-game="newGame"
      />
      <div
        v-if="notice"
        class="mx-auto mb-4 w-full max-w-[440px] rounded-md border border-red-500 bg-red-500/10 px-4 py-2.5 text-center text-sm font-bold text-red-400"
        role="alert"
      >
        {{ notice }}
      </div>
      <PatchesBoard
        :clues="clues"
        :patches="patches"
        @draw="onDraw"
        @delete-patch="onDeletePatch"
      />
    </template>

    <!-- Fase 2: hero de completado -->
    <PatchesWinHero
      v-else
      :difficulty="difficulty"
      :moves="moves"
      :seconds="winSeconds"
      @play-again="newGame"
    />
  </main>
</template>

<style scoped>
@import './game-page.css';
</style>
