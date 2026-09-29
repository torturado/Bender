<script setup>
import { setThemePreference, themePreference } from '../theme.js'

defineProps({
  // Riel lateral contraído: solo iconos, apilados.
  compact: { type: Boolean, default: false },
})

const options = [
  { id: 'light', label: 'Claro', title: 'Tema claro' },
  { id: 'dark', label: 'Oscuro', title: 'Tema oscuro' },
  { id: 'system', label: 'Sistema', title: 'Tema del sistema' },
]
</script>

<template>
  <div
    role="group"
    aria-label="Tema"
    class="rounded-lg border border-ink-600 bg-ink-950 p-1"
    :class="compact ? 'flex flex-col gap-1' : 'grid grid-cols-3 gap-1'"
  >
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="inline-flex items-center justify-center rounded-md text-xs font-bold transition-colors"
      :class="[
        compact ? 'h-9 w-9' : 'min-h-11 flex-col gap-1 px-1 py-1.5',
        themePreference === option.id
          ? 'bg-ink-700 text-mist-100 ring-1 ring-mist-500'
          : 'text-mist-400 hover:text-mist-100',
      ]"
      :aria-pressed="themePreference === option.id"
      :aria-label="compact ? option.title : undefined"
      :title="compact ? option.title : undefined"
      @click="setThemePreference(option.id)"
    >
      <svg
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="option.id === 'light'">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </template>
        <path v-else-if="option.id === 'dark'" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        <template v-else>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </template>
      </svg>
      <span v-if="!compact">{{ option.label }}</span>
    </button>
  </div>
</template>
