// Lista central de juegos. Para añadir/cambiar un juego en el futuro,
// edita este array y crea su vista en src/views/.
export const games = [
  {
    id: 'tango',
    title: 'Tango',
    short: 'Puzzle de lógica por cuadrícula',
    description: 'Rellena la cuadrícula respetando las reglas de igualdad y adyacencia.',
    monogram: 'T',
    route: '/juegos/tango',
    color: '#007a0a',
    borderColor: '#e28e3a',
  },
  {
    id: 'buscaminas',
    title: 'Buscaminas',
    short: 'Despeja el tablero sin explotar',
    description: 'Revela casillas, marca las minas y despeja todo el tablero.',
    monogram: 'B',
    route: '/juegos/buscaminas',
    color: '#c52d27',
    borderColor: '#ecb166',
  },
  {
    id: 'patches',
    title: 'Patches',
    short: 'Divide el tablero en parches',
    description: 'Dibuja rectángulos que cumplan cada pista hasta cubrirlo todo.',
    monogram: 'P',
    route: '/juegos/patches',
    color: '#7e3fe8',
    borderColor: '#e28e3a',
  },
  {
    id: '2048',
    title: '2048',
    short: 'Desliza y combina hasta 2048',
    description: 'Une números iguales y llega a la ficha 2048 sin quedarte sin movimientos.',
    monogram: '2048',
    route: '/juegos/2048',
    color: '#006daa',
    borderColor: '#e28e3a',
  },
]

// Los rellenos llevan texto blanco encima y se apoyan en fondos claros y
// oscuros: tienen que dar 4.5:1 con el blanco y 3:1 con los dos fondos.
// main.js las publica en :root como --game-<id> y --game-<id>-border.
export const gameColorVars = Object.fromEntries(
  games.flatMap((game) => [
    [`--game-${game.id}`, game.color],
    [`--game-${game.id}-border`, game.borderColor],
  ]),
)
