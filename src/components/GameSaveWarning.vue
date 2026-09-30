<script setup>
import { saveFailed } from '../data/gameStorage.js'
</script>

<template>
  <p
    v-if="saveFailed"
    class="board-alert mx-auto mb-4 w-full max-w-[560px] text-center text-sm font-bold text-danger-fg"
    role="status"
  >
    No se pudo guardar en este dispositivo. Puedes seguir jugando, pero quizá no recuperes estos cambios al volver.
  </p>
</template>
