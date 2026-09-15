<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Game2048Board from '../components/juego2048/Game2048Board.vue'
import Game2048Toolbar from '../components/juego2048/Game2048Toolbar.vue'
import Game2048Hero from '../components/juego2048/Game2048Hero.vue'
import { TARGET } from '../games/juego2048/constants.js'
import {
  cloneBoard,
  spawnTile,
  newGame,
  move,
  canMove,
  hasTarget,
} from '../games/juego2048/engine.js'

const status = ref('playing') // playing | won | endless | lost
const board = ref(newGame())
const score = ref(0)
const moves = ref(0)
const history = ref([]) // [{ board, score }]

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

function restart() {
  board.value = newGame()
  score.value = 0
  moves.value = 0
  history.value = []
  status.value = 'playing'
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  // Si se deshace desde un hero, se vuelve al juego
  // (a infinito si el tablero ya tenía el 2048).
  if (status.value === 'lost' || status.value === 'won') {
    status.value = hasTarget(last.board, TARGET) ? 'endless' : 'playing'
  }
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

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main class="game-page">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>

    <!-- Fase 1 y 2: juego (también en modo infinito) -->
    <template v-if="status === 'playing' || status === 'endless'">
      <p class="mb-4 text-center text-sm text-mist-400">
        Desliza y combina hasta {{ TARGET }}.
        <span v-if="status === 'endless'" class="font-bold text-amber-300">∞ Modo infinito</span>
        <span v-else class="sm:hidden"> · desliza para mover</span>
        <span v-if="status !== 'endless'" class="hidden sm:inline"> · flechas o WASD para mover</span>
      </p>
      <Game2048Toolbar
        :can-undo="history.length > 0"
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
