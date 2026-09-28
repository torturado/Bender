<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BuscaminasSetupMenu from '../components/buscaminas/BuscaminasSetupMenu.vue'
import BuscaminasBoard from '../components/buscaminas/BuscaminasBoard.vue'
import BuscaminasToolbar from '../components/buscaminas/BuscaminasToolbar.vue'
import BuscaminasWinHero from '../components/buscaminas/BuscaminasWinHero.vue'
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

const SAVE_KEY = 'bender.buscaminas.save.v1'

const status = ref('setup') // setup | playing | lost | won
const size = ref(8)
const difficulty = ref('media')
const mineTotal = ref(0)
const mines = ref([])
const numbers = ref([])
const revealed = ref([])
const flagged = ref([])
const minesPlaced = ref(false)
const exploded = ref(null)
const tool = ref(TOOL_PALA)
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
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {}
}

function saveGame() {
  if (!saveEnabled || status.value !== 'playing' || mines.value.length !== size.value) return
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
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
        elapsedMs: Math.max(0, Date.now() - startTime.value),
        savedAt: Date.now(),
      }),
    )
  } catch {}
}

function updateSavedGame() {
  if (saveEnabled && status.value === 'playing') {
    saveGame()
  } else if (status.value === 'lost' || status.value === 'won') {
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
    mineTotal.value = minesFor(data.size, data.difficulty)
    mines.value = data.mines
    numbers.value = data.numbers
    revealed.value = data.revealed
    flagged.value = data.flagged
    minesPlaced.value = data.minesPlaced
    exploded.value = null
    tool.value = data.tool
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
    startTime,
  ],
  updateSavedGame,
  { deep: true },
)

restoreGame()
onBeforeUnmount(updateSavedGame)

const flagsLeft = computed(() => mineTotal.value - countFlags(flagged.value))
const lostWrongFlags = computed(() =>
  status.value === 'lost' ? wrongFlags(flagged.value, mines.value) : new Set(),
)

function startGame({ size: newSize, difficulty: newDifficulty }) {
  size.value = newSize
  difficulty.value = newDifficulty
  mineTotal.value = minesFor(newSize, newDifficulty)
  mines.value = emptyGrid(newSize, false)
  numbers.value = emptyGrid(newSize, 0)
  revealed.value = emptyGrid(newSize, false)
  flagged.value = emptyGrid(newSize, false)
  minesPlaced.value = false
  exploded.value = null
  tool.value = TOOL_PALA
  moves.value = 0
  winSeconds.value = 0
  startTime.value = Date.now()
  saveEnabled = true
  status.value = 'playing'
  nextTick(() => window.scrollTo(0, 0))
}

function restart() {
  // Reiniciar = nueva organización con la misma configuración.
  startGame({ size: size.value, difficulty: difficulty.value })
  saveEnabled = false
  clearSavedGame()
}

function backToSetup() {
  saveEnabled = false
  clearSavedGame()
  status.value = 'setup'
}

function ensureMines(r, c) {
  if (minesPlaced.value) return
  mines.value = placeMines(size.value, mineTotal.value, r, c)
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
    winSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    status.value = 'won'
  }
}

function toggleFlag(r, c) {
  if (revealed.value[r][c]) return
  if (!flagged.value[r][c] && flagsLeft.value <= 0) return
  saveEnabled = true
  flagged.value[r][c] = !flagged.value[r][c]
  moves.value++
}

function onCellClick({ r, c }) {
  if (status.value !== 'playing') return
  if (tool.value === TOOL_BANDERA) toggleFlag(r, c)
  else dig(r, c)
}

function onCellFlag({ r, c }) {
  // Atajo de escritorio: click derecho alterna bandera.
  if (status.value !== 'playing') return
  toggleFlag(r, c)
}
</script>

<template>
  <main class="game-page" :class="{ 'game-page--active': status === 'playing' }">
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <div v-if="status === 'setup'" class="game-header buscaminas">
      <span class="monogram" aria-hidden="true">B</span>
      <div>
        <h1>Buscaminas</h1>
        <p>Despeja el tablero sin explotar.</p>
      </div>
    </div>

    <!-- Fase 1: menú de configuración -->
    <BuscaminasSetupMenu v-if="status === 'setup'" @play="startGame" />

    <!-- Fase 2: juego (y tablero revelado al perder) -->
    <template v-else-if="status === 'playing' || status === 'lost'">
      <p class="mb-4 text-center text-sm text-mist-400">
        {{ size }}×{{ size }} · {{ difficultyLabel(difficulty) }} · 💣 {{ mineTotal }} ·
        con sus 🚩 puestas, pulsa un número para abrir alrededor
      </p>
      <BuscaminasToolbar
        :tool="tool"
        :flags-left="flagsLeft"
        :moves="moves"
        @restart="restart"
        @set-tool="tool = $event"
      />
      <div
        v-if="status === 'lost'"
        class="mx-auto mb-4 w-full max-w-[560px] rounded-md border border-red-500 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-400"
        role="alert"
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
      <BuscaminasWinHero
        :size="size"
        :difficulty-label="difficultyLabel(difficulty)"
        :moves="moves"
        :seconds="winSeconds"
        @play-again="restart"
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
.game-header.buscaminas {
  background-color: #9a3412;
  border-color: #fdba74;
}
</style>
