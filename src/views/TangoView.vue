<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import TangoSetupMenu from '../components/tango/TangoSetupMenu.vue'
import TangoBoard from '../components/tango/TangoBoard.vue'
import TangoToolbar from '../components/tango/TangoToolbar.vue'
import TangoWinHero from '../components/tango/TangoWinHero.vue'
import { EMPTY, SUN, MOON, difficultyLabel } from '../games/tango/constants.js'
import { generatePuzzle } from '../games/tango/generator.js'
import {
  findSolutionMismatches,
  isWin,
} from '../games/tango/validators.js'

const status = ref('setup') // setup | playing | won
const size = ref(6)
const difficulty = ref('media')
const solution = ref([])
const givens = ref([])
const constraints = ref([])
const board = ref([])
const history = ref([]) // [{ r, c, prev, next }]
const moves = ref(0)
const startTime = ref(0)
const winSeconds = ref(0)

const errorKeys = computed(() => {
  if (status.value === 'setup' || board.value.length === 0) return new Set()
  return findSolutionMismatches(board.value, solution.value, givens.value)
})

function clone(boardToCopy) {
  return boardToCopy.map((row) => row.slice())
}

function startGame({ size: newSize, difficulty: newDifficulty }) {
  const puzzle = generatePuzzle(newSize, newDifficulty)
  size.value = puzzle.size
  difficulty.value = puzzle.difficulty
  solution.value = puzzle.solution
  givens.value = puzzle.givens
  constraints.value = puzzle.constraints
  board.value = clone(puzzle.initialBoard)
  history.value = []
  moves.value = 0
  winSeconds.value = 0
  startTime.value = Date.now()
  status.value = 'playing'
}

function restartSame() {
  // Reinicia la MISMA partida: vuelve a las pistas iniciales.
  const fresh = board.value.map((row, r) => row.map((_, c) => (givens.value[r][c] ? solution.value[r][c] : EMPTY)))
  board.value = fresh
  history.value = []
  moves.value = 0
  startTime.value = Date.now()
  status.value = 'playing'
}

function newPuzzle() {
  // OTRA partida: nueva organización con la misma configuración.
  startGame({ size: size.value, difficulty: difficulty.value })
}

function backToSetup() {
  status.value = 'setup'
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  board.value[last.r][last.c] = last.prev
}

function cycle(value) {
  if (value === EMPTY) return SUN
  if (value === SUN) return MOON
  return EMPTY
}

function onCellClick({ r, c }) {
  if (status.value !== 'playing') return
  if (givens.value[r]?.[c]) return
  const prev = board.value[r][c]
  const next = cycle(prev)
  if (prev === next) return
  board.value[r][c] = next
  history.value.push({ r, c, prev, next })
  moves.value++

  if (isWin(board.value, solution.value, givens.value, constraints.value)) {
    winSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    status.value = 'won'
  }
}
</script>

<template>
  <main class="game-page">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <div v-if="status === 'setup'" class="game-header tango">
      <span class="monogram" aria-hidden="true">T</span>
      <div>
        <h1>Tango</h1>
        <p>Puzzle de lógica por cuadrícula.</p>
      </div>
    </div>

    <!-- Fase 1: menú de configuración -->
    <TangoSetupMenu v-if="status === 'setup'" @play="startGame" />

    <!-- Fase 2: juego -->
    <template v-else-if="status === 'playing'">
      <p class="mb-4 text-center text-sm text-mist-400">
        {{ size }}×{{ size }} · {{ difficultyLabel(difficulty) }} · lo mal colocado
        se marca en <span class="font-bold text-red-400">rojo con una ✕</span>
      </p>
      <TangoToolbar
        :can-undo="history.length > 0"
        :moves="moves"
        @restart="restartSame"
        @undo="undo"
        @new-game="newPuzzle"
      />
      <TangoBoard
        :board="board"
        :givens="givens"
        :error-keys="errorKeys"
        :constraints="constraints"
        @cell-click="onCellClick"
      />
      <p class="mt-5 text-center">
        <button
          type="button"
          class="bg-transparent border-none text-xs font-semibold text-mist-500 underline-offset-2 hover:text-mist-300 hover:underline"
          @click="backToSetup"
        >
          Cambiar configuración (tamaño / dificultad)
        </button>
      </p>
    </template>

    <!-- Fase 3: hero de completado -->
    <template v-else>
      <TangoWinHero
        :size="size"
        :difficulty-label="difficultyLabel(difficulty)"
        :moves="moves"
        :seconds="winSeconds"
        @play-again="newPuzzle"
      />
      <p class="mt-5 text-center">
        <button
          type="button"
          class="bg-transparent border-none text-xs font-semibold text-mist-500 underline-offset-2 hover:text-mist-300 hover:underline"
          @click="backToSetup"
        >
          Cambiar configuración (tamaño / dificultad)
        </button>
      </p>
    </template>
  </main>
</template>

<style scoped>
@import './game-page.css';
.game-header.tango {
  background-color: #14532d;
  border-color: #fb923c;
}
</style>
