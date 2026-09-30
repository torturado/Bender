import { accessSync, constants } from 'node:fs'
import { delimiter, join, resolve } from 'node:path'

export const BASE = process.env.BASE ?? 'http://localhost:5173'

function isExecutable(path) {
  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function findChromium() {
  const configuredPath = process.env.BENDER_CHROME_PATH ?? process.env.CHROME_PATH
  if (configuredPath) {
    const path = resolve(configuredPath)
    if (isExecutable(path)) return path
    throw new Error(`No se puede ejecutar el navegador configurado en ${path}`)
  }

  const pathNames = [
    'google-chrome-stable',
    'google-chrome',
    'chromium',
    'chromium-browser',
    'chrome',
  ]
  const searchDirectories = [
    process.env.HOME ? join(process.env.HOME, '.local/bin') : null,
    ...(process.env.PATH ?? '').split(delimiter),
  ].filter(Boolean)

  for (const directory of searchDirectories) {
    for (const name of pathNames) {
      const path = join(directory, name)
      if (isExecutable(path)) return path
    }
  }

  throw new Error(
    'No encuentro Chrome o Chromium. Instálalo o define BENDER_CHROME_PATH.',
  )
}

export const CHROMIUM_EXECUTABLE = findChromium()
