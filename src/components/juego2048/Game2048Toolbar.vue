<script setup>
import { formatDuration } from '../../games/time.js'

defineProps({
  canUndo: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  moves: { type: Number, default: 0 },
  seconds: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  daily: { type: Boolean, default: false },
})

const emit = defineEmits(['restart', 'undo'])
</script>

<template>
  <div class="mx-auto mb-5 grid w-full max-w-[440px] gap-2">
    <div class="grid grid-cols-2 gap-2">
      <div class="rounded-md border border-ink-500 bg-ink-900 px-4 py-1.5 text-center">
        <p class="m-0 text-[10px] font-bold tracking-wider text-mist-400 uppercase">Puntos</p>
        <p class="m-0 text-lg font-extrabold text-mist-100 tabular-nums" aria-live="polite">{{ score }}</p>
      </div>
      <div class="rounded-md border border-ink-500 bg-ink-900 px-4 py-1.5 text-center">
        <p class="m-0 text-[10px] font-bold tracking-wider text-mist-400 uppercase">Movimientos</p>
        <p class="m-0 text-lg font-extrabold text-mist-100 tabular-nums" aria-live="polite">{{ moves }}</p>
      </div>
    </div>
    <div class="flex justify-between px-1 text-xs text-mist-400" aria-label="Tiempo y récord personal">
      <span>Tiempo {{ formatDuration(seconds) }}</span>
      <span>Récord {{ bestScore }}</span>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-2 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-mist-100 sm:px-4 sm:text-sm"
        @click="emit('restart')"
      >
        ↺ {{ daily ? 'Reiniciar reto' : 'Reiniciar' }}
      </button>
      <button
        type="button"
        :disabled="!canUndo"
        class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-2 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-mist-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
        @click="emit('undo')"
      >
        ↩ Deshacer
      </button>
    </div>
  </div>
</template>
