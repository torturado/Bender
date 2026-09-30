<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DailyChallengeBanner from '../components/DailyChallengeBanner.vue'
import GameSaveWarning from '../components/GameSaveWarning.vue'
import BuscaminasSetupMenu from '../components/buscaminas/BuscaminasSetupMenu.vue'
import BuscaminasBoard from '../components/buscaminas/BuscaminasBoard.vue'
import BuscaminasToolbar from '../components/buscaminas/BuscaminasToolbar.vue'
import BuscaminasWinHero from '../components/buscaminas/BuscaminasWinHero.vue'
import GamePhase from '../components/GamePhase.vue'
import {
  TOOL_PALA,
  TOOL_BANDERA,
  SIZES,
  DIFFICULTIES,
  minesFor,
  difficultyLabel,
} from '../games/buscaminas/constants.js'
import {
  emptyGrid,
  placeMines,
  computeNumbers,
  revealFrom,
  chordFrom,
  checkWin,
  wrongFlags,
  countFlags,
} from '../games/buscaminas/engine.js'
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

const route = useRoute()
const dailyDate = normalizeDailyDate(route.query.daily)
const saveKey = gameSaveKey('buscaminas', dailyDate)
const timer = useGameTimer()
const defaultSettings = { size: 8, difficulty: 'media' }
const initialSettings = readGameSettings(
  'buscaminas',
  defaultSettings,
  (value) => SIZES.includes(value?.size) && DIFFICULTIES.some((option) => option.id === value?.difficulty),
)
if (dailyDate) {
  initialSettings.size = 10
  initialSettings.difficulty = 'media'
}

const status = ref('setup') // setup | playing | lost | won
const size = ref(initialSettings.size)
const difficulty = ref(initialSettings.difficulty)
const mineTotal = ref(0)
const mines = ref([])
const numbers = ref([])
const revealed = ref([])
const flagged = ref([])
const minesPlaced = ref(false)
const exploded = ref(null)
const tool = ref(TOOL_PALA)
const moves = ref(0)
const winSeconds = ref(0)
const isNewRecord = ref(false)
const moveAnnouncement = ref('')
const lossAlert = ref(null)
let saveEnabled = false

const timeCategory = computed(() => `${size.value}x${size.value}:${difficulty.value}`)
const bestTime = ref(bestTimeFor('buscaminas', timeCategory.value))

watch([size, difficulty], ([nextSize, nextDifficulty]) => {
  bestTime.value = bestTimeFor('buscaminas', `${nextSize}x${nextSize}:${nextDifficulty}`)
  if (!dailyDate) writeGameSettings('buscaminas', { size: nextSize, difficulty: nextDifficulty })
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

function isValidSave(data) {
  return (
    data?.version === 1 &&
    SIZES.includes(data.size) &&
    DIFFICULTIES.some((difficulty) => difficulty.id === data.difficulty) &&
    isGrid(data.mines, data.size, (value) => typeof value === 'boolean') &&
    isGrid(
      data.numbers,
      data.size,
      (value) => Number.isInteger(value) && value >= -1 && value <= 8,
    ) &&
    isGrid(data.revealed, data.size, (value) => typeof value === 'boolean') &&
    isGrid(data.flagged, data.size, (value) => typeof value === 'boolean') &&
    typeof data.minesPlaced === 'boolean' &&
    [TOOL_PALA, TOOL_BANDERA].includes(data.tool) &&
    Number.isInteger(data.moves) &&
    data.moves >= 0 &&
    typeof data.elapsedMs === 'number' &&
    data.elapsedMs >= 0
  )
}

function clearSavedGame() {
  return removeGameSave(saveKey)
}

function saveGame() {
  if (!saveEnabled || status.value !== 'playing' || mines.value.length !== size.value) return true
  return writeGameSave(saveKey, {
    version: 1,
    size: size.value,
    difficulty: difficulty.value,
    mines: mines.value,
    numbers: numbers.value,
    revealed: revealed.value,
    flagged: flagged.value,
    minesPlaced: minesPlaced.value,
    tool: tool.value,
    moves: moves.value,
    elapsedMs: timer.elapsedMs(),
    savedAt: Date.now(),
    dailyDate,
  })
}

function updateSavedGame() {
  if (saveEnabled && status.value === 'playing') {
    return saveGame()
  } else if (status.value === 'lost' || status.value === 'won') {
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
    mineTotal.value = minesFor(data.size, data.difficulty)
    mines.value = data.mines
    numbers.value = data.numbers
    revealed.value = data.revealed
    flagged.value = data.flagged
    minesPlaced.value = data.minesPlaced
    exploded.value = null
    tool.value = data.tool
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
  [
    status,
    size,
    difficulty,
    mines,
    numbers,
    revealed,
    flagged,
    minesPlaced,
    tool,
    moves,
  ],
  updateSavedGame,
  { deep: true },
)

watch(status, (nextStatus) => {
  if (nextStatus === 'lost') {
    nextTick(() => lossAlert.value?.focus({ preventScroll: true }))
  }
})

restoreGame()
const unregisterActiveGameSave = registerActiveGameSave(updateSavedGame)
onBeforeUnmount(() => {
  updateSavedGame()
  unregisterActiveGameSave()
})

const flagsLeft = computed(() => mineTotal.value - countFlags(flagged.value))
const lostWrongFlags = computed(() =>
  status.value === 'lost' ? wrongFlags(flagged.value, mines.value) : new Set(),
)

function startGame({ size: newSize, difficulty: newDifficulty }) {
  const selectedSize = dailyDate ? 10 : newSize
  const selectedDifficulty = dailyDate ? 'media' : newDifficulty
  size.value = selectedSize
  difficulty.value = selectedDifficulty
  mineTotal.value = minesFor(selectedSize, selectedDifficulty)
  mines.value = emptyGrid(selectedSize, false)
  numbers.value = emptyGrid(selectedSize, 0)
  revealed.value = emptyGrid(selectedSize, false)
  flagged.value = emptyGrid(selectedSize, false)
  minesPlaced.value = false
  exploded.value = null
  tool.value = TOOL_PALA
  moves.value = 0
  winSeconds.value = 0
  timer.start()
  isNewRecord.value = false
  saveEnabled = true
  status.value = 'playing'
  nextTick(() => window.scrollTo(0, 0))
}

function restart() {
  // Reiniciar = nueva organización con la misma configuración.
  startGame({ size: size.value, difficulty: difficulty.value })
  clearSavedGame()
}

function backToSetup() {
  saveEnabled = false
  timer.stop()
  clearSavedGame()
  status.value = 'setup'
}

function ensureMines(r, c) {
  if (minesPlaced.value) return
  const random = dailyDate
    ? createSeededRandom(dailyChallengeSeed('buscaminas', dailyDate))
    : Math.random
  const safeCell = dailyDate
    ? { r: Math.floor(size.value / 2), c: Math.floor(size.value / 2) }
    : { r, c }
  mines.value = placeMines(size.value, mineTotal.value, safeCell.r, safeCell.c, random)
  numbers.value = computeNumbers(mines.value)
  minesPlaced.value = true
}

function dig(r, c) {
  if (flagged.value[r][c]) return
  if (revealed.value[r][c]) {
    chord(r, c)
    return
  }
  saveEnabled = true
  ensureMines(r, c)
  moves.value++
  if (mines.value[r][c]) {
    exploded.value = { r, c }
    status.value = 'lost'
    timer.stop()
    return
  }
  const { grid } = revealFrom(revealed.value, numbers.value, size.value, r, c)
  revealed.value = grid
  checkWinAndFinish()
}

function chord(r, c) {
  // Pulsar un número con sus banderas puestas abre los vecinos de golpe.
  const res = chordFrom(
    revealed.value,
    flagged.value,
    numbers.value,
    mines.value,
    size.value,
    r,
    c,
  )
  if (res.hitMine) {
    exploded.value = res.mineAt
    status.value = 'lost'
    moves.value++
    timer.stop()
    return
  }
  if (res.opened === 0) return
  saveEnabled = true
  revealed.value = res.grid
  moves.value++
  checkWinAndFinish()
}

function checkWinAndFinish() {
  if (checkWin(revealed.value, mines.value)) {
    winSeconds.value = Math.floor(timer.elapsedMs() / 1000)
    timer.stop()
    isNewRecord.value = recordBestTime('buscaminas', timeCategory.value, winSeconds.value, moves.value)
    bestTime.value = bestTimeFor('buscaminas', timeCategory.value)
    status.value = 'won'
  }
}

function requestRestart() {
  if (confirmReplaceGame(moves.value, 'reiniciar')) restart()
}

function toggleFlag(r, c) {
  if (revealed.value[r][c]) return false
  if (!flagged.value[r][c] && flagsLeft.value <= 0) return false
  saveEnabled = true
  flagged.value[r][c] = !flagged.value[r][c]
  moves.value++
  return true
}

function onCellClick({ r, c }) {
  if (status.value !== 'playing') return
  if (tool.value === TOOL_BANDERA) {
    const changed = toggleFlag(r, c)
    moveAnnouncement.value = changed
      ? `Fila ${r + 1}, columna ${c + 1}: ${flagged.value[r][c] ? 'bandera marcada' : 'bandera retirada'}.`
      : revealed.value[r][c]
        ? `Fila ${r + 1}, columna ${c + 1}: la casilla ya está abierta.`
        : 'No quedan banderas. Retira una para colocar otra.'
    return
  }
  dig(r, c)
  moveAnnouncement.value = status.value === 'lost'
    ? `Fila ${r + 1}, columna ${c + 1}: mina detonada.`
    : `Fila ${r + 1}, columna ${c + 1}: ${revealed.value[r][c] ? numbers.value[r][c] === 0 ? 'casilla vacía' : `número ${numbers.value[r][c]}` : 'casilla sin cambios'}.`
}

function onCellFlag({ r, c }) {
  // Atajo de escritorio: click derecho alterna bandera.
  if (status.value !== 'playing') return
  const changed = toggleFlag(r, c)
  moveAnnouncement.value = changed
    ? `Fila ${r + 1}, columna ${c + 1}: ${flagged.value[r][c] ? 'bandera marcada' : 'bandera retirada'}.`
    : revealed.value[r][c]
      ? `Fila ${r + 1}, columna ${c + 1}: la casilla ya está abierta.`
      : 'No quedan banderas. Retira una para colocar otra.'
}
</script>

<template>
  <main class="game-page" :class="{ 'game-page--active': status === 'playing' }">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <DailyChallengeBanner v-if="dailyDate" :date="dailyDate" game-title="Buscaminas" />
    <GameSaveWarning />

    <Transition name="phase" mode="out-in">
      <GamePhase v-if="status === 'setup'" variant="setup">
        <div class="game-header buscaminas">
          <span class="monogram" aria-hidden="true">B</span>
          <div>
            <h1>Buscaminas</h1>
            <p>Despeja el tablero sin explotar.</p>
          </div>
        </div>
        <BuscaminasSetupMenu
          v-model:size="size"
          v-model:difficulty="difficulty"
          :locked="Boolean(dailyDate)"
          @play="startGame"
        />
      </GamePhase>

      <!-- Al perder no cambia de rama: el tablero se queda y lo que
           avisa es el aviso y la revelación de las minas. -->
      <GamePhase v-else-if="status === 'playing' || status === 'lost'">
        <p class="mb-4 text-center text-sm text-mist-400">
          {{ size }}×{{ size }} · {{ difficultyLabel(difficulty) }} · 💣 {{ mineTotal }} ·
          {{ dailyDate ? 'reto compartido: empieza por el centro · ' : '' }}con sus 🚩 puestas, pulsa un número para abrir alrededor
        </p>
        <BuscaminasToolbar
          :tool="tool"
          :flags-left="flagsLeft"
          :moves="moves"
          :seconds="timer.seconds.value"
          :daily="Boolean(dailyDate)"
          @restart="requestRestart"
          @set-tool="tool = $event"
        />
        <div
          v-if="status === 'lost'"
          class="board-alert mx-auto mb-4 w-full max-w-[560px] rounded-md border border-red-500 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-danger-fg"
          role="alert"
          ref="lossAlert"
          tabindex="-1"
        >
          💥 ¡Boom! Pisaste una mina. Pulsa Reiniciar para intentarlo de nuevo.
        </div>
        <BuscaminasBoard
          :size="size"
          :numbers="numbers"
          :mines="mines"
          :revealed="revealed"
          :flagged="flagged"
          :mines-placed="minesPlaced"
          :status="status"
          :exploded="exploded"
          :wrong-flags="lostWrongFlags"
          @cell-click="onCellClick"
          @cell-flag="onCellFlag"
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
        <BuscaminasWinHero
          :size="size"
          :difficulty-label="difficultyLabel(difficulty)"
          :moves="moves"
          :seconds="winSeconds"
          :best-time="bestTime?.seconds ?? null"
          :is-new-record="isNewRecord"
          @play-again="restart"
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
.game-header.buscaminas {
  background-color: var(--game-buscaminas);
  border-color: var(--game-buscaminas-border);
}
</style>
