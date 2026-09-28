<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Game2048Board from '../components/juego2048/Game2048Board.vue'
import Game2048Toolbar from '../components/juego2048/Game2048Toolbar.vue'
import Game2048Hero from '../components/juego2048/Game2048Hero.vue'
import { SIZE, TARGET } from '../games/juego2048/constants.js'
import {
  cloneBoard,
  spawnTile,
  newGame,
  move,
  canMove,
  hasTarget,
} from '../games/juego2048/engine.js'

const SAVE_KEY = 'bender.2048.save.v1'

const status = ref('setup') // setup | playing | won | endless | lost
const board = ref([])
const score = ref(0)
const moves = ref(0)
const history = ref([]) // [{ board, score }]
const hasUndone = ref(false)
let saveEnabled = false

function isValidBoard(value) {
  return (
    Array.isArray(value) &&
    value.length === SIZE &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === SIZE &&
        row.every((cell) => Number.isInteger(cell) && cell >= 0),
    )
  )
}

function isValidSave(data) {
  return (
    data?.version === 1 &&
    ['playing', 'endless'].includes(data.status) &&
    isValidBoard(data.board) &&
    Number.isInteger(data.score) &&
    data.score >= 0 &&
    Number.isInteger(data.moves) &&
    data.moves >= 0 &&
    Array.isArray(data.history) &&
    data.history.every(
      (entry) =>
        isValidBoard(entry.board) &&
        Number.isInteger(entry.score) &&
        entry.score >= 0,
    ) &&
    (data.hasUndone === undefined || typeof data.hasUndone === 'boolean')
  )
}

function clearSavedGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {}
}

function saveGame() {
  if (
    !saveEnabled ||
    (status.value !== 'playing' && status.value !== 'endless')
  ) {
    return
  }
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        status: status.value,
        board: board.value,
        score: score.value,
        moves: moves.value,
        history: history.value,
        hasUndone: hasUndone.value,
        savedAt: Date.now(),
      }),
    )
  } catch {}
}

function updateSavedGame() {
  if (saveEnabled && (status.value === 'playing' || status.value === 'endless')) {
    saveGame()
  } else {
    clearSavedGame()
  }
}

function restoreGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!isValidSave(data)) {
      clearSavedGame()
      return
    }
    status.value = data.status
    board.value = data.board
    score.value = data.score
    moves.value = data.moves
    history.value = data.history
    hasUndone.value = data.hasUndone === true
    saveEnabled = true
  } catch {
    clearSavedGame()
  }
}

watch([status, board, score, moves, history, hasUndone], updateSavedGame, { deep: true })

restoreGame()

const KEY_DIRS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
}

function applyMove(dir) {
  if (status.value !== 'playing' && status.value !== 'endless') return
  const res = move(board.value, dir)
  if (!res.changed) return
  saveEnabled = true
  history.value.push({ board: cloneBoard(board.value), score: score.value })
  board.value = res.board
  score.value += res.gained
  moves.value++
  spawnTile(board.value)
  if (status.value === 'playing' && hasTarget(board.value, TARGET)) {
    status.value = 'won'
  } else if (!canMove(board.value)) {
    status.value = 'lost'
  }
}

function resetGame() {
  board.value = newGame()
  score.value = 0
  moves.value = 0
  history.value = []
  hasUndone.value = false
  status.value = 'playing'
}

function startGame() {
  saveEnabled = true
  resetGame()
}

function restart() {
  saveEnabled = false
  clearSavedGame()
  resetGame()
}

function undo() {
  if (hasUndone.value) return
  const last = history.value.pop()
  if (!last) return
  // Si se deshace desde un hero, se vuelve al juego
  // (a infinito si el tablero ya tenía el 2048).
  if (status.value === 'lost' || status.value === 'won') {
    status.value = hasTarget(last.board, TARGET) ? 'endless' : 'playing'
  }
  hasUndone.value = true
  board.value = last.board
  score.value = last.score
  moves.value = Math.max(0, moves.value - 1)
}

function continueEndless() {
  status.value = 'endless'
}

function onKeydown(e) {
  const dir = KEY_DIRS[e.key]
  if (!dir) return
  if (e.key.startsWith('Arrow')) e.preventDefault()
  applyMove(dir)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  updateSavedGame()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main
    class="game-page"
    :class="{
      'game-page--active': status === 'playing' || status === 'endless',
    }"
  >
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>

    <section
      v-if="status === 'setup'"
      class="mx-auto w-full max-w-xl rounded-lg border border-ink-500 bg-ink-900 p-6 sm:p-8"
    >
      <h2 class="m-0 text-xl font-extrabold tracking-tight text-white">Configura tu partida</h2>
      <p class="mt-1 mb-6 text-sm text-mist-400">
        Une fichas iguales hasta llegar al {{ TARGET }} en un tablero de {{ SIZE }}×{{ SIZE }}.
      </p>

      <div class="mb-8 grid grid-cols-2 gap-2">
        <div class="rounded-lg border border-ink-600 bg-ink-800 p-4 text-center">
          <p class="m-0 text-xs font-bold tracking-wider text-mist-500 uppercase">Tablero</p>
          <p class="mt-1 mb-0 text-lg font-extrabold text-white">{{ SIZE }}×{{ SIZE }}</p>
        </div>
        <div class="rounded-lg border border-ink-600 bg-ink-800 p-4 text-center">
          <p class="m-0 text-xs font-bold tracking-wider text-mist-500 uppercase">Objetivo</p>
          <p class="mt-1 mb-0 text-lg font-extrabold text-white">{{ TARGET }}</p>
        </div>
      </div>

      <button
        type="button"
        class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-white transition hover:bg-orange-600"
        @click="startGame"
      >
        Jugar
      </button>
      <p class="mt-3 mb-0 text-center text-xs text-mist-400">
        En móvil, desliza sobre el tablero. En ordenador, usa las flechas o WASD.
      </p>
    </section>

    <template v-else-if="status === 'playing' || status === 'endless'">
      <p class="mb-4 text-center text-sm text-mist-400">
        Desliza y combina hasta {{ TARGET }}.
        <span v-if="status === 'endless'" class="font-bold text-amber-300">∞ Modo infinito</span>
        <span v-else class="sm:hidden"> · desliza para mover</span>
        <span v-if="status !== 'endless'" class="hidden sm:inline"> · flechas o WASD para mover</span>
      </p>
      <Game2048Toolbar
        :can-undo="history.length > 0 && !hasUndone"
        :score="score"
        :moves="moves"
        @restart="restart"
        @undo="undo"
      />
      <Game2048Board :board="board" @move="applyMove" />
    </template>

    <!-- Fase 3a: hero de victoria con las 2 opciones -->
    <Game2048Hero
      v-else-if="status === 'won'"
      kind="win"
      :score="score"
      :moves="moves"
      @restart="restart"
      @continue="continueEndless"
    />

    <!-- Fase 3b: hero de derrota -->
    <Game2048Hero
      v-else
      kind="lost"
      :score="score"
      :moves="moves"
      @restart="restart"
    />
  </main>
</template>

<style scoped>
@import './game-page.css';
</style>
