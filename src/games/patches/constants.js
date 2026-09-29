// Constantes del Patches.
// La dificultad controla nº de parches y especificidad de las pistas.
// Ajustable sin tocar la lógica.

export const SIZE = 6

export const SHAPE_SQUARE = 'square'
export const SHAPE_WIDE = 'wide'
export const SHAPE_TALL = 'tall'
export const SHAPE_FREE = 'free'

export const SHAPES = [SHAPE_SQUARE, SHAPE_WIDE, SHAPE_TALL, SHAPE_FREE]

export const SHAPE_LABEL = {
  square: 'Cuadrado',
  wide: 'Ancho',
  tall: 'Alto',
  free: 'Libre',
}

export const DIFFICULTIES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
]

// Nº de parches (min, max) por dificultad.
export const PATCH_COUNT = {
  facil: [8, 10],
  media: [7, 9],
  dificil: [6, 8],
}

// Ámbar y lima usan on-accent: sigue oscuro en claro. ink-950 no, porque ahí es el fondo.
export const PATCH_PALETTE = [
  { bg: 'bg-orange-500/70', text: 'text-white' },
  { bg: 'bg-sky-600/70', text: 'text-white' },
  { bg: 'bg-emerald-600/70', text: 'text-white' },
  { bg: 'bg-violet-600/70', text: 'text-white' },
  { bg: 'bg-rose-600/70', text: 'text-white' },
  { bg: 'bg-amber-500/70', text: 'text-on-accent' },
  { bg: 'bg-teal-600/70', text: 'text-white' },
  { bg: 'bg-indigo-500/70', text: 'text-white' },
  { bg: 'bg-lime-600/70', text: 'text-on-accent' },
  { bg: 'bg-fuchsia-600/70', text: 'text-white' },
]

export function difficultyLabel(difficultyId) {
  return DIFFICULTIES.find((d) => d.id === difficultyId)?.label ?? difficultyId
}
