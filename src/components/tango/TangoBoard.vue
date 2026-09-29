<script setup>
import { computed } from 'vue'
import { SUN, MOON } from '../../games/tango/constants.js'

const props = defineProps({
  board: { type: Array, required: true },
  givens: { type: Array, required: true },
  errorKeys: { type: Object, required: true }, // Set de "r,c" en rojo
  constraints: { type: Array, default: () => [] },
})

const emit = defineEmits(['cell-click'])

const size = computed(() => props.board.length)
const half = computed(() => props.board.length / 2)

/** Mapa "r,c" → { right: '='|'x'|null, down: '='|'x'|null } para pintar =/× en el borde. */
const edgeMap = computed(() => {
  const map = new Map()
  const set = (r, c, dir, type) => {
    const k = `${r},${c}`
    if (!map.has(k)) map.set(k, { right: null, down: null })
    map.get(k)[dir] = type
  }
  for (const con of props.constraints) {
    if (con.r1 === con.r2) {
      const r = con.r1
      const left = Math.min(con.c1, con.c2)
      set(r, left, 'right', con.type)
    } else if (con.c1 === con.c2) {
      const c = con.c1
      const top = Math.min(con.r1, con.r2)
      set(top, c, 'down', con.type)
    }
  }
  return map
})

const isError = (r, c) => props.errorKeys.has(`${r},${c}`)
const isGiven = (r, c) => !!props.givens?.[r]?.[c]

function onCell(r, c) {
  emit('cell-click', { r, c })
}
</script>

<template>
  <div class="game-board-frame tango-board-frame mx-auto">
    <p class="board-instructions mb-3 text-center text-mist-400">
      Cada fila y columna lleva {{ half }}
      <svg class="inline-icon text-amber-300 light:text-amber-700" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.8" fill="currentColor" />
        <path
          class="cell-symbol-rays"
          d="M12 3.4V1.1M12 20.6v2.3M3.4 12H1.1M20.6 12h2.3M5.9 5.9 4.2 4.2M18.1 18.1l1.7 1.7M18.1 5.9l1.7-1.7M5.9 18.1l-1.7 1.7"
        />
      </svg>
      y {{ half }}
      <svg class="inline-icon text-sky-300 light:text-sky-700" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.6 14.6A8.9 8.9 0 1 1 9.4 3.4a7.2 7.2 0 0 0 11.2 11.2Z"
        />
      </svg>
      . Pulsa una casilla: vacío → sol → luna.
    </p>

    <div
      class="grid gap-1.5"
      :style="{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }"
      role="grid"
      aria-label="Tablero de Tango"
    >
      <template v-for="r in size" :key="'row-' + r">
        <button
          v-for="c in size"
          :key="'cell-' + r + '-' + c"
          type="button"
          role="gridcell"
            :aria-label="`Fila ${r}, columna ${c}${isError(r - 1, c - 1) ? ', mal colocada' : ''}`"
            :disabled="isGiven(r - 1, c - 1)"
            :class="[
              'board-cell relative flex aspect-square items-center justify-center rounded-md border transition select-none',
            isError(r - 1, c - 1)
              ? 'border-red-500 bg-red-500/10 text-red-400 ring-1 ring-red-500'
              : isGiven(r - 1, c - 1)
                ? 'cursor-not-allowed border-ink-600 bg-ink-800'
                : 'border-ink-500 bg-ink-900 hover:border-orange-400',
          ]"
          @click="onCell(r - 1, c - 1)"
        >
            <svg
              v-if="board[r - 1][c - 1] === SUN"
              class="cell-symbol anim-pop text-amber-300"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4.8" fill="currentColor" />
              <path
                class="cell-symbol-rays"
                d="M12 3.4V1.1M12 20.6v2.3M3.4 12H1.1M20.6 12h2.3M5.9 5.9 4.2 4.2M18.1 18.1l1.7 1.7M18.1 5.9l1.7-1.7M5.9 18.1l-1.7 1.7"
              />
            </svg>
            <svg
              v-else-if="board[r - 1][c - 1] === MOON"
              class="cell-symbol anim-pop text-sky-300"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M20.6 14.6A8.9 8.9 0 1 1 9.4 3.4a7.2 7.2 0 0 0 11.2 11.2Z"
              />
              <path
                class="cell-symbol-glint"
                d="M17.4 2.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z"
                fill="currentColor"
              />
            </svg>
            <span
              v-if="isError(r - 1, c - 1)"
              class="cell-error anim-fade-up pointer-events-none absolute top-0 right-0.5 font-black text-red-400"
              aria-hidden="true"
              >✕</span
            >

          <!-- Marcas =/× en el borde derecho / inferior, dibujadas con trazos
               en vez de glifos: la "=" de una fuente a este tamaño sale con
               líneas de 1px que desaparecen. -->
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.right"
            class="constraint-marker constraint-marker-right pointer-events-none absolute z-10 flex items-center justify-center rounded-full border border-mist-400 bg-ink-950 text-mist-100"
            aria-hidden="true"
          >
            <svg v-if="edgeMap.get(`${r - 1},${c - 1}`).right === '='" viewBox="0 0 24 24">
              <path class="constraint-glyph" d="M6.5 9.5h11M6.5 14.5h11" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path class="constraint-glyph" d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
            </svg>
          </span>
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.down"
            class="constraint-marker constraint-marker-down pointer-events-none absolute z-10 flex items-center justify-center rounded-full border border-mist-400 bg-ink-950 text-mist-100"
            aria-hidden="true"
          >
            <svg v-if="edgeMap.get(`${r - 1},${c - 1}`).down === '='" viewBox="0 0 24 24">
              <path class="constraint-glyph" d="M6.5 9.5h11M6.5 14.5h11" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path class="constraint-glyph" d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
            </svg>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.board-instructions {
  font-size: clamp(0.55rem, 2.2cqw, 0.75rem);
}

.board-cell {
  container-type: inline-size;
}

/* Los símbolos son SVG, así que el tamaño va en width/height y no en
   font-size. 44cqw los deja al 44 % de la celda: protagonistas sin
   llegar a tocar las marcas del borde. */
.cell-symbol {
  width: clamp(1.3rem, 44cqw, 2.5rem);
  height: clamp(1.3rem, 44cqw, 2.5rem);
}

/* Los mismos iconos, a tamaño de texto, en la línea de instrucciones. */
.inline-icon {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  vertical-align: -0.22em;
}

.cell-symbol-rays,
.cell-symbol-glint {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  opacity: 0.85;
}

.cell-symbol-glint {
  fill: currentColor;
  stroke: none;
  opacity: 0.55;
}

.cell-error {
  font-size: clamp(0.75rem, 30cqw, 1.1rem);
  line-height: 1;
}

/* El círculo crece a 48cqw y el glifo se dibuja con trazo de 2.6 en un
   viewBox de 24, así que en una marca de 42px son líneas de ~4.5px
   frente a las de 1px que salían con la fuente. */
.constraint-marker {
  width: 48cqw;
  height: 48cqw;
}

.constraint-marker svg {
  width: 78%;
  height: 78%;
}

.constraint-glyph {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
}

.constraint-marker-right {
  top: 50%;
  right: -24cqw;
  transform: translateY(-50%);
}

.constraint-marker-down {
  bottom: -24cqw;
  left: 50%;
  transform: translateX(-50%);
}
</style>
