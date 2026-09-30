<script setup>
import { formatDuration } from '../../games/time.js'

defineProps({
  canUndo: { type: Boolean, default: false },
  moves: { type: Number, default: 0 },
  seconds: { type: Number, default: 0 },
  daily: { type: Boolean, default: false },
})

const emit = defineEmits(['restart', 'undo', 'new-game'])
</script>

<template>
  <div class="mx-auto mb-5 grid w-full max-w-[560px] gap-2" :class="daily ? 'grid-cols-2' : 'grid-cols-3'">
    <button
      v-if="!daily"
      type="button"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-mist-100 sm:px-4 sm:text-sm"
      @click="emit('restart')"
    >
      ↺ Reiniciar
    </button>
    <button
      type="button"
      :disabled="!canUndo"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-mist-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
      @click="emit('undo')"
    >
      ↩ Deshacer
    </button>
    <button
      type="button"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-orange-400 bg-orange-500 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-on-accent transition hover:bg-orange-400 sm:px-4 sm:text-sm"
      @click="emit('new-game')"
    >
      <span v-if="daily">↻ Reiniciar reto</span>
      <template v-else>
        <span class="sm:hidden">+ Nueva</span>
        <span class="hidden sm:inline">+ Otra partida</span>
      </template>
    </button>
    <div class="flex justify-center gap-4 text-center text-xs text-mist-400" :class="daily ? 'col-span-2' : 'col-span-3'" aria-label="Estadísticas de la partida">
      <span>Tiempo {{ formatDuration(seconds) }}</span>
      <span v-if="moves > 0">{{ moves }} movimiento{{ moves === 1 ? '' : 's' }}</span>
    </div>
  </div>
</template>
