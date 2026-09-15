<script setup>
import GameHero from '../components/GameHero.vue'
import { games } from '../data/games.js'
</script>

<template>
  <main class="mx-auto w-full max-w-[1100px] px-6 pt-12 pb-16">
    <!-- Hero principal de la web -->
    <section class="mb-10 text-center">
      <p
        class="mb-4 inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-[0.85rem] font-bold text-orange-400"
      >
        Puzzles y clásicos
      </p>
      <h1
        class="m-0 mb-2.5 text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold tracking-tight text-white"
      >
        Elige tu juego
      </h1>
      <p class="m-0 text-lg text-mist-400">
        Pulsa una tarjeta para jugar.
      </p>
    </section>

    <!-- Los 4 heroes de acceso a los juegos -->
    <section class="grid grid-cols-1 gap-5 min-[820px]:grid-cols-2">
      <GameHero v-for="game in games" :key="game.id" :game="game" />
    </section>
  </main>
</template>
