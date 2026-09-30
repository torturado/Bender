// Generador de puzzles Patches.
// Estrategia: partición rectangular aleatoria del tablero (splits guillotina)
// → una pista por parche → contenido de pista según dificultad.
// La unicidad NO se garantiza (sin solver): la victoria se valida por reglas,
// así que cualquier partición válida gana legítimamente.

import {
  SIZE,
  PATCH_COUNT,
  SHAPE_FREE,
  DIFFICULTIES,
} from './constants.js'

function randInt(min, max, random = Math.random) {
  return min + Math.floor(random() * (max - min + 1))
}

function shuffled(arr, random = Math.random) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rectSize(rect) {
  return {
    w: rect.c2 - rect.c1 + 1,
    h: rect.r2 - rect.r1 + 1,
  }
}

function actualShape(rect) {
  const { w, h } = rectSize(rect)
  if (w === h) return 'square'
  return w > h ? 'wide' : 'tall'
}

/** Parte un rectángulo en dos por un eje y posición aleatorios.
 *  Nunca produce parches de 1 casilla: las tiras 1x2/2x1 no se parten
 *  y en tiras más largas se evitan los cortes de borde. */
function splitRect(rect, random = Math.random) {
  const { w, h } = rectSize(rect)
  const axes = []
  if (w > 1) axes.push('v')
  if (h > 1) axes.push('h')
  if (axes.length === 0) return null
  const axis = axes[Math.floor(random() * axes.length)]
  if (axis === 'v') {
    const strip = h === 1
    const lo = strip ? rect.c1 + 1 : rect.c1
    const hi = strip ? rect.c2 - 2 : rect.c2 - 1
    if (lo > hi) return null
    const cut = randInt(lo, hi, random)
    return [
      { ...rect, c2: cut },
      { ...rect, c1: cut + 1 },
    ]
  }
  const strip = w === 1
  const lo = strip ? rect.r1 + 1 : rect.r1
  const hi = strip ? rect.r2 - 2 : rect.r2 - 1
  if (lo > hi) return null
  const cut = randInt(lo, hi, random)
  return [
    { ...rect, r2: cut },
    { ...rect, r1: cut + 1 },
  ]
}

/** Partición aleatoria en ~target rectángulos (splits guillotina). */
export function randomPartition(size, target, random = Math.random) {
  let rects = [{ r1: 0, c1: 0, r2: size - 1, c2: size - 1 }]
  let guard = 0
  while (rects.length < target && guard++ < 200) {
    const candidates = shuffled(
      rects.filter((r) => rectSize(r).w > 1 || rectSize(r).h > 1),
      random,
    )
    let split = false
    for (const victim of candidates) {
      const parts = splitRect(victim, random)
      if (!parts) continue
      rects = rects.filter((r) => r !== victim).concat(parts)
      split = true
      break
    }
    if (!split) break
  }
  return rects
}

function randomCellIn(rect, random = Math.random) {
  return {
    r: randInt(rect.r1, rect.r2, random),
    c: randInt(rect.c1, rect.c2, random),
  }
}

/** Contenido de pistas según dificultad. */
function buildClues(rects, difficulty, random = Math.random) {
  const order = shuffled(rects.map((_, i) => i), random)
  return rects.map((rect, i) => {
    const anchor = randomCellIn(rect, random)
    const area = rectSize(rect).w * rectSize(rect).h
    const shape = actualShape(rect)
    if (difficulty === 'facil') {
      return { ...anchor, number: area, shape }
    }
    if (difficulty === 'media') {
      // Todas numeradas; la mitad con icono de forma.
      const withShape = order.indexOf(i) < Math.ceil(rects.length / 2)
      return { ...anchor, number: area, shape: withShape ? shape : SHAPE_FREE }
    }
    // Difícil: una pista sin número y totalmente libre; pocas con forma.
    const isFree = order[0] === i
    if (isFree) {
      return { ...anchor, number: null, shape: SHAPE_FREE }
    }
    const withShape = order.indexOf(i) <= Math.ceil(rects.length / 3)
    return { ...anchor, number: area, shape: withShape ? shape : SHAPE_FREE }
  })
}

export function rollDifficulty(random = Math.random) {
  return DIFFICULTIES[Math.floor(random() * DIFFICULTIES.length)].id
}

/** Puzzle completo listo para jugar. */
export function generatePuzzle(difficultyId, random = Math.random) {
  const difficulty = DIFFICULTIES.some((d) => d.id === difficultyId)
    ? difficultyId
    : rollDifficulty(random)
  const [min, max] = PATCH_COUNT[difficulty]
  const target = randInt(min, max, random)
  const solution = randomPartition(SIZE, target, random)
  const clues = buildClues(solution, difficulty, random)
  return { size: SIZE, difficulty, clues, solution }
}
