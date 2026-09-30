export function dailyChallengeDate(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function normalizeDailyDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : null
}

export function dailyChallengeSeed(gameId, date) {
  const value = `${gameId}:${normalizeDailyDate(date) ?? dailyChallengeDate()}`
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

export function createSeededRandom(seed, savedState = null) {
  let state = Number.isInteger(savedState) && savedState !== 0
    ? savedState >>> 0
    : (seed >>> 0) || 1

  const random = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0x100000000
  }

  random.getState = () => state
  return random
}
