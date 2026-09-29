// Constantes del 2048.

export const SIZE = 4
export const TARGET = 2048

// Probabilidad de que una ficha nueva sea un 4 (resto 2).
export const SPAWN_FOUR_PROB = 0.1

// Direcciones de movimiento.
export const DIRS = ['up', 'down', 'left', 'right']

// El 2 y el 4 cambian de masa en claro (el marrón oscuro se traga el texto).
// A partir de 128 el texto es on-accent: oscuro en los dos temas. ink-950
// no vale, porque en claro pasa a ser el fondo de la página.
export const TILE_CLASSES = {
  2: 'bg-[#3f3a32] text-mist-200 light:bg-[#eee4da] light:text-[#6f675e]',
  4: 'bg-[#4a4234] text-mist-100 light:bg-[#ede0c8] light:text-[#6f675e]',
  8: 'bg-orange-500 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-[#c2410c] text-white',
  64: 'bg-[#9a3412] text-white',
  128: 'bg-amber-300 text-on-accent',
  256: 'bg-amber-400 text-on-accent',
  512: 'bg-amber-500 text-on-accent',
  1024: 'bg-yellow-300 text-on-accent',
  2048: 'bg-yellow-400 text-on-accent',
}

export function tileClass(value) {
  if (TILE_CLASSES[value]) return TILE_CLASSES[value]
  // Por encima de 2048 (modo infinito): mismo estilo dorado.
  return 'bg-yellow-200 text-on-accent'
}
