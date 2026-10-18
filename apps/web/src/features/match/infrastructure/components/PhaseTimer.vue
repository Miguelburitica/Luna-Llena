<script setup lang="ts">
import { PHASE_TIMERS, type Phase } from '@luna/contracts'
import { computed } from 'vue'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { useCountdown } from '../../application/useCountdown'
import { clockText, isTimerWarning, timerProgress } from '../../domain/phases'

const RING_CIRCUMFERENCE = 138.2

const props = defineProps<{ phase: Phase }>()
const room = useRoomStore()
const seconds = useCountdown()

const configuredSeconds = computed(() => {
  const timer = PHASE_TIMERS[props.phase]
  return timer === undefined ? 0 : (room.snapshot?.settings.timers[timer] ?? 0)
})
const offset = computed(() => RING_CIRCUMFERENCE * (1 - timerProgress(seconds.value ?? 0, configuredSeconds.value)))
</script>

<template>
  <div v-if="seconds !== null" class="timer" :class="{ 'is-warn': isTimerWarning(seconds) }" role="timer">
    <svg viewBox="0 0 52 52" aria-hidden="true">
      <circle class="tr-track" cx="26" cy="26" r="22" />
      <circle class="tr-prog" cx="26" cy="26" r="22" :stroke-dasharray="RING_CIRCUMFERENCE" :stroke-dashoffset="offset" />
    </svg>
    <b>{{ clockText(seconds) }}</b>
  </div>
</template>
