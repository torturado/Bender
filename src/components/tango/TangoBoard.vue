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
              'board-cell relative flex aspect-square items-center justify-center rounded-md border transition select-none',
            isError(r - 1, c - 1)
              ? 'border-red-500 bg-red-500/10 text-red-400 ring-1 ring-red-500'
              : isGiven(r - 1, c - 1)
                ? 'cursor-not-allowed border-ink-600 bg-ink-800'
                : 'border-ink-500 bg-ink-900 hover:border-orange-400',
          ]"
          @click="onCell(r - 1, c - 1)"
        >
            <span
              v-if="board[r - 1][c - 1] === SUN"
              class="cell-symbol anim-pop leading-none text-amber-300"
              >☀</span
            >
            <span
              v-else-if="board[r - 1][c - 1] === MOON"
              class="cell-symbol anim-pop leading-none text-sky-300"
              >☾</span
            >
            <span
              v-if="isError(r - 1, c - 1)"
              class="cell-error anim-fade-up pointer-events-none absolute top-0.5 right-1 font-black text-red-400"
              aria-hidden="true"
              >✕</span
            >

          <!-- Marcas =/× en el borde derecho / inferior -->
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.right"
            class="constraint-marker constraint-marker-right pointer-events-none absolute z-10 flex items-center justify-center rounded-full border border-mist-500 bg-ink-950 font-bold text-mist-200"
            aria-hidden="true"
            >{{ edgeMap.get(`${r - 1},${c - 1}`).right === '=' ? '=' : '×' }}</span
          >
          <span
            v-if="edgeMap.get(`${r - 1},${c - 1}`)?.down"
            class="constraint-marker constraint-marker-down pointer-events-none absolute z-10 flex items-center justify-center rounded-full border border-mist-500 bg-ink-950 font-bold text-mist-200"
            aria-hidden="true"
            >{{ edgeMap.get(`${r - 1},${c - 1}`).down === '=' ? '=' : '×' }}</span
          >
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

.cell-symbol {
  font-size: clamp(0.75rem, 32cqw, 1.75rem);
  line-height: 1;
}

.cell-error {
  font-size: clamp(0.5rem, 24cqw, 0.75rem);
  line-height: 1;
}

.constraint-marker {
  width: 42cqw;
  height: 42cqw;
  font-size: clamp(0.45rem, 22cqw, 0.7rem);
  line-height: 1;
}

.constraint-marker-right {
  top: 50%;
  right: -21cqw;
  transform: translateY(-50%);
}

.constraint-marker-down {
  bottom: -21cqw;
  left: 50%;
  transform: translateX(-50%);
}
</style>
