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

function onTouchCancel() {
  touchStart.value = null
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

function fontSizeFor(value) {
  if (value >= 1024) return 'clamp(0.8rem, 6cqw, 1.75rem)'
  if (value >= 128) return 'clamp(1rem, 8cqw, 2.25rem)'
  return 'clamp(1.15rem, 10cqw, 3rem)'
}
</script>

<template>
  <div
    class="game-board-frame game-2048-board-frame mx-auto grid gap-2 rounded-lg border border-ink-500 bg-ink-900 p-2.5 touch-none"
    :style="{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }"
    role="grid"
    aria-label="Tablero 2048"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
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
          value === 0 ? 'bg-ink-950/60 text-transparent' : tileClass(value),
        ]"
        :style="{ fontSize: fontSizeFor(value) }"
      >
        {{ value === 0 ? '·' : value }}
      </div>
    </div>
  </div>
</template>
