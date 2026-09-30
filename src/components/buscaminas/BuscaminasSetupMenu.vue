<script setup>
import { SIZES, DIFFICULTIES, minesFor } from '../../games/buscaminas/constants.js'

const props = defineProps({
  size: { type: Number, required: true },
  difficulty: { type: String, required: true },
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'update:size', 'update:difficulty'])

function play() {
  emit('play', { size: props.size, difficulty: props.difficulty })
}
</script>

<template>
  <section class="mx-auto w-full max-w-xl rounded-lg border border-ink-500 bg-ink-900 p-6 sm:p-8">
    <h2 class="m-0 text-xl font-extrabold tracking-tight text-mist-100">Configura tu partida</h2>
    <p class="mt-1 mb-6 text-sm text-mist-400">
      {{ locked ? 'La configuración del reto diario es la misma para todas las personas.' : 'Elige tamaño y dificultad. Cada partida esconde las minas en otro sitio.' }}
    </p>

    <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">
      Medida del tablero
    </p>
    <div class="mb-6 grid grid-cols-3 gap-2" role="group" aria-label="Medida del tablero">
      <button
        v-for="s in SIZES"
        :key="s"
        type="button"
        :aria-pressed="props.size === s"
        :disabled="locked"
        :class="[
          'min-h-[44px] rounded-md border px-3 py-2.5 text-sm font-bold transition',
          props.size === s
            ? 'border-orange-400 bg-orange-500 text-on-accent'
            : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-mist-100',
        ]"
        @click="emit('update:size', s)"
      >
        {{ s }}×{{ s }}
      </button>
    </div>

    <p class="mb-2 text-xs font-bold tracking-wider text-mist-300 uppercase">Dificultad</p>
    <div class="mb-8 grid grid-cols-3 gap-2" role="group" aria-label="Dificultad">
      <button
        v-for="d in DIFFICULTIES"
        :key="d.id"
        type="button"
        :aria-pressed="props.difficulty === d.id"
        :disabled="locked"
        :class="[
          'flex min-h-[44px] flex-col items-center justify-center rounded-md border px-3 py-2.5 transition',
          props.difficulty === d.id
            ? 'border-orange-400 bg-orange-500 text-on-accent'
            : 'border-ink-500 bg-ink-800 text-mist-300 hover:border-mist-500 hover:text-mist-100',
        ]"
        @click="emit('update:difficulty', d.id)"
      >
        <span class="text-sm font-bold">{{ d.label }}</span>
        <span class="text-[11px] opacity-80">💣 {{ minesFor(props.size, d.id) }}</span>
      </button>
    </div>

    <button
      type="button"
      class="w-full rounded-md bg-orange-500 px-5 py-3 text-base font-extrabold text-on-accent transition hover:bg-orange-400"
      @click="play"
    >
      Jugar
    </button>
    <p class="mt-3 mb-0 text-center text-xs text-mist-400">
      {{ locked ? 'En el reto diario, empieza por el centro: esa zona protegida es igual para todos.' : 'La primera casilla que caves siempre es segura' }}
    </p>
  </section>
</template>
