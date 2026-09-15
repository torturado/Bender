// Constantes del 2048.

export const SIZE = 4
export const TARGET = 2048

// Probabilidad de que una ficha nueva sea un 4 (resto 2).
export const SPAWN_FOUR_PROB = 0.1

// Direcciones de movimiento.
export const DIRS = ['up', 'down', 'left', 'right']

// Colores por valor, adaptados al tema oscuro (fondo + texto).
export const TILE_CLASSES = {
  2: 'bg-[#3f3a32] text-mist-200',
  4: 'bg-[#4a4234] text-mist-100',
  8: 'bg-orange-500 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-[#c2410c] text-white',
  64: 'bg-[#9a3412] text-white',
  128: 'bg-amber-300 text-ink-950',
  256: 'bg-amber-400 text-ink-950',
  512: 'bg-amber-500 text-ink-950',
  1024: 'bg-yellow-300 text-ink-950',
  2048: 'bg-yellow-400 text-ink-950',
}

export function tileClass(value) {
  if (TILE_CLASSES[value]) return TILE_CLASSES[value]
  // Por encima de 2048 (modo infinito): mismo estilo dorado.
  return 'bg-yellow-200 text-ink-950'
}
