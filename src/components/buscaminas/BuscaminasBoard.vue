<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, required: true },
  numbers: { type: Array, required: true }, // -1 = mina (vacío hasta colocar)
  mines: { type: Array, required: true },
  revealed: { type: Array, required: true },
  flagged: { type: Array, required: true },
  minesPlaced: { type: Boolean, default: false },
  status: { type: String, default: 'playing' }, // playing | lost | won
  exploded: { type: Object, default: null }, // { r, c } o null
  wrongFlags: { type: Object, default: () => new Set() }, // Set "r,c"
})

const emit = defineEmits(['cell-click', 'cell-flag'])

const interactive = computed(() => props.status === 'playing')

// Colores clásicos de números adaptados al tema oscuro.
const NUMBER_CLASSES = {
  1: 'text-sky-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-violet-400',
  5: 'text-amber-400',
  6: 'text-teal-300',
  7: 'text-white',
  8: 'text-mist-400',
}

function showMine(r, c) {
  if (!props.minesPlaced) return false
  if (props.status !== 'lost') return false
  return props.mines[r][c]
}

function cellContent(r, c) {
  if (props.revealed[r][c]) {
    if (props.minesPlaced && props.mines[r][c]) return 'mine'
    return props.numbers[r][c] === 0 ? 'empty' : 'number'
  }
  if (props.flagged[r][c]) return props.wrongFlags.has(`${r},${c}`) ? 'wrong-flag' : 'flag'
  if (showMine(r, c)) return 'mine'
  return 'hidden'
}
</script>

<template>
  <div
    class="game-board-frame buscaminas-board-frame mx-auto grid gap-1"
    :style="{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }"
    role="grid"
    aria-label="Tablero de Buscaminas"
  >
    <template v-for="r in size" :key="'row-' + r">
      <button
        v-for="c in size"
        :key="'cell-' + r + '-' + c"
        type="button"
        role="gridcell"
        :aria-label="`Fila ${r}, columna ${c}`"
        :aria-disabled="!interactive"
        :class="[
          'buscaminas-cell flex aspect-square items-center justify-center rounded border font-extrabold transition select-none',
          cellContent(r - 1, c - 1) === 'hidden'
            ? 'border-ink-500 bg-ink-900 hover:border-orange-400'
            : cellContent(r - 1, c - 1) === 'wrong-flag'
              ? 'border-red-500 bg-red-500/15'
              : exploded && exploded.r === r - 1 && exploded.c === c - 1
                ? 'cell-boom border-red-500 bg-red-600'
                : 'cursor-default border-ink-600 bg-ink-950',
          !interactive ? 'hover:border-ink-500' : '',
        ]"
        @click="emit('cell-click', { r: r - 1, c: c - 1 })"
        @contextmenu.prevent="emit('cell-flag', { r: r - 1, c: c - 1 })"
      >
        <span
          v-if="cellContent(r - 1, c - 1) === 'mine'"
          class="cell-content anim-pop leading-none"
          >💣</span
        >
        <span
          v-else-if="cellContent(r - 1, c - 1) === 'number'"
          class="cell-content anim-pop leading-none"
          :class="NUMBER_CLASSES[numbers[r - 1][c - 1]]"
          >{{ numbers[r - 1][c - 1] }}</span
        >
        <span
          v-else-if="cellContent(r - 1, c - 1) === 'flag'"
          class="cell-content anim-pop leading-none"
          >🚩</span
        >
        <span
          v-else-if="cellContent(r - 1, c - 1) === 'wrong-flag'"
          class="cell-content leading-none"
          >🚩<span class="text-red-400">✕</span></span
        >
      </button>
    </template>
  </div>
</template>

<style scoped>
.buscaminas-cell {
  container-type: inline-size;
}

.cell-content {
  font-size: clamp(0.55rem, 32cqw, 1.25rem);
  line-height: 1;
}

/* La mina que te ha matado tiembla una vez al perder. Solo se anima
   transform: un tablero de 16x30 con box-shadow animado se arrastra. */
.cell-boom {
  animation: cell-boom 420ms var(--ease-out-soft) both;
}

@keyframes cell-boom {
  0%,
  100% {
    transform: translateX(0);
  }

  15% {
    transform: translateX(-5px);
  }

  35% {
    transform: translateX(4px);
  }

  55% {
    transform: translateX(-3px);
  }

  75% {
    transform: translateX(2px);
  }
}
</style>
