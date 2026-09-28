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
    <button
      type="button"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-white sm:px-4 sm:text-sm"
      @click="emit('restart')"
    >
      ↺ Reiniciar
    </button>

    <div
      class="grid min-w-0 grid-cols-2 overflow-hidden rounded-md border border-ink-500"
      role="radiogroup"
      aria-label="Herramienta"
    >
      <button
        type="button"
        role="radio"
        :aria-checked="tool === TOOL_PALA"
        :class="[
          'min-h-[44px] min-w-0 px-1 py-2 text-xs font-bold whitespace-nowrap transition sm:px-4 sm:text-sm',
          tool === TOOL_PALA
            ? 'bg-orange-500 text-white'
            : 'bg-ink-800 text-mist-300 hover:text-white',
        ]"
        @click="emit('set-tool', TOOL_PALA)"
      >
        ⛏ Pala
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="tool === TOOL_BANDERA"
        :class="[
          'min-h-[44px] min-w-0 border-l border-ink-500 px-1 py-2 text-xs font-bold whitespace-nowrap transition sm:px-4 sm:text-sm',
          tool === TOOL_BANDERA
            ? 'bg-orange-500 text-white'
            : 'bg-ink-800 text-mist-300 hover:text-white',
        ]"
        @click="emit('set-tool', TOOL_BANDERA)"
      >
        🚩 Bandera
      </button>
    </div>

    <span class="col-span-2 text-center text-xs text-mist-400">
      🚩 {{ flagsLeft }} restante{{ flagsLeft === 1 ? '' : 's' }}
      <span v-if="moves > 0" class="anim-fade-up"> · {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}</span>
    </span>
  </div>
</template>
