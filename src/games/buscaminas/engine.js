// Motor puro del Buscaminas (sin Vue, testeable).
// Convención: matrices boolean[][] o number[][] de size×size.
// numbers[r][c] = -1 en minas, 0-8 en el resto.

export function emptyGrid(size, value = false) {
  return Array.from({ length: size }, () => Array(size).fill(value))
}

export function neighborsOf(size, r, c) {
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push([nr, nc])
    }
  }
  return out
}

function shuffled(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Coloca mineCount minas evitando la casilla segura y sus vecinas
 * (primer click siempre abre zona limpia).
 */
export function placeMines(size, mineCount, safeR, safeC) {
  const safe = new Set([`${safeR},${safeC}`])
  for (const [nr, nc] of neighborsOf(size, safeR, safeC)) safe.add(`${nr},${nc}`)
  const candidates = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!safe.has(`${r},${c}`)) candidates.push([r, c])
    }
  }
  const mines = emptyGrid(size, false)
  for (const [r, c] of shuffled(candidates).slice(0, mineCount)) {
    mines[r][c] = true
  }
  return mines
}

export function computeNumbers(mines) {
  const size = mines.length
  const numbers = emptyGrid(size, 0)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (mines[r][c]) {
        numbers[r][c] = -1
        continue
      }
      let n = 0
      for (const [nr, nc] of neighborsOf(size, r, c)) {
        if (mines[nr][nc]) n++
      }
      numbers[r][c] = n
    }
  }
  return numbers
}

/**
 * Revelado con flood fill: devuelve una NUEVA matriz revealed
 * más el nº de casillas recién abiertas.
 */
export function revealFrom(revealed, numbers, size, startR, startC) {
  const next = revealed.map((row) => row.slice())
  if (next[startR][startC]) return { grid: next, opened: 0 }
  let opened = 0
  const queue = [[startR, startC]]
  while (queue.length > 0) {
    const [r, c] = queue.pop()
    if (next[r][c]) continue
    next[r][c] = true
    opened++
    if (numbers[r][c] === 0) {
      for (const [nr, nc] of neighborsOf(size, r, c)) {
        if (!next[nr][nc]) queue.push([nr, nc])
      }
    }
  }
  return { grid: next, opened }
}

/**
 * Chord: pulsar con la pala una casilla revelada con número abre a la vez
 * todas sus vecinas tapadas sin bandera, pero SOLO si el nº de banderas
 * alrededor coincide con el número. Si alguna bandera estaba mal puesta,
 * puede pisar una mina: devuelve hitMine + mineAt en ese caso.
 */
export function chordFrom(revealed, flagged, numbers, mines, size, r, c) {
  const noop = { grid: revealed, opened: 0, hitMine: false, mineAt: null }
  if (!revealed[r]?.[c]) return noop
  const target = numbers[r][c]
  if (target <= 0) return noop
  const neighbors = neighborsOf(size, r, c)
  const flags = neighbors.filter(([nr, nc]) => flagged[nr][nc]).length
  if (flags !== target) return noop
  let grid = revealed.map((row) => row.slice())
  let opened = 0
  for (const [nr, nc] of neighbors) {
    if (grid[nr][nc] || flagged[nr][nc]) continue
    if (mines[nr][nc]) {
      return { grid, opened, hitMine: true, mineAt: { r: nr, c: nc } }
    }
    const res = revealFrom(grid, numbers, size, nr, nc)
    grid = res.grid
    opened += res.opened
  }
  return { grid, opened, hitMine: false, mineAt: null }
}

/** Victoria: todas las casillas sin mina están reveladas. */
export function checkWin(revealed, mines) {
  for (let r = 0; r < mines.length; r++) {
    for (let c = 0; c < mines[r].length; c++) {
      if (!mines[r][c] && !revealed[r][c]) return false
    }
  }
  return true
}

/** Banderas mal puestas (para marcarlas con ✕ al perder). */
export function wrongFlags(flagged, mines) {
  const bad = new Set()
  for (let r = 0; r < mines.length; r++) {
    for (let c = 0; c < mines[r].length; c++) {
      if (flagged[r][c] && !mines[r][c]) bad.add(`${r},${c}`)
    }
  }
  return bad
}

export function countFlags(flagged) {
  let n = 0
  for (const row of flagged) {
    for (const v of row) if (v) n++
  }
  return n
}
