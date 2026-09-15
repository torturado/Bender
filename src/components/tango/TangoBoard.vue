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
  <div class="mx-auto w-full max-w-[560px]">
    <p class="mb-3 text-center text-xs text-mist-400">
      Cada fila y columna lleva {{ half }} ☀ y {{ half }} ☾. Pulsa una casilla:
      vacío → sol → luna.
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
              'relative flex aspect-square items-center justify-center rounded-md border text-2xl transition select-none sm:text-3xl',
            isError(r - 1, c - 1)
              ? 'border-red-500 bg-red-500/10 text-red-400 ring-1 ring-red-500'
              : isGiven(r - 1, c - 1)
                ? 'cursor-not-allowed border-ink-600 bg-ink-800'
                : 'border-ink-500 bg-ink-900 hover:border-orange-400',
          ]"
          @click="onCell(r - 1, c - 1)"
        >
            <span v-if="board[r - 1][c - 1] === SUN" class="leading-none text-amber-300">☀</span>
            <span v-else-if="board[r - 1][c - 1] === MOON" class="leading-none text-sky-300">☾</span>
            <span
              v-if="isError(r - 1, c - 1)"
              class="pointer-events-none absolute top-0.5 right-1 text-xs font-black text-red-400"
              aria-hidden="true"
              >✕</span
            >

          <!-- Marcas =/× en el borde derecho / inferior -->
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.right"
            class="pointer-events-none absolute top-1/2 -right-2.5 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-mist-500 bg-ink-950 text-[10px] font-bold text-mist-200"
            aria-hidden="true"
            >{{ edgeMap.get(`${r - 1},${c - 1}`).right === '=' ? '=' : '×' }}</span
          >
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.down"
            class="pointer-events-none absolute -bottom-2.5 left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-mist-500 bg-ink-950 text-[10px] font-bold text-mist-200"
            aria-hidden="true"
            >{{ edgeMap.get(`${r - 1},${c - 1}`).down === '=' ? '=' : '×' }}</span
          >
        </button>
      </template>
    </div>
  </div>
</template>
