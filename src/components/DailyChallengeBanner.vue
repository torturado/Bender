<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  date: { type: String, required: true },
  gameTitle: { type: String, required: true },
})

const shareMessage = ref('')

const formattedDate = computed(() => new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${props.date}T00:00:00.000Z`)))

async function shareChallenge() {
  shareMessage.value = ''
  const title = `Reto diario de ${props.gameTitle}`
  const text = `${title} · ${formattedDate.value}`
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href })
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href)
      shareMessage.value = 'Enlace copiado.'
    } else {
      shareMessage.value = 'Copia el enlace desde la barra de direcciones para compartir el mismo tablero.'
    }
  } catch (error) {
    if (error?.name !== 'AbortError') shareMessage.value = 'No se pudo compartir el enlace.'
  }
}
</script>

<template>
  <aside class="mx-auto mb-4 flex w-full max-w-[560px] flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-line bg-accent-soft px-4 py-3">
    <div>
      <p class="m-0 text-sm font-extrabold text-accent-fg">Reto diario · {{ formattedDate }}</p>
      <p class="m-0 mt-0.5 text-xs text-mist-300">El mismo enlace genera el mismo tablero.</p>
    </div>
    <button
      type="button"
      class="min-h-11 rounded-md border border-accent-line px-3 py-2 text-sm font-bold text-accent-fg transition hover:bg-ink-800"
      @click="shareChallenge"
    >
      Compartir reto
    </button>
    <span v-if="shareMessage" class="w-full text-xs text-mist-300" role="status">{{ shareMessage }}</span>
  </aside>
</template>
