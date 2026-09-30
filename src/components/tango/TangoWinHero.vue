<script setup>
defineProps({
  size: { type: Number, required: true },
  difficultyLabel: { type: String, required: true },
  moves: { type: Number, default: 0 },
  seconds: { type: Number, default: 0 },
  bestTime: { type: Number, default: null },
  isNewRecord: { type: Boolean, default: false },
})

const emit = defineEmits(['play-again'])

function formatTime(s) {
  const m = Math.floor(s / 60)
  const rest = s % 60
  return m > 0 ? `${m} min ${rest} s` : `${rest} s`
}
</script>

<template>
  <section
    class="mx-auto w-full max-w-[560px] rounded-lg border-2 border-(--game-tango-border) bg-(--game-tango) p-8 text-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
  >
    <p class="sr-only" role="status" aria-live="polite">
      Tango completado. {{ size }}×{{ size }}, {{ difficultyLabel }}, {{ moves }} movimientos en {{ formatTime(seconds) }}.
    </p>
    <p class="mb-2 inline-block rounded bg-ink-950 px-2.5 py-0.5 text-[0.72rem] font-bold tracking-wider text-mist-100 uppercase">
      Tango completado
    </p>
    <h2 class="m-0 mb-2 text-3xl font-extrabold tracking-tight">¡Tablero completado! 🎉</h2>
    <p class="m-0 mb-1 font-semibold opacity-95">
      {{ size }}×{{ size }} · {{ difficultyLabel }}
    </p>
    <p class="m-0 mb-6 text-sm opacity-90">
      {{ moves }} movimiento{{ moves === 1 ? '' : 's' }} · {{ formatTime(seconds) }}
    </p>
    <p v-if="isNewRecord" class="mb-2 text-sm font-extrabold">¡Nuevo récord personal!</p>
    <p v-if="bestTime !== null" class="mb-6 text-sm opacity-90">Mejor tiempo: {{ formatTime(bestTime) }}</p>
    <p v-else class="mb-6 text-sm opacity-90">Aún no hay una mejor marca para esta configuración.</p>
    <button
      type="button"
      class="rounded-md border border-orange-300 bg-orange-500 px-6 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
      @click="emit('play-again')"
    >
      Jugar otra vez →
    </button>
  </section>
</template>
