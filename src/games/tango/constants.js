// Constantes del juego Tango.
// Los valores de GIVENS_COUNT son el nº de celdas fijas visibles
// según tamaño × dificultad. Ajustables sin tocar la lógica.

export const EMPTY = 0
export const SUN = 1
export const MOON = 2

export const SIZES = [4, 6, 8]

export const DIFFICULTIES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
]

export const GIVENS_COUNT = {
  4: { facil: 8, media: 6, dificil: 4 },
  6: { facil: 14, media: 11, dificil: 8 },
  8: { facil: 22, media: 17, dificil: 12 },
}

// Nº de restricciones =/× visibles por tamaño.
export const CONSTRAINTS_COUNT = {
  4: 3,
  6: 5,
  8: 7,
}

// Límites del intento de unicidad (best-effort, ver generator.js).
export const MAX_UNIQUENESS_ATTEMPTS = 20
export const MAX_UNIQUENESS_ATTEMPTS_LARGE = 10
export const SOLVER_NODE_LIMIT = 30000

export function givensFor(size, difficultyId) {
  return GIVENS_COUNT[size]?.[difficultyId] ?? 6
}

export function constraintsFor(size) {
  return CONSTRAINTS_COUNT[size] ?? 5
}

export function difficultyLabel(difficultyId) {
  return DIFFICULTIES.find((d) => d.id === difficultyId)?.label ?? difficultyId
}
