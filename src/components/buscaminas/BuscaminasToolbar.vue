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
  <div class="mx-auto mb-5 flex w-full max-w-[560px] flex-wrap items-center justify-center gap-2">
    <button
      type="button"
      class="rounded-md border border-ink-500 bg-ink-800 min-h-[44px] px-4 py-2 text-sm font-bold text-mist-200 transition hover:border-mist-500 hover:text-white"
      @click="emit('restart')"
    >
      ↺ Reiniciar
    </button>

    <div
      class="flex overflow-hidden rounded-md border border-ink-500"
      role="radiogroup"
      aria-label="Herramienta"
    >
      <button
        type="button"
        role="radio"
        :aria-checked="tool === TOOL_PALA"
        :class="[
          'min-h-[44px] px-4 py-2 text-sm font-bold transition',
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
          'min-h-[44px] px-4 py-2 text-sm font-bold transition',
          tool === TOOL_BANDERA
            ? 'bg-orange-500 text-white'
            : 'bg-ink-800 text-mist-300 hover:text-white',
        ]"
        @click="emit('set-tool', TOOL_BANDERA)"
      >
        🚩 Bandera
      </button>
    </div>

    <span class="w-full text-center text-xs text-mist-400">
      🚩 {{ flagsLeft }} restante{{ flagsLeft === 1 ? '' : 's' }}
      <span v-if="moves > 0"> · {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}</span>
    </span>
  </div>
</template>
