<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useFlash } from '../../application/useFlash'
import { useMatchStore } from '../../application/useMatchStore'
import { FLICKER_MS, GHOST_TOAST_MS } from '../../domain/ghosts'

type Flicker = 'lights' | 'toast'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const { t } = useI18n()
const match = useMatchStore()
const lights = useFlash<Flicker>(FLICKER_MS)
const toast = useFlash<Flicker>(GHOST_TOAST_MS)
const flickers = computed(() => match.hauntEffects.filter((effect) => effect.kind === 'flicker'))

const prefersReducedMotion = (): boolean =>
  document.querySelector('.reduced') !== null ||
  (typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches)

watch(
  () => flickers.value.length,
  (count, before) => {
    if (count <= before) return
    if (prefersReducedMotion()) toast.show('toast')
    else lights.show('lights')
  }
)
</script>

<template>
  <div v-if="lights.current.value" class="flicker flicker-screen" aria-hidden="true" />
  <div v-if="toast.current.value" class="toast flicker-toast" role="status">
    <LunaIcon name="ghost" />{{ t('match.ghost.flickered') }}
  </div>
</template>

<style scoped>
.flicker-screen {
  position: fixed;
  animation-iteration-count: 1;
}

.flicker-toast {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 50;
  max-width: 420px;
  margin: 0 auto;
}
</style>
