<script setup>
import GameHero from '../components/GameHero.vue'
import { games } from '../data/games.js'
</script>

<template>
  <main class="mx-auto w-full max-w-[1200px] px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-14">
    <section class="mb-7 text-center sm:mb-9">
      <h1
        class="m-0 mb-2 text-[clamp(2rem,5vw,3.25rem)] font-extrabold tracking-tight text-mist-100"
      >
        Elige tu juego
      </h1>
      <p class="m-0 text-base text-mist-400 sm:text-lg">Pulsa una tarjeta para jugar.</p>
    </section>

    <section
      class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 min-[1200px]:grid-cols-4 sm:gap-5"
    >
      <GameHero
        v-for="(game, index) in games"
        :key="game.id"
        :game="game"
        class="anim-fade-up"
        :style="{ animationDelay: `${index * 45}ms` }"
      />
    </section>
  </main>
</template>
