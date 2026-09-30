<script setup>
import GameHero from '../components/GameHero.vue'
import { games } from '../data/games.js'
</script>

<template>
  <main class="mx-auto w-full max-w-[1200px] px-6 pt-10 pb-16">
    <section class="relative mb-16 flex items-end justify-between gap-10">
      <div class="max-w-xl">
        <h1 class="hero-title m-0 text-ink">Elige tu juego</h1>
        <p class="m-0 mt-4 max-w-md text-base text-stone">Pulsa una tarjeta para jugar.</p>
      </div>
      <div class="ghost-layer" aria-hidden="true">
        <span v-for="game in games" :key="game.id">{{ game.title }}</span>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 min-[1200px]:grid-cols-4">
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

<style scoped>
.hero-title {
  font-size: clamp(40px, 7vw, 56px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.018em;
}

.ghost-layer {
  display: none;
  flex-direction: column;
  align-items: flex-end;
  color: var(--color-ink);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.018em;
  opacity: 0.1;
  pointer-events: none;
  user-select: none;
}

@media (min-width: 1280px) {
  .ghost-layer {
    display: flex;
  }
}
</style>
