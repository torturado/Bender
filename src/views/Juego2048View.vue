<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DailyChallengeBanner from '../components/DailyChallengeBanner.vue'
import GameSaveWarning from '../components/GameSaveWarning.vue'
import Game2048Board from '../components/juego2048/Game2048Board.vue'
import Game2048Toolbar from '../components/juego2048/Game2048Toolbar.vue'
import Game2048Hero from '../components/juego2048/Game2048Hero.vue'
import GamePhase from '../components/GamePhase.vue'
import { SIZE, TARGET } from '../games/juego2048/constants.js'
import {
  cloneBoard,
  spawnTile,
  newGame,
  move,
  canMove,
  hasTarget,
} from '../games/juego2048/engine.js'
import { tilesAfterMove, tilesFromBoard } from '../games/juego2048/tiles.js'
import {
  createSeededRandom,
  dailyChallengeSeed,
  normalizeDailyDate,
} from '../games/random.js'
import { confirmReplaceGame } from '../games/confirmReplace.js'
import { useGameTimer } from '../composables/useGameTimer.js'
import { bestScoreFor, recordBestScore } from '../data/gameRecords.js'
import {
  gameSaveKey,
  readGameSave,
  registerActiveGameSave,
  removeGameSave,
  writeGameSave,
} from '../data/gameStorage.js'

const END_STATUS_DELAY = 700
const UNDO_HISTORY_LIMIT = 20

const route = useRoute()
const dailyDate = normalizeDailyDate(route.query.daily)
const saveKey = gameSaveKey('2048', dailyDate)
const timer = useGameTimer()

const status = ref('setup') // setup | playing | won | endless | lost
const shownStatus = ref('setup')
const board = ref([])
const tiles = ref([])
const score = ref(0)
const moves = ref(0)
const history = ref([]) // [{ board, score, randomState? }]
const bestScore = ref(bestScoreFor('2048'))
const isNewRecord = ref(false)
let saveEnabled = false
let statusTimer = null
let seededRandom = null

function clearStatusTimer() {
  if (statusTimer !== null) {
    clearTimeout(statusTimer)
    statusTimer = null
  }
}

function isActiveStatus(value) {
  return value === 'playing' || value === 'endless'
}

function setStatus(nextStatus, delayTerminal = false) {
  const previousStatus = status.value
  clearStatusTimer()
  status.value = nextStatus

  if (
    delayTerminal &&
    isActiveStatus(previousStatus) &&
    (nextStatus === 'won' || nextStatus === 'lost')
  ) {
    statusTimer = setTimeout(() => {
      shownStatus.value = nextStatus
      statusTimer = null
    }, END_STATUS_DELAY)
  } else {
    shownStatus.value = nextStatus
  }
}

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
        entry.score >= 0 &&
        (entry.randomState === undefined || Number.isInteger(entry.randomState)),
    ) &&
    (data.elapsedMs === undefined || (Number.isFinite(data.elapsedMs) && data.elapsedMs >= 0)) &&
    (data.dailyDate === undefined || normalizeDailyDate(data.dailyDate) === data.dailyDate) &&
    (data.randomState === undefined || Number.isInteger(data.randomState))
  )
}

function clearSavedGame() {
  return removeGameSave(saveKey)
}

function saveGame() {
  if (
    !saveEnabled ||
    (status.value !== 'playing' && status.value !== 'endless')
  ) {
    return true
  }
  return writeGameSave(saveKey, {
    version: 1,
    status: status.value,
    board: board.value,
    score: score.value,
    moves: moves.value,
    history: history.value,
    elapsedMs: timer.elapsedMs(),
    dailyDate,
    randomState: seededRandom?.getState(),
    savedAt: Date.now(),
  })
}

function updateSavedGame() {
  if (saveEnabled && (status.value === 'playing' || status.value === 'endless')) {
    return saveGame()
  } else {
    return clearSavedGame()
  }
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
    status.value = data.status
    board.value = data.board
    tiles.value = tilesFromBoard(board.value)
    score.value = data.score
    moves.value = data.moves
    history.value = data.history
    seededRandom = data.dailyDate
      ? createSeededRandom(
          dailyChallengeSeed('2048', data.dailyDate),
          Number.isInteger(data.randomState) ? data.randomState : null,
        )
      : null
    timer.start(data.elapsedMs ?? 0)
    shownStatus.value = status.value
    saveEnabled = true
  } catch {
    clearSavedGame()
  }
}

watch([status, board, score, moves, history], updateSavedGame, { deep: true })

restoreGame()
const unregisterActiveGameSave = registerActiveGameSave(updateSavedGame)

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
  history.value.push({
    board: cloneBoard(board.value),
    score: score.value,
    randomState: seededRandom?.getState(),
  })
  if (history.value.length > UNDO_HISTORY_LIMIT) history.value.shift()
  board.value = res.board
  score.value += res.gained
  moves.value++
  const spawned = spawnTile(board.value, undefined, seededRandom ?? Math.random)
  tiles.value = tilesAfterMove(tiles.value, res.moves, board.value, spawned)
  if (status.value === 'playing' && hasTarget(board.value, TARGET)) {
    timer.stop()
    isNewRecord.value = recordBestScore('2048', score.value)
    bestScore.value = bestScoreFor('2048')
    setStatus('won', true)
  } else if (!canMove(board.value)) {
    timer.stop()
    isNewRecord.value = recordBestScore('2048', score.value)
    bestScore.value = bestScoreFor('2048')
    setStatus('lost', true)
  }
}

function resetGame() {
  clearStatusTimer()
  saveEnabled = true
  seededRandom = dailyDate
    ? createSeededRandom(dailyChallengeSeed('2048', dailyDate))
    : null
  board.value = newGame(seededRandom ?? Math.random)
  tiles.value = tilesFromBoard(board.value, 'new')
  score.value = 0
  moves.value = 0
  history.value = []
  isNewRecord.value = false
  timer.start()
  setStatus('playing')
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

function requestRestart() {
  if (confirmReplaceGame(moves.value, dailyDate ? 'reiniciar el reto' : 'reiniciar')) restart()
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  // Si se deshace desde un hero, se vuelve al juego
  // (a infinito si el tablero ya tenía el 2048).
  if (status.value === 'lost' || status.value === 'won') {
    status.value = hasTarget(last.board, TARGET) ? 'endless' : 'playing'
    timer.start(timer.elapsedMs())
    isNewRecord.value = false
  }
  board.value = last.board
  tiles.value = tilesFromBoard(board.value)
  score.value = last.score
  if (seededRandom && Number.isInteger(last.randomState)) {
    seededRandom = createSeededRandom(
      dailyChallengeSeed('2048', dailyDate),
      last.randomState,
    )
  }
  moves.value = Math.max(0, moves.value - 1)
  clearStatusTimer()
  shownStatus.value = status.value
}

function continueEndless() {
  timer.start(timer.elapsedMs())
  setStatus('endless')
}

function onKeydown(e) {
  if (status.value !== 'playing' && status.value !== 'endless') return
  const dir = KEY_DIRS[e.key]
  if (!dir) return
  const target = e.target
  if (
    target instanceof HTMLElement &&
    !target.closest('[data-2048-board]') &&
    (target.isContentEditable || target.matches('button, a, input, select, textarea'))
  ) return
  if (e.key.startsWith('Arrow')) e.preventDefault()
  applyMove(dir)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearStatusTimer()
  updateSavedGame()
  unregisterActiveGameSave()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main
    class="game-page"
    :class="{
      'game-page--active': shownStatus === 'playing' || shownStatus === 'endless',
    }"
  >
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <DailyChallengeBanner v-if="dailyDate" :date="dailyDate" game-title="2048" />
    <GameSaveWarning />

    <Transition name="phase" mode="out-in">
      <GamePhase v-if="shownStatus === 'setup'" variant="setup">
        <div class="game-header juego2048">
          <span class="monogram" aria-hidden="true">2048</span>
          <div>
            <h1>2048</h1>
            <p>Desliza y combina hasta 2048.</p>
          </div>
        </div>
        <section
          class="mx-auto w-full max-w-xl rounded-lg border border-ink-500 bg-ink-900 p-6 sm:p-8"
        >
          <h2 class="m-0 text-xl font-extrabold tracking-tight text-mist-100">Configura tu partida</h2>
          <p class="mt-1 mb-6 text-sm text-mist-400">
            Une fichas iguales hasta llegar al {{ TARGET }} en un tablero de {{ SIZE }}×{{ SIZE }}.
          </p>

          <div class="mb-8 grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-ink-600 bg-ink-800 p-4 text-center">
              <p class="m-0 text-xs font-bold tracking-wider text-mist-400 uppercase">Tablero</p>
              <p class="mt-1 mb-0 text-lg font-extrabold text-mist-100">{{ SIZE }}×{{ SIZE }}</p>
            </div>
            <div class="rounded-lg border border-ink-600 bg-ink-800 p-4 text-center">
              <p class="m-0 text-xs font-bold tracking-wider text-mist-400 uppercase">Objetivo</p>
              <p class="mt-1 mb-0 text-lg font-extrabold text-mist-100">{{ TARGET }}</p>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
            @click="startGame"
          >
            Jugar
          </button>
          <p class="mt-3 mb-0 text-center text-xs text-mist-400">
            En móvil, desliza sobre el tablero. En ordenador, usa las flechas o WASD.
          </p>
        </section>
      </GamePhase>

      <GamePhase v-else-if="shownStatus === 'playing' || shownStatus === 'endless'">
        <p class="mb-4 text-center text-sm text-mist-400">
          Desliza y combina hasta {{ TARGET }}.
          <span v-if="shownStatus === 'endless'" class="font-bold text-amber-300 light:text-amber-700">∞ Modo infinito</span>
          <span v-else class="sm:hidden"> · desliza para mover</span>
          <span v-if="shownStatus !== 'endless'" class="hidden sm:inline"> · flechas o WASD para mover</span>
        </p>
        <Game2048Toolbar
          :can-undo="history.length > 0"
          :score="score"
          :moves="moves"
          :seconds="timer.seconds.value"
          :best-score="bestScore"
          :daily="Boolean(dailyDate)"
          @restart="requestRestart"
          @undo="undo"
        />
        <Game2048Board :board="board" :tiles="tiles" @move="applyMove" />
      </GamePhase>

      <GamePhase v-else-if="shownStatus === 'won'" variant="won">
        <Game2048Hero
          kind="win"
          :score="score"
          :moves="moves"
          :seconds="timer.seconds.value"
          :best-score="bestScore"
          :is-new-record="isNewRecord"
          @restart="restart"
          @continue="continueEndless"
        />
      </GamePhase>

      <GamePhase v-else variant="won">
        <Game2048Hero
          kind="lost"
          :score="score"
          :moves="moves"
          :seconds="timer.seconds.value"
          :best-score="bestScore"
          :is-new-record="isNewRecord"
          @restart="restart"
        />
      </GamePhase>
    </Transition>
  </main>
</template>

<style scoped>
@import './game-page.css';
.game-header.juego2048 {
  background-color: var(--game-2048);
  border-color: var(--game-2048-border);
}
</style>
