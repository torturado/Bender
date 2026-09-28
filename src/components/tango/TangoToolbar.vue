<script setup>
defineProps({
  canUndo: { type: Boolean, default: false },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['restart', 'undo', 'new-game'])
</script>

<template>
  <div class="mx-auto mb-5 grid w-full max-w-[560px] grid-cols-3 gap-2">
    <button
      type="button"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-white sm:px-4 sm:text-sm"
      @click="emit('restart')"
    >
      ↺ Reiniciar
    </button>
    <button
      type="button"
      :disabled="!canUndo"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-mist-200 transition hover:border-mist-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
      @click="emit('undo')"
    >
      ↩ Deshacer
    </button>
    <button
      type="button"
      class="min-h-[44px] w-full min-w-0 rounded-md border border-orange-400 bg-orange-500 px-1.5 py-2 text-xs font-bold whitespace-nowrap text-white transition hover:bg-orange-600 sm:px-4 sm:text-sm"
      @click="emit('new-game')"
    >
      <span class="sm:hidden">+ Nueva</span>
      <span class="hidden sm:inline">+ Otra partida</span>
    </button>
    <span
      v-if="moves > 0"
      class="anim-fade-up col-span-3 text-center text-xs text-mist-400"
    >
      {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}
    </span>
  </div>
</template>
