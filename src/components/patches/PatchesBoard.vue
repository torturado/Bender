<script setup>
import { computed, ref } from 'vue'
import { SIZE, PATCH_PALETTE } from '../../games/patches/constants.js'
import { cluesInRect, normalizeRect, validatePlacement } from '../../games/patches/validators.js'

const props = defineProps({
  clues: { type: Array, required: true },
  patches: { type: Array, required: true }, // [{ id, r1, c1, r2, c2 }]
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['draw', 'delete-patch'])

const dragStart = ref(null)
const dragEnd = ref(null)

const preview = computed(() => {
  if (!dragStart.value || !dragEnd.value) return null
  return normalizeRect(dragStart.value, dragEnd.value)
})

const previewState = computed(() => {
  if (!preview.value) return null
  if (cluesInRect(preview.value, props.clues).length === 0) return 'unrelated'
  return validatePlacement(preview.value, props.clues, props.patches).ok
    ? 'valid'
    : 'invalid'
})

const previewKeys = computed(() => {
  const set = new Set()
  const p = preview.value
  if (!p) return set
  for (let r = p.r1; r <= p.r2; r++) {
    for (let c = p.c1; c <= p.c2; c++) set.add(`${r},${c}`)
  }
  return set
})

const patchOfCell = computed(() => {
  const map = new Map()
  props.patches.forEach((p, i) => {
    for (let r = p.r1; r <= p.r2; r++) {
      for (let c = p.c1; c <= p.c2; c++) map.set(`${r},${c}`, i)
    }
  })
  return map
})

function rectAreaOf(rect) {
  return (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1)
}

/** Parches como piezas fusionadas: estilo + área para la capa superpuesta. */
const patchOverlays = computed(() =>
  props.patches.map((p, i) => {
    const related = cluesInRect(p, props.clues).length > 0
    const valid = related && validatePlacement(
      p,
      props.clues,
      props.patches.filter((_, patchIndex) => patchIndex !== i),
    ).ok
    return {
      id: p.id,
      style: overlayStyle(p),
      area: rectAreaOf(p),
      state: !related ? 'unrelated' : valid ? 'valid' : 'invalid',
      palette: PATCH_PALETTE[i % PATCH_PALETTE.length],
    }
  }),
)

/** Contorno + cuenta del rectángulo que se está dibujando. */
const previewOverlay = computed(() => {
  if (!preview.value) return null
  return {
    style: overlayStyle(preview.value),
    area: rectAreaOf(preview.value),
    state: previewState.value,
  }
})

function overlayStyle(rect) {
  return {
    left: `calc(${(rect.c1 / SIZE) * 100}% + 2px)`,
    top: `calc(${(rect.r1 / SIZE) * 100}% + 2px)`,
    width: `calc(${((rect.c2 - rect.c1 + 1) / SIZE) * 100}% - 4px)`,
    height: `calc(${((rect.r2 - rect.r1 + 1) / SIZE) * 100}% - 4px)`,
  }
}

function clueStyle(clue) {
  return {
    left: `${((clue.c + 0.5) / SIZE) * 100}%`,
    top: `${((clue.r + 0.5) / SIZE) * 100}%`,
  }
}

function cellFromEvent(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-cell]')
  if (!el) return null
  return { r: Number(el.dataset.r), c: Number(el.dataset.c) }
}

function onPointerDown(e, r, c) {
  if (props.disabled) return
  e.preventDefault()
  dragStart.value = { r, c }
  dragEnd.value = { r, c }
}

function onPointerMove(e) {
  if (!dragStart.value || props.disabled) return
  const cell = cellFromEvent(e)
  if (cell) dragEnd.value = cell
}

function onPointerUp(e) {
  if (!dragStart.value) return
  const start = dragStart.value
  const end = cellFromEvent(e) ?? dragEnd.value ?? start
  dragStart.value = null
  dragEnd.value = null
  if (props.disabled) return
  const same = start.r === end.r && start.c === end.c
  if (same) {
    const idx = patchOfCell.value.get(`${start.r},${start.c}`)
    if (idx !== undefined) emit('delete-patch', props.patches[idx].id)
    return
  }
  emit('draw', normalizeRect(start, end))
}

function onPointerCancel() {
  dragStart.value = null
  dragEnd.value = null
}

function shapeIcon(shape) {
  if (shape === 'square') return '■'
  if (shape === 'wide') return '▭'
  if (shape === 'tall') return '▯'
  return null
}
</script>

<template>
  <div class="game-board-frame patches-board-frame mx-auto">
    <div class="rounded-lg bg-ink-900 ring-1 ring-ink-500">
    <div class="relative">
      <!-- Base: casillas vacías + feedback del dibujo -->
      <div
        class="grid touch-none gap-1 select-none"
        :style="{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }"
        role="grid"
        aria-label="Tablero de Patches"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <template v-for="r in SIZE" :key="'row-' + r">
          <div
            v-for="c in SIZE"
            :key="'cell-' + r + '-' + c"
            role="gridcell"
            data-cell
            :data-r="r - 1"
            :data-c="c - 1"
            :class="[
              'aspect-square rounded border transition-colors',
              previewKeys.has(`${r - 1},${c - 1}`)
                ? previewState === 'valid'
                  ? 'border-orange-400 bg-orange-500/30'
                  : previewState === 'unrelated'
                    ? 'border-gray-400 bg-gray-500/20'
                    : 'border-red-500 bg-red-500/20'
                : 'border-ink-500 bg-ink-950/60 hover:border-mist-500',
            ]"
            @pointerdown="onPointerDown($event, r - 1, c - 1)"
          ></div>
        </template>
      </div>

      <!-- Parches fusionados + preview, superpuestos (no interceptan gestos) -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          v-for="o in patchOverlays"
          :key="'patch-' + o.id"
          :style="o.style"
          :class="o.state === 'valid'
            ? ['patch-overlay absolute flex items-center justify-center rounded-lg', o.palette.bg, o.palette.text]
            : o.state === 'unrelated'
              ? 'patch-overlay patch-overlay--unrelated absolute flex items-center justify-center rounded-lg border border-gray-400/60 bg-gray-500/35 text-mist-200'
              : 'patch-overlay patch-overlay--invalid absolute flex items-center justify-center rounded-lg border-2 border-red-500 bg-red-500/20 text-red-100 ring-2 ring-red-500/30'"
        >
          <span
            :class="['patch-area-number font-extrabold drop-shadow-md', o.state === 'valid' ? o.palette.text : o.state === 'unrelated' ? 'text-mist-200' : 'text-red-100']"
            >{{ o.area }}</span
          >
          <span
            v-if="o.state === 'invalid'"
            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-950 text-xs font-black text-red-100"
            aria-label="Parche incorrecto"
          >
            ×
          </span
          >
        </div>
        <div
          v-if="previewOverlay"
          :style="previewOverlay.style"
          :class="[
            'absolute flex items-center justify-center rounded-lg border-2 border-dashed',
            previewOverlay.state === 'valid'
              ? 'border-orange-300'
              : previewOverlay.state === 'unrelated'
                ? 'border-gray-400'
                : 'border-red-400',
          ]"
        >
          <span class="patch-area-number font-extrabold text-white drop-shadow-md">{{
            previewOverlay.area
          }}</span>
        </div>
      </div>

      <!-- Pistas en casillas aún sin cubrir (al colocar el parche, la pista se quita
           y queda solo el número del área) -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <template v-for="clue in clues" :key="'clue-' + clue.r + '-' + clue.c">
        <div
          v-if="!patchOfCell.has(`${clue.r},${clue.c}`)"
          :style="clueStyle(clue)"
          class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center leading-none text-mist-100 drop-shadow"
        >
          <span class="board-clue-number font-extrabold">{{ clue.number ?? '?' }}</span>
          <span v-if="shapeIcon(clue.shape)" class="board-clue-shape opacity-80">{{
            shapeIcon(clue.shape)
          }}</span>
        </div>
        </template>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.patch-area-number {
  font-size: clamp(0.8rem, 5.5cqw, 1.75rem);
  line-height: 1;
}

.board-clue-number {
  font-size: clamp(0.7rem, 4.5cqw, 1.5rem);
  line-height: 1;
}

.board-clue-shape {
  font-size: clamp(0.4rem, 2.3cqw, 0.75rem);
  line-height: 1;
}
</style>
