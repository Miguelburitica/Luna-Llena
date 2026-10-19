<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'

const HOLD_MS = 1000

defineProps<{ label: string; icon?: string }>()
const emit = defineEmits<{ held: [] }>()
const holding = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const release = () => {
  clearTimeout(timer)
  holding.value = false
}

const press = () => {
  release()
  holding.value = true
  timer = setTimeout(() => {
    holding.value = false
    emit('held')
  }, HOLD_MS)
}

onBeforeUnmount(release)
</script>

<template>
  <button
    type="button"
    class="btn btn-primary btn-lg btn-block hold"
    :class="{ 'is-holding': holding }"
    @pointerdown="press"
    @pointerup="release"
    @pointerleave="release"
    @pointercancel="release"
    @keydown.enter.prevent="press"
    @keyup.enter="release"
    @contextmenu.prevent
  >
    <span class="hold-fill" aria-hidden="true" />
    <LunaIcon :name="icon ?? 'hand'" />{{ label }}
  </button>
</template>

<style scoped>
.hold {
  position: relative;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.hold-fill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform: scaleX(0);
  background: rgba(255, 255, 255, 0.28);
  pointer-events: none;
}

.hold.is-holding .hold-fill {
  transform: scaleX(1);
  transition: transform 1s linear;
}
</style>
