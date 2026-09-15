<script setup>
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Menú de inicio global -->
    <Navbar />

    <!-- Aquí se renderiza Inicio o cada juego según la ruta -->
    <RouterView />

    <footer
      class="mt-auto border-t border-ink-600 px-6 py-6 text-center text-sm text-mist-400"
    >
      <p class="m-0">Bender Juegos</p>
    </footer>
  </div>
</template>
