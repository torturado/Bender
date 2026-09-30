import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export function useGameTimer() {
  const elapsedBaseMs = ref(0)
  const displayedSeconds = ref(0)
  let active = false
  let segmentStartedAt = null
  let intervalId = null

  function elapsedMs() {
    return Math.max(
      0,
      elapsedBaseMs.value + (segmentStartedAt === null ? 0 : performance.now() - segmentStartedAt),
    )
  }

  function refresh() {
    displayedSeconds.value = Math.floor(elapsedMs() / 1000)
  }

  function resume() {
    if (!active || segmentStartedAt !== null || document.hidden) return
    segmentStartedAt = performance.now()
    refresh()
  }

  function pause() {
    if (segmentStartedAt !== null) {
      elapsedBaseMs.value += performance.now() - segmentStartedAt
      segmentStartedAt = null
    }
    refresh()
  }

  function onVisibilityChange() {
    if (document.hidden) pause()
    else resume()
  }

  function start(initialElapsedMs = 0) {
    elapsedBaseMs.value = Math.max(0, initialElapsedMs)
    active = true
    segmentStartedAt = null
    resume()
    refresh()
  }

  function stop() {
    pause()
    active = false
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    intervalId = window.setInterval(refresh, 500)
    resume()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (intervalId !== null) window.clearInterval(intervalId)
    pause()
  })

  return {
    seconds: computed(() => displayedSeconds.value),
    elapsedMs,
    start,
    stop,
  }
}
