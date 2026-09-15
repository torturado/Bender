// Generador de puzzles Tango.
// Estrategia: solución válida aleatoria (backtracking) → restricciones =/×
// coherentes con ella → pistas (givens) según dificultad.
// La unicidad es best-effort: se intenta con un solver limitado y, si no se
// consigue demostrar, se acepta el puzzle igualmente (sigue siendo válido y
// el aviso en rojo contra la solución conocida sigue siendo correcto).

import {
  EMPTY,
  SUN,
  MOON,
  SIZES,
  DIFFICULTIES,
  givensFor,
  constraintsFor,
  MAX_UNIQUENESS_ATTEMPTS,
  MAX_UNIQUENESS_ATTEMPTS_LARGE,
  SOLVER_NODE_LIMIT,
} from './constants.js'

function shuffled(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY))
}

function cloneBoard(board) {
  return board.map((row) => row.slice())
}

/** ¿Se puede poner val en (r,c) sin romper igualdad ni triples? */
function isValidPlacement(board, size, half, r, c, val) {
  // Triples: basta mirar los 2 anteriores en fila y columna.
  if (c >= 2 && board[r][c - 1] === val && board[r][c - 2] === val) return false
  if (r >= 2 && board[r - 1][c] === val && board[r - 2][c] === val) return false

  let rowSuns = 0
  let rowMoons = 0
  for (let cc = 0; cc < size; cc++) {
    const v = cc === c ? val : board[r][cc]
    if (v === SUN) rowSuns++
    else if (v === MOON) rowMoons++
  }
  if (rowSuns > half || rowMoons > half) return false
  // En filas solo importa lo que queda de la propia fila.
  const rowRemaining = size - (c + 1)
  if (rowSuns + rowRemaining < half || rowMoons + rowRemaining < half) return false

  let colSuns = 0
  let colMoons = 0
  for (let rr = 0; rr < size; rr++) {
    const v = rr === r ? val : board[rr][c]
    if (v === SUN) colSuns++
    else if (v === MOON) colMoons++
    // Nota: en generación row-major las filas > r aún están vacías en esta
    // columna, así que cuentan como "restantes".
  }
  if (colSuns > half || colMoons > half) return false
  const colRemaining = size - (r + 1)
  if (colSuns + colRemaining < half || colMoons + colRemaining < half) return false

  return true
}

function placementRespectsConstraints(board, r, c, val, adjMap) {
  const neighbors = adjMap.get(`${r},${c}`)
  if (!neighbors) return true
  for (const { nr, nc, type } of neighbors) {
    const other = board[nr][nc]
    if (other === EMPTY) continue
    if (type === '=' && other !== val) return false
    if (type === 'x' && other === val) return false
  }
  return true
}

function buildAdjMap(constraints) {
  const map = new Map()
  const add = (r, c, nr, nc, type) => {
    const k = `${r},${c}`
    if (!map.has(k)) map.set(k, [])
    map.get(k).push({ nr, nc, type })
  }
  for (const con of constraints) {
    add(con.r1, con.c1, con.r2, con.c2, con.type)
    add(con.r2, con.c2, con.r1, con.c1, con.type)
  }
  return map
}

/** Solución completa válida y aleatoria. */
export function generateSolution(size) {
  const half = size / 2
  for (let restart = 0; restart < 8; restart++) {
    const board = emptyBoard(size)
    const solve = (idx) => {
      if (idx === size * size) return true
      const r = Math.floor(idx / size)
      const c = idx % size
      for (const val of shuffled([SUN, MOON])) {
        if (!isValidPlacement(board, size, half, r, c, val)) continue
        board[r][c] = val
        if (solve(idx + 1)) return true
        board[r][c] = EMPTY
      }
      return false
    }
    if (solve(0)) return board
  }
  throw new Error(`No se pudo generar una solución ${size}x${size}`)
}

function adjacentPairs(size) {
  const pairs = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) pairs.push({ r1: r, c1: c, r2: r, c2: c + 1 })
      if (r + 1 < size) pairs.push({ r1: r, c1: c, r2: r + 1, c2: c })
    }
  }
  return pairs
}

/** Restricciones =/× coherentes con la solución dada. */
export function generateConstraints(solution, size, count) {
  const pairs = shuffled(adjacentPairs(size))
  return pairs.slice(0, count).map((p) => ({
    ...p,
    type: solution[p.r1][p.c1] === solution[p.r2][p.c2] ? '=' : 'x',
  }))
}

/**
 * Cuenta soluciones (hasta `limit`) del tablero parcial con restricciones.
 * Devuelve { count, overLimit }.
 */
export function countSolutions(initialBoard, constraints, limit = 2, nodeLimit = SOLVER_NODE_LIMIT) {
  const size = initialBoard.length
  const half = size / 2
  const board = cloneBoard(initialBoard)
  const adjMap = buildAdjMap(constraints)
  const empties = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === EMPTY) empties.push([r, c])
    }
  }
  let count = 0
  let nodes = 0
  let overLimit = false

  const solve = (pos) => {
    if (count >= limit || overLimit) return
    if (++nodes > nodeLimit) {
      overLimit = true
      return
    }
    if (pos === empties.length) {
      count++
      return
    }
    const [r, c] = empties[pos]
    for (const val of [SUN, MOON]) {
      if (!isValidPlacement(board, size, half, r, c, val)) continue
      if (!placementRespectsConstraints(board, r, c, val, adjMap)) continue
      board[r][c] = val
      solve(pos + 1)
      board[r][c] = EMPTY
      if (count >= limit || overLimit) return
    }
  }
  solve(0)
  return { count, overLimit }
}

function pickGivens(solution, size, givensCount, constraints) {
  const total = size * size
  const attempts = size >= 8 ? MAX_UNIQUENESS_ATTEMPTS_LARGE : MAX_UNIQUENESS_ATTEMPTS
  let fallback = null

  for (let a = 0; a < attempts; a++) {
    const idx = shuffled(Array.from({ length: total }, (_, i) => i)).slice(0, givensCount)
    const keep = new Set(idx)
    const initial = emptyBoard(size)
    const givens = Array.from({ length: size }, () => Array(size).fill(false))
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (keep.has(r * size + c)) {
          initial[r][c] = solution[r][c]
          givens[r][c] = true
        }
      }
    }
    if (!fallback) fallback = { initial, givens }
    const { count, overLimit } = countSolutions(initial, constraints, 2)
    if (!overLimit && count === 1) return { initial, givens, unique: true }
  }
  return { ...fallback, unique: false }
}

/** Puzzle completo listo para jugar. */
export function generatePuzzle(size, difficultyId) {
  const safeSize = SIZES.includes(size) ? size : 6
  const safeDifficulty = DIFFICULTIES.some((d) => d.id === difficultyId) ? difficultyId : 'media'
  const solution = generateSolution(safeSize)
  const constraints = generateConstraints(solution, safeSize, constraintsFor(safeSize))
  const { initial, givens, unique } = pickGivens(
    solution,
    safeSize,
    givensFor(safeSize, safeDifficulty),
    constraints,
  )
  return {
    size: safeSize,
    difficulty: safeDifficulty,
    solution,
    givens,
    initialBoard: initial,
    constraints,
    unique,
  }
}
