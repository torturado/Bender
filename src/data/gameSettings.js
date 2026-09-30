const STORAGE_PREFIX = 'bender.settings.'

export function readGameSettings(gameId, defaults, isValid) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${gameId}.v1`)
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    return isValid(parsed) ? parsed : defaults
  } catch {
    return defaults
  }
}

export function writeGameSettings(gameId, settings) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${gameId}.v1`, JSON.stringify(settings))
  } catch {
    // A preference failing to persist should not block a game.
  }
}
