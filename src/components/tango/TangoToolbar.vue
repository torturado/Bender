<script setup>
defineProps({
  canUndo: { type: Boolean, default: false },
  moves: { type: Number, default: 0 },
})

const emit = defineEmits(['restart', 'undo', 'new-game'])
</script>

<template>
  <div class="mx-auto mb-5 grid w-full max-w-[560px] grid-cols-3 gap-2">
    <button type="button" class="btn-ghost btn-compact w-full" @click="emit('restart')">
      Reiniciar
    </button>
    <button
      type="button"
      class="btn-ghost btn-compact w-full"
      :disabled="!canUndo"
      @click="emit('undo')"
    >
      Deshacer
    </button>
    <button type="button" class="btn-ink btn-compact w-full" @click="emit('new-game')">
      <span class="sm:hidden">Nueva</span>
      <span class="hidden sm:inline">Otra partida</span>
    </button>
    <span v-if="moves > 0" class="anim-fade-up caption col-span-3 text-center">
      {{ moves }} movimiento{{ moves === 1 ? '' : 's' }}
    </span>
  </div>
</template>
