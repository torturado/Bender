<script setup>
import { difficultyLabel } from '../../games/patches/constants.js'

defineProps({
  difficulty: { type: String, required: true },
  canUndo: { type: Boolean, default: false },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['undo', 'restart', 'new-game'])
</script>

<template>
  <div class="mx-auto mb-5 flex w-full max-w-[440px] flex-wrap items-center justify-center gap-2">
    <span
      class="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1 text-[0.85rem] font-bold text-orange-400"
    >
      {{ difficultyLabel(difficulty) }} · aleatoria
    </span>
    <div class="flex w-full flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        :disabled="!canUndo"
        class="rounded-md border border-ink-500 bg-ink-800 min-h-[44px] px-4 py-2 text-sm font-bold text-mist-200 transition hover:border-mist-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('undo')"
      >
        ↩ Deshacer
      </button>
      <button
        type="button"
        class="rounded-md border border-ink-500 bg-ink-800 min-h-[44px] px-4 py-2 text-sm font-bold text-mist-200 transition hover:border-mist-500 hover:text-white"
        @click="emit('restart')"
      >
        ↺ Reiniciar
      </button>
      <button
        type="button"
        class="rounded-md border border-orange-400 bg-orange-500 min-h-[44px] px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
        @click="emit('new-game')"
      >
        + Otra partida
      </button>
    </div>
    <span v-if="moves > 0" class="w-full text-center text-xs text-mist-400">
      {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}
    </span>
  </div>
</template>
