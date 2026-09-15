<script setup>
import { computed, ref } from 'vue'
import { SIZE, PATCH_PALETTE } from '../../games/patches/constants.js'
import { normalizeRect, validatePlacement } from '../../games/patches/validators.js'

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

const previewValid = computed(() => {
  if (!preview.value) return false
  return validatePlacement(preview.value, props.clues, props.patches).ok
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
  props.patches.map((p, i) => ({
    id: p.id,
    style: overlayStyle(p),
    area: rectAreaOf(p),
    palette: PATCH_PALETTE[i % PATCH_PALETTE.length],
  })),
)

/** Contorno + cuenta del rectángulo que se está dibujando. */
const previewOverlay = computed(() => {
  if (!preview.value) return null
  return {
    style: overlayStyle(preview.value),
    area: rectAreaOf(preview.value),
    valid: previewValid.value,
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
    // Tap sin arrastre: borra el parche de esa casilla, si hay.
    const idx = patchOfCell.value.get(`${start.r},${start.c}`)
    if (idx !== undefined) emit('delete-patch', props.patches[idx].id)
    return
  }
  emit('draw', normalizeRect(start, end))
}

function shapeIcon(shape) {
  if (shape === 'square') return '■'
  if (shape === 'wide') return '▭'
  if (shape === 'tall') return '▯'
  return null
}
</script>

<template>
  <div class="mx-auto w-full max-w-[440px]">
    <p class="mb-3 text-center text-xs text-mist-500">
      Arrastra de esquina a esquina para dibujar un parche · toca un parche para borrarlo
    </p>
    <div class="rounded-lg border border-ink-500 bg-ink-900 p-2">
    <div class="relative">
      <!-- Base: casillas vacías + feedback del dibujo -->
      <div
        class="grid touch-none gap-1 select-none"
        :style="{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }"
        role="grid"
        aria-label="Tablero de Patches"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="dragStart = null"
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
                ? previewValid
                  ? 'border-orange-400 bg-orange-500/30'
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
          :class="['absolute flex items-center justify-center rounded-lg', o.palette.bg]"
        >
          <span
            :class="['text-2xl font-extrabold drop-shadow-md sm:text-3xl', o.palette.text]"
            >{{ o.area }}</span
          >
        </div>
        <div
          v-if="previewOverlay"
          :style="previewOverlay.style"
          :class="[
            'absolute flex items-center justify-center rounded-lg border-2 border-dashed',
            previewOverlay.valid ? 'border-orange-300' : 'border-red-400',
          ]"
        >
          <span class="text-2xl font-extrabold text-white drop-shadow-md sm:text-3xl">{{
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
          <span class="text-xl font-extrabold sm:text-2xl">{{ clue.number ?? '?' }}</span>
          <span v-if="shapeIcon(clue.shape)" class="text-[10px] opacity-80">{{
            shapeIcon(clue.shape)
          }}</span>
        </div>
        </template>
      </div>
      </div>
    </div>
  </div>
</template>
