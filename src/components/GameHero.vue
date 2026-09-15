<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  game: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <!-- Hero individual por juego: tarjeta grande clicable -->
  <RouterLink
    :to="game.route"
    class="relative flex min-h-[220px] items-center gap-6 overflow-hidden rounded-lg border-2 p-8 text-white no-underline shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] max-[560px]:flex-col max-[560px]:items-center max-[560px]:text-center"
    :style="{ backgroundColor: game.color, borderColor: game.borderColor }"
  >
    <div
      class="flex h-24 min-w-24 shrink-0 items-center justify-center rounded-md border-2 border-orange-300 bg-ink-950 px-3 text-[1.6rem] font-extrabold tracking-wide text-white"
      aria-hidden="true"
    >
      {{ game.monogram }}
    </div>
    <div class="flex flex-col items-start gap-1.5 max-[560px]:items-center">
      <div class="flex flex-wrap gap-1.5 max-[560px]:justify-center">
        <span
          v-for="tag in game.tags"
          :key="tag"
          class="rounded bg-ink-950 px-2.5 py-0.5 text-[0.72rem] font-bold tracking-wider text-white uppercase"
          >{{ tag }}</span
        >
      </div>
      <h2 class="m-0 text-[1.9rem] font-extrabold tracking-tight">{{ game.title }}</h2>
      <p class="m-0 font-semibold opacity-95">{{ game.short }}</p>
      <p class="m-0 text-[0.95rem] leading-relaxed opacity-85">{{ game.description }}</p>
      <span
        class="mt-3 inline-block rounded-md border border-orange-300 bg-orange-500 px-5 py-2.5 text-[0.95rem] font-bold text-white hover:bg-orange-600"
        >Jugar ahora →</span
      >
    </div>
  </RouterLink>
</template>
