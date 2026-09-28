<!-- Contenedor de una fase de juego (configuración, jugando, victoria).

     Solo aporta la caja y la clase de fase; el encadenado lo hace el
     <Transition> de la vista. El hijo puede ser un fragmento: aquí
     dentro no hay transición, así que da igual cuántos elementos haya. -->
<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <div class="game-phase" :class="`game-phase--${variant}`">
    <slot />
  </div>
</template>
