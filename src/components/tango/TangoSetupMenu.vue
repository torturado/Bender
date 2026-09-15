<script setup>
import { ref } from 'vue'
import { SIZES, DIFFICULTIES } from '../../games/tango/constants.js'

const emit = defineEmits(['play'])

const size = ref(6)
const difficulty = ref('media')

function play() {
  emit('play', { size: size.value, difficulty: difficulty.value })
}
</script>

<template>
  <section class="mx-auto w-full max-w-xl rounded-lg border border-ink-500 bg-ink-900 p-6 sm:p-8">
    <h2 class="m-0 text-xl font-extrabold tracking-tight text-white">Configura tu partida</h2>
    <p class="mt-1 mb-6 text-sm text-mist-400">
      Elige tamaño y dificultad. Cada partida genera un tablero distinto.
    </p>

    <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">
      Medida del tablero
    </p>
    <div class="mb-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Medida del tablero">
      <button
        v-for="s in SIZES"
        :key="s"
        type="button"
        :aria-pressed="size === s"
        :class="[
          'min-h-[44px] rounded-md border px-3 py-2.5 text-sm font-bold transition',
          size === s
            ? 'border-orange-400 bg-orange-500 text-white'
            : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-white',
        ]"
        @click="size = s"
      >
        {{ s }}×{{ s }}
      </button>
    </div>

    <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">Dificultad</p>
    <div class="mb-8 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Dificultad">
      <button
        v-for="d in DIFFICULTIES"
        :key="d.id"
        type="button"
        :aria-pressed="difficulty === d.id"
        :class="[
          'min-h-[44px] rounded-md border px-3 py-2.5 text-sm font-bold transition',
          difficulty === d.id
            ? 'border-orange-400 bg-orange-500 text-white'
            : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-white',
        ]"
        @click="difficulty = d.id"
      >
        {{ d.label }}
      </button>
    </div>

    <button
      type="button"
      class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-white transition hover:bg-orange-600"
      @click="play"
    >
      Jugar
    </button>
    <p class="mt-3 mb-0 text-center text-xs text-mist-400">
      Fácil deja más soles y lunas iniciales · Difícil deja menos
    </p>
  </section>
</template>
