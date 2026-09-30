// Motor puro del 2048 (sin Vue, testeable).
// Tablero: number[SIZE][SIZE], 0 = vacía.

import { SIZE, SPAWN_FOUR_PROB } from './constants.js'

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

export function cloneBoard(board) {
  return board.map((row) => row.slice())
}

function emptyCells(board) {
  const out = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) out.push([r, c])
    }
  }
  return out
}

/** Coloca un 2 (90 %) o un 4 (10 %) en una vacía aleatoria. Mutación + devuelve [r, c] o null. */
export function spawnTile(board, fourProb = SPAWN_FOUR_PROB, random = Math.random) {
  const cells = emptyCells(board)
  if (cells.length === 0) return null
  const [r, c] = cells[Math.floor(random() * cells.length)]
  board[r][c] = random() < fourProb ? 4 : 2
  return [r, c]
}

/** Partida nueva: tablero vacío + 2 fichas. */
export function newGame(random = Math.random) {
  const board = emptyBoard()
  spawnTile(board, SPAWN_FOUR_PROB, random)
  spawnTile(board, SPAWN_FOUR_PROB, random)
  return board
}

/** Desliza una línea fusionando una sola vez por ficha. Devuelve { line, sources, gained }. */
export function slideLine(line) {
  const tiles = line
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value !== 0)
  const out = []
  const sources = []
  let gained = 0
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      const merged = tiles[i].value * 2
      out.push(merged)
      sources.push([tiles[i].index, tiles[i + 1].index])
      gained += merged
      i++
    } else {
      out.push(tiles[i].value)
      sources.push([tiles[i].index])
    }
  }
  while (out.length < SIZE) {
    out.push(0)
    sources.push([])
  }
  return { line: out, sources, gained }
}

function linesFor(board, dir) {
  // Devuelve las 4 líneas orientadas en el sentido del movimiento,
  // cada una como lista de [r, c] desde el borde hacia el que se desliza.
  const lines = []
  if (dir === 'left') {
    for (let r = 0; r < SIZE; r++) lines.push([0, 1, 2, 3].map((c) => [r, c]))
  } else if (dir === 'right') {
    for (let r = 0; r < SIZE; r++) lines.push([3, 2, 1, 0].map((c) => [r, c]))
  } else if (dir === 'up') {
    for (let c = 0; c < SIZE; c++) lines.push([0, 1, 2, 3].map((r) => [r, c]))
  } else {
    for (let c = 0; c < SIZE; c++) lines.push([3, 2, 1, 0].map((r) => [r, c]))
  }
  return lines
}

/**
 * Aplica un movimiento. NO spawnea: devuelve { board, gained, changed, moves }.
 * La vista spawnea solo si changed (y guarda historial solo entonces).
 */
export function move(board, dir) {
  const next = cloneBoard(board)
  let gained = 0
  let changed = false
  const moves = []
  for (const line of linesFor(board, dir)) {
    const values = line.map(([r, c]) => board[r][c])
    const { line: slid, sources, gained: g } = slideLine(values)
    gained += g
    line.forEach(([r, c], i) => {
      if (next[r][c] !== slid[i]) changed = true
      next[r][c] = slid[i]
      for (const sourceIndex of sources[i]) {
        moves.push({
          from: [...line[sourceIndex]],
          to: [r, c],
          merged: sources[i].length > 1,
        })
      }
    })
  }
  return { board: next, gained, changed, moves }
}

/** ¿Existe algún movimiento legal? */
export function canMove(board) {
  if (emptyCells(board).length > 0) return true
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]
      if (c + 1 < SIZE && board[r][c + 1] === v) return true
      if (r + 1 < SIZE && board[r + 1][c] === v) return true
    }
  }
  return false
}

export function hasTarget(board, target) {
  return board.some((row) => row.some((v) => v >= target))
}

export function boardsEqual(a, b) {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]))
}
