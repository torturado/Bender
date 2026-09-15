<script setup>
defineProps({
  canUndo: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['restart', 'undo'])
</script>

<template>
  <div class="mx-auto mb-5 flex w-full max-w-[440px] flex-wrap items-center justify-center gap-2">
    <div class="flex w-full items-center justify-center gap-2">
      <div class="rounded-md border border-ink-500 bg-ink-900 px-4 py-1.5 text-center">
        <p class="m-0 text-[10px] font-bold tracking-wider text-mist-400 uppercase">Puntos</p>
        <p class="m-0 text-lg font-extrabold text-white tabular-nums">{{ score }}</p>
      </div>
      <div class="rounded-md border border-ink-500 bg-ink-900 px-4 py-1.5 text-center">
        <p class="m-0 text-[10px] font-bold tracking-wider text-mist-400 uppercase">Movimientos</p>
        <p class="m-0 text-lg font-extrabold text-white tabular-nums">{{ moves }}</p>
      </div>
    </div>
    <button
      type="button"
      class="rounded-md border border-ink-500 bg-ink-800 min-h-[44px] px-4 py-2 text-sm font-bold text-mist-200 transition hover:border-mist-500 hover:text-white"
      @click="emit('restart')"
    >
      ↺ Reiniciar
    </button>
    <button
      type="button"
      :disabled="!canUndo"
      class="rounded-md border border-ink-500 bg-ink-800 min-h-[44px] px-4 py-2 text-sm font-bold text-mist-200 transition hover:border-mist-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      @click="emit('undo')"
    >
      ↩ Deshacer
    </button>
  </div>
</template>
