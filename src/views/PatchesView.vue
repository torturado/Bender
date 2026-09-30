<script setup>
import { onBeforeUnmount, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DailyChallengeBanner from '../components/DailyChallengeBanner.vue'
import GameSaveWarning from '../components/GameSaveWarning.vue'
import PatchesBoard from '../components/patches/PatchesBoard.vue'
import PatchesToolbar from '../components/patches/PatchesToolbar.vue'
import PatchesWinHero from '../components/patches/PatchesWinHero.vue'
import GamePhase from '../components/GamePhase.vue'
import { DIFFICULTIES, SHAPES, SIZE } from '../games/patches/constants.js'
import { generatePuzzle } from '../games/patches/generator.js'
import { checkWin, coversBoard } from '../games/patches/validators.js'
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
const saveKey = gameSaveKey('patches', dailyDate)
const timer = useGameTimer()
const defaultSettings = { difficulty: 'media' }
const initialSettings = readGameSettings(
  'patches',
  defaultSettings,
  (value) => DIFFICULTIES.some((option) => option.id === value?.difficulty),
)
if (dailyDate) initialSettings.difficulty = 'media'

const status = ref('setup') // setup | playing | won
const setupDifficulty = ref(initialSettings.difficulty)
const difficulty = ref(initialSettings.difficulty)
const clues = ref([])
const patches = ref([]) // [{ id, r1, c1, r2, c2 }]
const history = ref([]) // [{ type: 'add' | 'delete', patch }]
const moves = ref(0)
const winSeconds = ref(0)
const isNewRecord = ref(false)
const notice = ref(null)
let noticeTimer = null
let nextId = 1
let saveEnabled = false

const bestTime = ref(bestTimeFor('patches', difficulty.value))

watch(setupDifficulty, (nextDifficulty) => {
  bestTime.value = bestTimeFor('patches', nextDifficulty)
  if (!dailyDate) writeGameSettings('patches', { difficulty: nextDifficulty })
})

function isValidRect(rect) {
  return (
    rect &&
    Number.isInteger(rect.r1) &&
    Number.isInteger(rect.c1) &&
    Number.isInteger(rect.r2) &&
    Number.isInteger(rect.c2) &&
    rect.r1 >= 0 &&
    rect.c1 >= 0 &&
    rect.r2 < SIZE &&
    rect.c2 < SIZE &&
    rect.r1 <= rect.r2 &&
    rect.c1 <= rect.c2
  )
}

function isValidPatch(patch) {
  return patch && Number.isInteger(patch.id) && patch.id > 0 && isValidRect(patch)
}

function isValidClue(clue) {
  return (
    clue &&
    Number.isInteger(clue.r) &&
    Number.isInteger(clue.c) &&
    clue.r >= 0 &&
    clue.r < SIZE &&
    clue.c >= 0 &&
    clue.c < SIZE &&
    (clue.number === null ||
      (Number.isInteger(clue.number) && clue.number > 0 && clue.number <= SIZE * SIZE)) &&
    SHAPES.includes(clue.shape)
  )
}

function isValidHistoryEntry(entry) {
  if (!entry || !['add', 'delete'].includes(entry.type)) return false
  return isValidPatch(entry.patch)
}

function isValidSave(data) {
  return (
    data?.version === 1 &&
    DIFFICULTIES.some((option) => option.id === data.difficulty) &&
    Array.isArray(data.clues) &&
    data.clues.length > 0 &&
    data.clues.every(isValidClue) &&
    Array.isArray(data.patches) &&
    data.patches.every(isValidPatch) &&
    Array.isArray(data.history) &&
    data.history.every(isValidHistoryEntry) &&
    Number.isInteger(data.nextId) &&
    data.nextId > 0 &&
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
  if (!saveEnabled || status.value !== 'playing' || clues.value.length === 0) return true
  return writeGameSave(saveKey, {
    version: 1,
    difficulty: difficulty.value,
    clues: clues.value,
    patches: patches.value,
    history: history.value,
    nextId,
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
    difficulty.value = data.difficulty
    setupDifficulty.value = data.difficulty
    bestTime.value = bestTimeFor('patches', data.difficulty)
    clues.value = data.clues
    patches.value = data.patches
    history.value = data.history
    nextId = data.nextId
    moves.value = data.moves
    timer.start(data.elapsedMs)
    winSeconds.value = 0
    notice.value = null
    saveEnabled = true
    status.value = 'playing'
  } catch {
    clearSavedGame()
  }
}

watch(
  [status, difficulty, clues, patches, history, moves],
  updateSavedGame,
  { deep: true },
)

restoreGame()
const unregisterActiveGameSave = registerActiveGameSave(updateSavedGame)
onBeforeUnmount(() => {
  updateSavedGame()
  unregisterActiveGameSave()
})

function flashNotice(msg) {
  notice.value = msg
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 2600)
}

function startGame() {
  newGame(setupDifficulty.value)
}

function newGame(difficultyId = setupDifficulty.value) {
  const selectedDifficulty = dailyDate ? 'media' : difficultyId
  const random = dailyDate
    ? createSeededRandom(dailyChallengeSeed('patches', dailyDate))
    : Math.random
  const puzzle = generatePuzzle(selectedDifficulty, random)
  difficulty.value = puzzle.difficulty
  setupDifficulty.value = puzzle.difficulty
  clues.value = puzzle.clues
  patches.value = []
  history.value = []
  nextId = 1
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  timer.start()
  isNewRecord.value = false
  saveEnabled = true
  status.value = 'playing'
}

function restart() {
  // Reiniciar: vacía el tablero, mismo puzzle y dificultad.
  clearSavedGame()
  patches.value = []
  history.value = []
  nextId = 1
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  timer.start()
  status.value = 'playing'
}

function requestRestart() {
  if (confirmReplaceGame(moves.value, 'reiniciar')) restart()
}

function requestNewGame(difficultyId) {
  if (confirmReplaceGame(moves.value, 'empezar otra partida')) newGame(difficultyId)
}

function onDraw(rect) {
  if (status.value !== 'playing') return
  saveEnabled = true
  const patch = { id: nextId++, ...rect }
  patches.value = [...patches.value, patch]
  history.value.push({ type: 'add', patch })
  if (history.value.length > 100) history.value.shift()
  moves.value++
  if (checkWin(patches.value, clues.value, SIZE)) {
    winSeconds.value = Math.floor(timer.elapsedMs() / 1000)
    timer.stop()
    isNewRecord.value = recordBestTime('patches', difficulty.value, winSeconds.value, moves.value)
    bestTime.value = bestTimeFor('patches', difficulty.value)
    status.value = 'won'
  } else if (coversBoard(patches.value, SIZE)) {
    flashNotice('El tablero está cubierto, pero alguna pista todavía no se cumple. Revisa o elimina parches.')
  }
}

function onDeletePatch(id) {
  if (status.value !== 'playing') return
  const patch = patches.value.find((p) => p.id === id)
  if (!patch) return
  saveEnabled = true
  patches.value = patches.value.filter((p) => p.id !== id)
  history.value.push({ type: 'delete', patch })
  if (history.value.length > 100) history.value.shift()
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
  moves.value = Math.max(0, moves.value - 1)
}

onUnmounted(() => {
  if (noticeTimer) clearTimeout(noticeTimer)
})
</script>

<template>
  <main
    class="game-page"
    :class="{ 'game-page--active': status === 'playing' }"
  >
    <RouterLink to="/" class="back">← Volver al menú</RouterLink>
    <DailyChallengeBanner v-if="dailyDate" :date="dailyDate" game-title="Patches" />
    <GameSaveWarning />

    <Transition name="phase" mode="out-in">
      <GamePhase v-if="status === 'setup'" variant="setup">
        <div class="game-header patches">
          <span class="monogram" aria-hidden="true">P</span>
          <div>
            <h1>Patches</h1>
            <p>Divide el tablero en parches.</p>
          </div>
        </div>
        <section
          class="mx-auto w-full max-w-xl rounded-lg border border-ink-500 bg-ink-900 p-6 sm:p-8"
        >
          <h2 class="m-0 text-xl font-extrabold tracking-tight text-mist-100">Configura tu partida</h2>
          <p class="mt-1 mb-6 text-sm text-mist-400">
            Tablero de {{ SIZE }}×{{ SIZE }}. {{ dailyDate ? 'El reto diario usa la misma dificultad para todas las personas.' : 'Elige la dificultad antes de empezar.' }}
          </p>

          <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">Dificultad</p>
          <div class="mb-8 grid grid-cols-3 gap-2" role="group" aria-label="Dificultad">
            <button
              v-for="option in DIFFICULTIES"
              :key="option.id"
              type="button"
              :aria-pressed="setupDifficulty === option.id"
              :disabled="Boolean(dailyDate)"
              :class="[
                'min-h-[44px] rounded-md border px-3 py-2.5 text-sm font-bold transition',
                setupDifficulty === option.id
                  ? 'border-orange-400 bg-orange-500 text-on-accent'
                  : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-mist-100',
              ]"
              @click="setupDifficulty = option.id"
            >
              {{ option.label }}
            </button>
          </div>

          <button
            type="button"
            class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
            @click="startGame"
          >
            Jugar
          </button>
          <p class="mt-3 mb-0 text-center text-xs text-mist-400">
            Cada partida genera un tablero y unas pistas diferentes.
          </p>
        </section>
      </GamePhase>

      <GamePhase v-else-if="status === 'playing'">
        <PatchesToolbar
          :difficulty="difficulty"
          :can-undo="history.length > 0"
          :moves="moves"
          :seconds="timer.seconds.value"
          :daily="Boolean(dailyDate)"
          @undo="undo"
          @restart="requestRestart"
          @new-game="requestNewGame"
        />
        <PatchesBoard
          :clues="clues"
          :patches="patches"
          @draw="onDraw"
          @delete-patch="onDeletePatch"
        />
        <div
          v-if="notice"
          class="board-alert mx-auto mt-4 w-full max-w-[440px] rounded-md border border-red-500 bg-red-500/10 px-4 py-2.5 text-center text-sm font-bold text-danger-fg"
          role="alert"
        >
          {{ notice }}
        </div>
      </GamePhase>

      <GamePhase v-else variant="won">
        <PatchesWinHero
          :difficulty="difficulty"
          :moves="moves"
          :seconds="winSeconds"
          :best-time="bestTime?.seconds ?? null"
          :is-new-record="isNewRecord"
          @play-again="newGame"
        />
      </GamePhase>
    </Transition>
  </main>
</template>

<style scoped>
@import './game-page.css';
.game-header.patches {
  background-color: var(--game-patches);
  border-color: var(--game-patches-border);
}
</style>
