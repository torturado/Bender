<script setup>
import { TOOL_PALA, TOOL_BANDERA } from '../../games/buscaminas/constants.js'

defineProps({
  tool: { type: String, default: TOOL_PALA },
  flagsLeft: { type: Number, default: 0 },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['restart', 'set-tool'])
</script>

<template>
  <div class="mx-auto mb-5 grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-2">
    <button type="button" class="btn-ghost btn-compact w-full" @click="emit('restart')">
      Reiniciar
    </button>

    <div
      class="grid min-w-0 grid-cols-2 overflow-hidden rounded-button border-[1.5px] border-ink"
      role="radiogroup"
      aria-label="Herramienta"
    >
      <button
        type="button"
        role="radio"
        :aria-checked="tool === TOOL_PALA"
        :class="[
          'min-h-[44px] min-w-0 px-2 text-[13px] font-medium transition',
          tool === TOOL_PALA ? 'bg-ink text-on-ink' : 'bg-surface text-ink hover:bg-porcelain',
        ]"
        @click="emit('set-tool', TOOL_PALA)"
      >
        Pala
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="tool === TOOL_BANDERA"
        :class="[
          'min-h-[44px] min-w-0 border-l-[1.5px] border-ink px-2 text-[13px] font-medium transition',
          tool === TOOL_BANDERA ? 'bg-ink text-on-ink' : 'bg-surface text-ink hover:bg-porcelain',
        ]"
        @click="emit('set-tool', TOOL_BANDERA)"
      >
        Bandera
      </button>
    </div>

    <span class="caption col-span-2 text-center">
      {{ flagsLeft }} bandera{{ flagsLeft === 1 ? '' : 's' }}
      <span v-if="moves > 0" class="anim-fade-up">
        · {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}</span
      >
    </span>
  </div>
</template>
