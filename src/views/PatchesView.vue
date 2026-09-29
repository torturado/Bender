<script setup>
import { onBeforeUnmount, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import PatchesBoard from '../components/patches/PatchesBoard.vue'
import PatchesToolbar from '../components/patches/PatchesToolbar.vue'
import PatchesWinHero from '../components/patches/PatchesWinHero.vue'
import GamePhase from '../components/GamePhase.vue'
import { DIFFICULTIES, SHAPES, SIZE } from '../games/patches/constants.js'
import { generatePuzzle } from '../games/patches/generator.js'
import { checkWin, coversBoard } from '../games/patches/validators.js'

const SAVE_KEY = 'bender.patches.save.v1'

const status = ref('setup') // setup | playing | won
const setupDifficulty = ref('media')
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
let saveEnabled = false

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
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {}
}

function saveGame() {
  if (!saveEnabled || status.value !== 'playing' || clues.value.length === 0) return
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        difficulty: difficulty.value,
        clues: clues.value,
        patches: patches.value,
        history: history.value,
        nextId,
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
    difficulty.value = data.difficulty
    clues.value = data.clues
    patches.value = data.patches
    history.value = data.history
    nextId = data.nextId
    moves.value = data.moves
    startTime.value = Date.now() - data.elapsedMs
    winSeconds.value = 0
    notice.value = null
    saveEnabled = true
    status.value = 'playing'
  } catch {
    clearSavedGame()
  }
}

watch(
  [status, difficulty, clues, patches, history, moves, startTime],
  updateSavedGame,
  { deep: true },
)

restoreGame()
onBeforeUnmount(updateSavedGame)

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

function newGame(difficultyId) {
  const puzzle = generatePuzzle(difficultyId)
  difficulty.value = puzzle.difficulty
  clues.value = puzzle.clues
  patches.value = []
  history.value = []
  nextId = 1
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  startTime.value = Date.now()
  saveEnabled = true
  status.value = 'playing'
}

function restart() {
  // Reiniciar: vacía el tablero, mismo puzzle y dificultad.
  saveEnabled = false
  clearSavedGame()
  patches.value = []
  history.value = []
  nextId = 1
  moves.value = 0
  winSeconds.value = 0
  notice.value = null
  startTime.value = Date.now()
  status.value = 'playing'
}

function onDraw(rect) {
  if (status.value !== 'playing') return
  saveEnabled = true
  const patch = { id: nextId++, ...rect }
  patches.value = [...patches.value, patch]
  history.value.push({ type: 'add', patch })
  moves.value++
  if (checkWin(patches.value, clues.value, SIZE)) {
    winSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
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
          <h2 class="m-0 text-xl font-extrabold tracking-tight text-white">Configura tu partida</h2>
          <p class="mt-1 mb-6 text-sm text-mist-400">
            Tablero de {{ SIZE }}×{{ SIZE }}. Elige la dificultad antes de empezar.
          </p>

          <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">Dificultad</p>
          <div class="mb-8 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Dificultad">
            <button
              v-for="option in DIFFICULTIES"
              :key="option.id"
              type="button"
              :aria-pressed="setupDifficulty === option.id"
              :class="[
                'min-h-[44px] rounded-md border px-3 py-2.5 text-sm font-bold transition',
                setupDifficulty === option.id
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-white',
              ]"
              @click="setupDifficulty = option.id"
            >
              {{ option.label }}
            </button>
          </div>

          <button
            type="button"
            class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-white transition hover:bg-orange-600"
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
          @undo="undo"
          @restart="restart"
          @new-game="newGame"
        />
        <PatchesBoard
          :clues="clues"
          :patches="patches"
          @draw="onDraw"
          @delete-patch="onDeletePatch"
        />
        <div
          v-if="notice"
          class="board-alert mx-auto mt-4 w-full max-w-[440px] rounded-md border border-red-500 bg-red-500/10 px-4 py-2.5 text-center text-sm font-bold text-red-400"
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
