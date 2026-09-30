export function confirmReplaceGame(moves, action = 'reiniciar') {
  if (moves <= 0) return true
  return window.confirm(
    `¿Quieres ${action}? Se perderá el progreso actual.`,
  )
}
