<script setup>
import { ref } from 'vue'
import { SIZE, tileClass } from '../../games/juego2048/constants.js'

defineProps({
  board: { type: Array, required: true },
})

const emit = defineEmits(['move'])

const SWIPE_MIN = 24
const touchStart = ref(null)

function onTouchStart(e) {
  const t = e.changedTouches[0]
  touchStart.value = { x: t.clientX, y: t.clientY }
}

function onTouchEnd(e) {
  if (!touchStart.value) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStart.value.x
  const dy = t.clientY - touchStart.value.y
  touchStart.value = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return
  emit('move', Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
}

function fontFor(value) {
  if (value >= 1024) return 'text-xl sm:text-2xl'
  if (value >= 128) return 'text-2xl sm:text-3xl'
  return 'text-3xl sm:text-4xl'
}
</script>

<template>
  <div
    class="mx-auto grid w-full max-w-[440px] gap-2 rounded-lg border border-ink-500 bg-ink-900 p-2.5 touch-pan-y"
    :style="{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }"
    role="grid"
    aria-label="Tablero 2048"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div
      v-for="(row, r) in board"
      :key="'row-' + r"
      class="contents"
    >
      <div
        v-for="(value, c) in row"
        :key="'cell-' + r + '-' + c"
        role="gridcell"
        :class="[
          'flex aspect-square items-center justify-center rounded-md font-extrabold tabular-nums transition-colors',
          fontFor(value),
          value === 0 ? 'bg-ink-950/60 text-transparent' : tileClass(value),
        ]"
      >
        {{ value === 0 ? '·' : value }}
      </div>
    </div>
  </div>
</template>
