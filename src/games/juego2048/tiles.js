// Identidad visual de las fichas del 2048.
// El tablero numérico sigue siendo la fuente de verdad; estas fichas solo
// conservan qué nodo del DOM debe desplazarse entre dos movimientos.

let nextId = 1

function createTile(value, r, c, kind = null) {
  return { id: nextId++, value, r, c, kind }
}

function positionKey(r, c) {
  return `${r},${c}`
}

/** Crea una ficha visual por cada valor no vacío del tablero. */
export function tilesFromBoard(board, kind = null) {
  const tiles = []
  board.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value !== 0) tiles.push(createTile(value, r, c, kind))
    })
  })
  return tiles
}

/**
 * Aplica la información de un movimiento a las fichas visuales.
 *
 * Las fichas que llegan a una misma casilla se conservan como ghosts para
 * que puedan terminar su desplazamiento bajo la ficha fusionada. Las fichas
 * nuevas se añaden al final y el resultado se ordena por id: Vue debe
 * reutilizar cada nodo con key estable para que la transición de transform
 * se dispare.
 */
export function tilesAfterMove(tiles, moves, board, spawned = null) {
  const activeTiles = tiles.filter((tile) => tile.kind !== 'ghost')
  const byPosition = new Map(
    activeTiles.map((tile) => [positionKey(tile.r, tile.c), tile]),
  )
  const arrivals = new Map()

  for (const move of moves) {
    const tile = byPosition.get(positionKey(...move.from))
    if (!tile) continue
    const destination = positionKey(...move.to)
    if (!arrivals.has(destination)) arrivals.set(destination, [])
    arrivals.get(destination).push({ move, tile })
  }

  const nextTiles = []

  for (const arrivalsAtDestination of arrivals.values()) {
    const [{ move }] = arrivalsAtDestination
    const [r, c] = move.to

    if (arrivalsAtDestination.length === 1) {
      const { tile } = arrivalsAtDestination[0]
      nextTiles.push({
        ...tile,
        value: board[r][c],
        r,
        c,
        kind: null,
      })
      continue
    }

    for (const { tile } of arrivalsAtDestination) {
      nextTiles.push({ ...tile, r, c, kind: 'ghost' })
    }
    nextTiles.push(createTile(board[r][c], r, c, 'merged'))
  }

  if (spawned) {
    const [r, c] = spawned
    nextTiles.push(createTile(board[r][c], r, c, 'new'))
  }

  return nextTiles.sort((a, b) => a.id - b.id)
}
