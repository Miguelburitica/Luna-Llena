<script setup lang="ts">
import { computed } from 'vue'
import { clockText, isTimerWarning, timerProgress } from '../../domain/phases'

const RING_CIRCUMFERENCE = 138.2

const props = defineProps<{ seconds: number | null; totalSeconds: number }>()

const offset = computed(() => RING_CIRCUMFERENCE * (1 - timerProgress(props.seconds ?? 0, props.totalSeconds)))
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
