# Bender Juegos

Salón de juegos de lógica en español. Incluye Tango, Buscaminas, Patches y 2048. La app funciona como web instalable y conserva partidas y preferencias en el almacenamiento local del navegador.

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm.
- Chrome o Chromium para los checks de navegador.

## Desarrollo

```sh
npm install
npm run dev
```

Vite muestra la dirección local donde queda disponible la app. Para generar los recursos de publicación:

```sh
npm run build
npm run preview
```

## Checks de navegador

Los checks existentes cubren el menú, Tango, 2048 y las transiciones. Necesitan que Vite esté levantado en otra terminal:

```sh
npm run dev
```

En una segunda terminal:

```sh
npm run check:browser
```

También se puede ejecutar una comprobación por separado con `npm run check:menu`, `npm run check:tango`, `npm run check:2048` o `npm run check:motion`.

Los checks buscan Chrome o Chromium en el `PATH` y en `~/.local/bin`. Si está en otra ubicación, indica la ruta del ejecutable:

```sh
BENDER_CHROME_PATH=/ruta/a/chrome npm run check:browser
```

Para usar otro puerto o servidor local, establece `BASE`, por ejemplo `BASE=http://localhost:4173 npm run check:browser`.

## Partidas y retos diarios

Las partidas, los récords y las preferencias se guardan en el almacenamiento local del navegador; no se envían a un servidor. La pantalla inicial ofrece continuar la partida más reciente de cada juego.

Los retos diarios usan la fecha UTC y generan el mismo tablero para todas las personas que abran el mismo enlace. Se pueden compartir desde el botón del reto. En Buscaminas, el centro es la zona protegida del reto diario; en partidas normales, la primera casilla elegida sigue siendo segura.

## Controles accesibles

- Tango y Buscaminas: usa las flechas para moverte entre casillas. En Tango, las pistas fijas se omiten.
- Patches: enfoca el tablero; usa las flechas y pulsa Intro en el inicio y el final del rectángulo. Suprimir elimina un parche y Escape cancela la selección.
- 2048: desliza en pantalla táctil o usa las flechas y W, A, S, D.

Los cronómetros se pausan cuando la app pasa a segundo plano. Las partidas se guardan después de los movimientos y al ocultar o cerrar la página.

## Android

La carpeta `android/` contiene el proyecto nativo de Capacitor. Tras compilar los recursos web, sincroniza los cambios con:

```sh
npx cap sync android
```
