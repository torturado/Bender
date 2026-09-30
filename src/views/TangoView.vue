<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DailyChallengeBanner from '../components/DailyChallengeBanner.vue'
import GameSaveWarning from '../components/GameSaveWarning.vue'
import TangoSetupMenu from '../components/tango/TangoSetupMenu.vue'
import TangoBoard from '../components/tango/TangoBoard.vue'
import TangoToolbar from '../components/tango/TangoToolbar.vue'
import TangoWinHero from '../components/tango/TangoWinHero.vue'
import GamePhase from '../components/GamePhase.vue'
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
  createSeededRandom,
  dailyChallengeSeed,
  normalizeDailyDate,
} from '../games/random.js'
import { confirmReplaceGame } from '../games/confirmReplace.js'
import { useGameTimer } from '../composables/useGameTimer.js'
import { bestTimeFor, recordBestTime } from '../data/gameRecords.js'
import { readGameSettings, writeGameSettings } from '../data/gameSettings.js'
import {
  gameSaveKey,
  readGameSave,
  registerActiveGameSave,
  removeGameSave,
  writeGameSave,
} from '../data/gameStorage.js'
import {
  findRuleViolations,
  isWin,
} from '../games/tango/validators.js'

const route = useRoute()
const dailyDate = normalizeDailyDate(route.query.daily)
const saveKey = gameSaveKey('tango', dailyDate)
const timer = useGameTimer()
const defaultSettings = { size: 6, difficulty: 'media' }
const initialSettings = readGameSettings(
  'tango',
  defaultSettings,
  (value) => SIZES.includes(value?.size) && DIFFICULTIES.some((option) => option.id === value?.difficulty),
)
if (dailyDate) {
  initialSettings.size = 6
  initialSettings.difficulty = 'media'
}

const status = ref('setup') // setup | playing | won
const size = ref(initialSettings.size)
const difficulty = ref(initialSettings.difficulty)
const solution = ref([])
const givens = ref([])
const constraints = ref([])
const board = ref([])
const history = ref([]) // [{ r, c, prev, next }]
const moves = ref(0)
const winSeconds = ref(0)
const isNewRecord = ref(false)
const puzzleNotice = ref('')
const moveAnnouncement = ref('')
let saveEnabled = false

const timeCategory = computed(() => `${size.value}x${size.value}:${difficulty.value}`)
const bestTime = ref(bestTimeFor('tango', timeCategory.value))

watch([size, difficulty], ([nextSize, nextDifficulty]) => {
  bestTime.value = bestTimeFor('tango', `${nextSize}x${nextSize}:${nextDifficulty}`)
  if (!dailyDate) writeGameSettings('tango', { size: nextSize, difficulty: nextDifficulty })
})

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
  return removeGameSave(saveKey)
}

function saveGame() {
  if (!saveEnabled || status.value !== 'playing' || board.value.length !== size.value) return true
  return writeGameSave(saveKey, {
    version: 1,
    size: size.value,
    difficulty: difficulty.value,
    board: board.value,
    solution: solution.value,
    givens: givens.value,
    constraints: constraints.value,
    history: history.value,
    moves: moves.value,
    elapsedMs: timer.elapsedMs(),
    savedAt: Date.now(),
    dailyDate,
  })
}

function updateSavedGame() {
  if (saveEnabled && status.value === 'playing') {
    return saveGame()
  } else if (status.value === 'won') {
    return clearSavedGame()
  }
  return true
}

function restoreGame() {
  try {
    const raw = readGameSave(saveKey)
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
    timer.start(data.elapsedMs)
    winSeconds.value = 0
    saveEnabled = true
    status.value = 'playing'
  } catch {
    clearSavedGame()
  }
}

watch(
  [status, size, difficulty, board, solution, givens, constraints, history, moves],
  updateSavedGame,
  { deep: true },
)

restoreGame()
const unregisterActiveGameSave = registerActiveGameSave(updateSavedGame)
onBeforeUnmount(() => {
  updateSavedGame()
  unregisterActiveGameSave()
})

const errorKeys = computed(() => {
  if (status.value === 'setup' || board.value.length === 0) return new Set()
  return findRuleViolations(board.value, constraints.value).cellKeys
})

function clone(boardToCopy) {
  return boardToCopy.map((row) => row.slice())
}

function startGame({ size: newSize, difficulty: newDifficulty }) {
  const selectedSize = dailyDate ? 6 : newSize
  const selectedDifficulty = dailyDate ? 'media' : newDifficulty
  const random = dailyDate
    ? createSeededRandom(dailyChallengeSeed('tango', dailyDate))
    : Math.random
  const puzzle = generatePuzzle(selectedSize, selectedDifficulty, random)
  size.value = puzzle.size
  difficulty.value = puzzle.difficulty
  solution.value = puzzle.solution
  givens.value = puzzle.givens
  constraints.value = puzzle.constraints
  board.value = clone(puzzle.initialBoard)
  history.value = []
  moves.value = 0
  winSeconds.value = 0
  isNewRecord.value = false
  puzzleNotice.value = puzzle.extraGivens > 0
    ? `Se añadieron ${puzzle.extraGivens} pistas para garantizar que este tablero tenga una única solución.`
    : ''
  timer.start()
  saveEnabled = true
  status.value = 'playing'
  nextTick(() => window.scrollTo(0, 0))
}

function restartSame() {
  // Reinicia la MISMA partida: vuelve a las pistas iniciales.
  clearSavedGame()
  const fresh = board.value.map((row, r) => row.map((_, c) => (givens.value[r][c] ? solution.value[r][c] : EMPTY)))
  board.value = fresh
  history.value = []
  moves.value = 0
  timer.start()
  status.value = 'playing'
}

function newPuzzle() {
  // OTRA partida: nueva organización con la misma configuración.
  startGame({ size: size.value, difficulty: difficulty.value })
}

function backToSetup() {
  saveEnabled = false
  timer.stop()
  clearSavedGame()
  status.value = 'setup'
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  board.value[last.r][last.c] = last.prev
  moves.value = Math.max(0, moves.value - 1)
  moveAnnouncement.value = `Fila ${last.r + 1}, columna ${last.c + 1}: jugada deshecha.`
}

function requestRestart() {
  if (confirmReplaceGame(moves.value, 'reiniciar')) restartSame()
}

function requestNewPuzzle() {
  if (confirmReplaceGame(moves.value, 'empezar otra partida')) newPuzzle()
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
  if (history.value.length > 100) history.value.shift()
  moves.value++
  const symbol = next === EMPTY ? 'casilla vacía' : next === SUN ? 'sol' : 'luna'
  const hasError = errorKeys.value.has(`${r},${c}`)
  moveAnnouncement.value = `Fila ${r + 1}, columna ${c + 1}: ${symbol}${hasError ? ', incumple una regla' : ''}.`

  if (isWin(board.value, solution.value, givens.value, constraints.value)) {
    winSeconds.value = Math.floor(timer.elapsedMs() / 1000)
    timer.stop()
    isNewRecord.value = recordBestTime('tango', timeCategory.value, winSeconds.value, moves.value)
    bestTime.value = bestTimeFor('tango', timeCategory.value)
    status.value = 'won'
  }
}
</script>

<template>
  <main class="game-page" :class="{ 'game-page--active': status === 'playing' }">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <DailyChallengeBanner v-if="dailyDate" :date="dailyDate" game-title="Tango" />
    <GameSaveWarning />

    <Transition name="phase" mode="out-in">
      <GamePhase v-if="status === 'setup'" variant="setup">
        <div class="game-header tango">
          <span class="monogram" aria-hidden="true">T</span>
          <div>
            <h1>Tango</h1>
            <p>Puzzle de lógica por cuadrícula.</p>
          </div>
        </div>
        <TangoSetupMenu
          v-model:size="size"
          v-model:difficulty="difficulty"
          :locked="Boolean(dailyDate)"
          @play="startGame"
        />
      </GamePhase>

      <GamePhase v-else-if="status === 'playing'">
        <p class="mb-4 text-center text-sm text-mist-400">
          {{ size }}×{{ size }} · {{ difficultyLabel(difficulty) }} · lo que incumple las reglas
          se marca en <span class="font-bold text-danger-fg">rojo con una ✕</span>
        </p>
        <TangoToolbar
          :can-undo="history.length > 0"
          :moves="moves"
          :seconds="timer.seconds.value"
          :daily="Boolean(dailyDate)"
          @restart="requestRestart"
          @undo="undo"
          @new-game="requestNewPuzzle"
        />
        <p v-if="puzzleNotice" class="board-alert mx-auto mb-4 max-w-[560px] text-center text-sm text-mist-300" role="status">
          {{ puzzleNotice }}
        </p>
        <TangoBoard
          :board="board"
          :givens="givens"
          :error-keys="errorKeys"
          :constraints="constraints"
          @cell-click="onCellClick"
        />
        <p class="sr-only" aria-live="polite">{{ moveAnnouncement }}</p>
        <p class="mt-5 text-center">
          <button
            type="button"
            class="bg-transparent border-none text-xs font-semibold text-mist-400 underline-offset-2 hover:text-mist-300 hover:underline"
            @click="backToSetup"
          >
            Cambiar configuración (tamaño / dificultad)
          </button>
        </p>
      </GamePhase>

      <GamePhase v-else variant="won">
        <TangoWinHero
          :size="size"
          :difficulty-label="difficultyLabel(difficulty)"
          :moves="moves"
          :seconds="winSeconds"
          :best-time="bestTime?.seconds ?? null"
          :is-new-record="isNewRecord"
          @play-again="newPuzzle"
        />
        <p class="mt-5 text-center">
          <button
            type="button"
            class="bg-transparent border-none text-xs font-semibold text-mist-400 underline-offset-2 hover:text-mist-300 hover:underline"
            @click="backToSetup"
          >
            Cambiar configuración (tamaño / dificultad)
          </button>
        </p>
      </GamePhase>
    </Transition>
  </main>
</template>

<style scoped>
@import './game-page.css';
.game-header.tango {
  background-color: var(--game-tango);
  border-color: var(--game-tango-border);
}
</style>
