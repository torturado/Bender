import { ref } from 'vue'
import { normalizeDailyDate } from '../games/random.js'

const STANDARD_SAVE_KEYS = {
  tango: 'bender.tango.save.v1',
  buscaminas: 'bender.buscaminas.save.v1',
  patches: 'bender.patches.save.v1',
  '2048': 'bender.2048.save.v1',
}

const ROUTE_GAME_IDS = {
  tango: 'tango',
  buscaminas: 'buscaminas',
  patches: 'patches',
  'juego-2048': '2048',
}

export const saveFailed = ref(false)

let activeGameSave = null

export function registerActiveGameSave(save) {
  activeGameSave = save
  return () => {
    if (activeGameSave === save) activeGameSave = null
  }
}

export function saveActiveGame() {
  return activeGameSave?.() ?? true
}

export function gameIdForRoute(routeName) {
  return ROUTE_GAME_IDS[routeName] ?? null
}

export function gameSaveKey(gameId, dailyDate = null) {
  const date = normalizeDailyDate(dailyDate)
  if (date) return `bender.${gameId}.daily.${date}.save.v1`
  return STANDARD_SAVE_KEYS[gameId] ?? null
}

export function hasGameSave(key) {
  if (!key) return false
  try {
    return Boolean(localStorage.getItem(key))
  } catch {
    saveFailed.value = true
    return false
  }
}

export function readGameSave(key) {
  if (!key) return null
  try {
    return localStorage.getItem(key)
  } catch {
    saveFailed.value = true
    return null
  }
}

export function writeGameSave(key, value) {
  if (!key) return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    saveFailed.value = false
    return true
  } catch {
    saveFailed.value = true
    return false
  }
}

export function removeGameSave(key) {
  if (!key) return true
  try {
    localStorage.removeItem(key)
    saveFailed.value = false
    return true
  } catch {
    saveFailed.value = true
    return false
  }
}

export function listSavedGames() {
  const savedGames = []
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key) continue

      const standardEntry = Object.entries(STANDARD_SAVE_KEYS).find(([, value]) => value === key)
      const dailyMatch = key.match(/^bender\.(tango|buscaminas|patches|2048)\.daily\.(\d{4}-\d{2}-\d{2})\.save\.v1$/)
      const dailyDate = normalizeDailyDate(dailyMatch?.[2])
      if (dailyMatch && !dailyDate) continue
      const gameId = standardEntry?.[0] ?? dailyMatch?.[1]
      if (!gameId) continue

      let raw
      try {
        raw = localStorage.getItem(key)
      } catch {
        saveFailed.value = true
        continue
      }

      try {
        const data = JSON.parse(raw ?? 'null')
        if (!data || !Number.isInteger(data.moves) || data.moves < 0) continue
        savedGames.push({
          gameId,
          dailyDate,
          savedAt: Number.isFinite(data.savedAt) ? data.savedAt : 0,
          moves: data.moves,
        })
      } catch {
        // The game view validates and clears its own save when opened.
      }
    }
  } catch {
    saveFailed.value = true
    return []
  }

  return savedGames.sort((a, b) => b.savedAt - a.savedAt)
}
