<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import TangoSetupMenu from '../components/tango/TangoSetupMenu.vue'
import TangoBoard from '../components/tango/TangoBoard.vue'
import TangoToolbar from '../components/tango/TangoToolbar.vue'
import TangoWinHero from '../components/tango/TangoWinHero.vue'
import {
  EMPTY,
  SUN,
  MOON,
  SIZES,
  DIFFICULTIES,
  difficultyLabel,
} from '../games/tango/constants.js'
import { generatePuzzle } from '../games/tango/generator.js'
import {
  findRuleViolations,
  isWin,
} from '../games/tango/validators.js'

const SAVE_KEY = 'bender.tango.save.v1'

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
let saveEnabled = false

function isGrid(grid, size, isValidValue) {
  return (
    Array.isArray(grid) &&
    grid.length === size &&
    grid.every(
      (row) => Array.isArray(row) && row.length === size && row.every(isValidValue),
    )
  )
}

function isValidCoordinate(value, size) {
  return Number.isInteger(value) && value >= 0 && value < size
}

function isValidCell(value) {
  return value === EMPTY || value === SUN || value === MOON
}

function isValidConstraint(constraint, size) {
  return (
    constraint &&
    isValidCoordinate(constraint.r1, size) &&
    isValidCoordinate(constraint.c1, size) &&
    isValidCoordinate(constraint.r2, size) &&
    isValidCoordinate(constraint.c2, size) &&
    ['=', 'x'].includes(constraint.type)
  )
}

function isValidHistoryEntry(entry, size) {
  return (
    entry &&
    isValidCoordinate(entry.r, size) &&
    isValidCoordinate(entry.c, size) &&
    isValidCell(entry.prev) &&
    isValidCell(entry.next)
  )
}

function isValidSave(data) {
  if (
    data?.version !== 1 ||
    !SIZES.includes(data.size) ||
    !DIFFICULTIES.some((option) => option.id === data.difficulty) ||
    !isGrid(data.board, data.size, isValidCell) ||
    !isGrid(data.solution, data.size, isValidCell) ||
    !isGrid(data.givens, data.size, (value) => typeof value === 'boolean') ||
    !Array.isArray(data.constraints) ||
    !data.constraints.every((constraint) => isValidConstraint(constraint, data.size)) ||
    !Array.isArray(data.history) ||
    !data.history.every((entry) => isValidHistoryEntry(entry, data.size)) ||
    !Number.isInteger(data.moves) ||
    data.moves < 0 ||
    typeof data.elapsedMs !== 'number' ||
    data.elapsedMs < 0
  ) {
    return false
  }

  return data.givens.every((row, r) =>
    row.every(
      (isGiven, c) => !isGiven || data.board[r][c] === data.solution[r][c],
    ),
  )
}

function clearSavedGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {}
}

function saveGame() {
  if (!saveEnabled || status.value !== 'playing' || board.value.length !== size.value) return
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        size: size.value,
        difficulty: difficulty.value,
        board: board.value,
        solution: solution.value,
        givens: givens.value,
        constraints: constraints.value,
        history: history.value,
        moves: moves.value,
        elapsedMs: Math.max(0, Date.now() - startTime.value),
        savedAt: Date.now(),
      }),
    )
  } catch {}
}

function updateSavedGame() {
  if (saveEnabled && status.value === 'playing') {
    saveGame()
  } else if (status.value === 'won') {
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
    size.value = data.size
    difficulty.value = data.difficulty
    board.value = data.board
    solution.value = data.solution
    givens.value = data.givens
    constraints.value = data.constraints
    history.value = data.history
    moves.value = data.moves
    startTime.value = Date.now() - data.elapsedMs
    winSeconds.value = 0
    saveEnabled = true
    status.value = 'playing'
  } catch {
    clearSavedGame()
  }
}

watch(
  [status, size, difficulty, board, solution, givens, constraints, history, moves, startTime],
  updateSavedGame,
  { deep: true },
)

restoreGame()
onBeforeUnmount(updateSavedGame)

const errorKeys = computed(() => {
  if (status.value === 'setup' || board.value.length === 0) return new Set()
  return findRuleViolations(board.value, constraints.value).cellKeys
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
  saveEnabled = true
  status.value = 'playing'
  nextTick(() => window.scrollTo(0, 0))
}

function restartSame() {
  // Reinicia la MISMA partida: vuelve a las pistas iniciales.
  saveEnabled = false
  clearSavedGame()
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
  saveEnabled = false
  clearSavedGame()
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
  saveEnabled = true
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
  <main class="game-page" :class="{ 'game-page--active': status === 'playing' }">
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
        {{ size }}×{{ size }} · {{ difficultyLabel(difficulty) }} · lo que incumple las reglas
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
