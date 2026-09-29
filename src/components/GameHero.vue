<script setup>
defineProps({
  game: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink
    :to="game.route"
    class="flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 p-4 text-center text-white no-underline shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(0,0,0,0.32)] light:shadow-[0_10px_28px_rgba(30,24,48,0.12)] light:hover:shadow-[0_16px_32px_rgba(30,24,48,0.18)] sm:min-h-[210px] sm:p-5"
    :style="{ backgroundColor: game.color, borderColor: game.borderColor }"
  >
    <div
      class="inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-lg border-2 border-orange-300 bg-ink-950 px-2 text-lg font-extrabold tracking-wide text-mist-100 sm:h-14 sm:min-w-14 sm:text-xl"
      aria-hidden="true"
    >
      {{ game.monogram }}
    </div>

    <h2 class="mb-0 mt-4 text-[1.3rem] leading-tight font-extrabold sm:text-2xl">
      {{ game.title }}
    </h2>
  </RouterLink>
</template>
