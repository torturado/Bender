<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import GameHero from '../components/GameHero.vue'
import { games } from '../data/games.js'
import { listSavedGames, saveFailed } from '../data/gameStorage.js'
import { dailyChallengeDate } from '../games/random.js'

const today = dailyChallengeDate()
const savedGames = listSavedGames()
const latestSaveByGame = computed(() => {
  const latest = new Map()
  for (const save of savedGames) {
    if (!latest.has(save.gameId)) latest.set(save.gameId, save)
  }
  return [...latest.values()]
})

function routeForSave(save) {
  const game = games.find((candidate) => candidate.id === save.gameId)
  if (!game) return '/'
  return save.dailyDate ? { path: game.route, query: { daily: save.dailyDate } } : game.route
}
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

    <section v-if="latestSaveByGame.length" class="mb-8" aria-labelledby="continue-heading">
      <h2 id="continue-heading" class="mb-3 text-lg font-extrabold text-mist-100">Continúa jugando</h2>
      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="save in latestSaveByGame"
          :key="`${save.gameId}:${save.dailyDate ?? 'normal'}`"
          :to="routeForSave(save)"
          class="min-h-11 rounded-lg border border-ink-500 bg-ink-900 px-4 py-2 text-sm font-bold text-mist-100 no-underline transition hover:border-orange-400 hover:bg-ink-800"
        >
          Continuar {{ games.find((game) => game.id === save.gameId)?.title }}
          <span v-if="save.dailyDate" class="font-normal text-mist-400">· reto {{ save.dailyDate }}</span>
          <span v-else class="font-normal text-mist-400">· {{ save.moves }} movimiento{{ save.moves === 1 ? '' : 's' }}</span>
        </RouterLink>
      </div>
    </section>
    <p v-if="saveFailed" class="mb-6 text-center text-sm font-bold text-danger-fg" role="status">
      No se pudo acceder al almacenamiento local. Las partidas no se pueden guardar ahora.
    </p>

    <section class="mb-8 rounded-lg border border-ink-600 bg-ink-900 p-4 sm:p-5" aria-labelledby="daily-heading">
      <div class="mb-3">
        <h2 id="daily-heading" class="m-0 text-lg font-extrabold text-mist-100">Reto diario · {{ today }}</h2>
        <p class="m-0 mt-1 text-sm text-mist-400">Elige un juego y comparte el enlace para comparar el mismo tablero.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="game in games"
          :key="game.id"
          :to="{ path: game.route, query: { daily: today } }"
          class="min-h-11 rounded-md border border-accent-line bg-accent-soft px-3 py-2 text-sm font-bold text-accent-fg no-underline transition hover:bg-ink-800"
        >
          Jugar {{ game.title }}
        </RouterLink>
      </div>
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
