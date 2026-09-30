const STORAGE_KEY = 'bender.records.v1'

function readRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    // Records are optional and must never prevent play.
    return false
  }
}

export function bestTimeFor(gameId, category) {
  const record = readRecords()[`${gameId}:${category}`]
  return Number.isInteger(record?.seconds) && record.seconds >= 0 ? record : null
}

export function recordBestTime(gameId, category, seconds, moves) {
  if (!Number.isInteger(seconds) || seconds < 0) return false
  const records = readRecords()
  const key = `${gameId}:${category}`
  const previous = records[key]
  if (Number.isInteger(previous?.seconds) && previous.seconds <= seconds) return false
  records[key] = { seconds, moves, achievedAt: Date.now() }
  return writeRecords(records)
}

export function bestScoreFor(gameId) {
  const record = readRecords()[gameId]
  return Number.isInteger(record?.score) && record.score >= 0 ? record.score : 0
}

export function recordBestScore(gameId, score) {
  if (!Number.isInteger(score) || score < 0) return false
  const records = readRecords()
  if (Number.isInteger(records[gameId]?.score) && records[gameId].score >= score) return false
  records[gameId] = { score, achievedAt: Date.now() }
  return writeRecords(records)
}
