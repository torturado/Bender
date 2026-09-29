<script setup>
defineProps({
  kind: { type: String, required: true }, // 'win' | 'lost'
  score: { type: Number, default: 0 },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['restart', 'continue'])
</script>

<template>
  <section
    class="mx-auto w-full max-w-[440px] rounded-lg border-2 border-(--game-2048-border) bg-(--game-2048) p-8 text-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
  >
    <template v-if="kind === 'win'">
      <p class="mb-2 inline-block rounded bg-ink-950 px-2.5 py-0.5 text-[0.72rem] font-bold tracking-wider text-mist-100 uppercase">
        Objetivo cumplido
      </p>
      <h2 class="m-0 mb-2 text-3xl font-extrabold tracking-tight">¡Llegaste a 2048! 🎉</h2>
      <p class="m-0 mb-6 text-sm opacity-90">
        {{ score }} puntos · {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}
      </p>
      <div class="flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          class="rounded-md border border-ink-500 bg-ink-800 px-6 py-3 text-base font-extrabold text-mist-100 transition hover:border-mist-500"
          @click="emit('restart')"
        >
          ↺ Reiniciar
        </button>
        <button
          type="button"
          class="rounded-md border border-orange-300 bg-orange-500 px-6 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
          @click="emit('continue')"
        >
          ∞ Modo infinito →
        </button>
      </div>
    </template>
    <template v-else>
      <p class="mb-2 inline-block rounded bg-ink-950 px-2.5 py-0.5 text-[0.72rem] font-bold tracking-wider text-mist-100 uppercase">
        Sin movimientos
      </p>
      <h2 class="m-0 mb-2 text-3xl font-extrabold tracking-tight">Partida terminada</h2>
      <p class="m-0 mb-6 text-sm opacity-90">
        {{ score }} puntos · {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}
      </p>
      <button
        type="button"
        class="rounded-md border border-orange-300 bg-orange-500 px-6 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
        @click="emit('restart')"
      >
        ↺ Reiniciar →
      </button>
    </template>
  </section>
</template>
