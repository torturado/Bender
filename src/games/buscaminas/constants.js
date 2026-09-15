// Constantes del Buscaminas.
// MINES_COUNT es el nº de minas según tamaño × dificultad.
// Ajustable sin tocar la lógica.

export const TOOL_PALA = 'pala'
export const TOOL_BANDERA = 'bandera'

export const SIZES = [8, 10, 12]

export const DIFFICULTIES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
]

export const MINES_COUNT = {
  8: { facil: 8, media: 12, dificil: 16 },
  10: { facil: 12, media: 18, dificil: 25 },
  12: { facil: 20, media: 30, dificil: 40 },
}

export function minesFor(size, difficultyId) {
  return MINES_COUNT[size]?.[difficultyId] ?? 12
}

export function difficultyLabel(difficultyId) {
  return DIFFICULTIES.find((d) => d.id === difficultyId)?.label ?? difficultyId
}
