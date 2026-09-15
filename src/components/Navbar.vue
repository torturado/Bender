<script setup>
import { RouterLink } from 'vue-router'
import { games } from '../data/games.js'
</script>

<template>
  <header
    class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink-700 bg-ink-950/85 px-6 py-3.5 backdrop-blur-md"
  >
    <RouterLink
      to="/"
      class="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white no-underline"
    >
      <span
        class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-sm font-extrabold text-white"
        aria-hidden="true"
        >BJ</span
      >
      <span>Bender Juegos</span>
    </RouterLink>

    <nav class="flex flex-wrap gap-1.5">
      <RouterLink
        to="/"
        class="nav-link inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium text-mist-300 no-underline transition-all hover:bg-ink-800 hover:text-white"
        active-class="active"
        exact
      >
        Inicio
      </RouterLink>
      <RouterLink
        v-for="game in games"
        :key="game.id"
        :to="game.route"
        class="nav-link inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium text-mist-300 no-underline transition-all hover:bg-ink-800 hover:text-white"
        active-class="active"
      >
        {{ game.title }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
/* Estado activo: se mantiene en CSS para que gane a :hover, como antes */
.nav-link.active {
  color: #fff;
  background: #f97316;
}
.nav-link.active:hover {
  background: #f97316;
}
</style>
