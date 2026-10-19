<script setup lang="ts">
import type { AvatarId } from '@luna/contracts'
import { computed } from 'vue'

const props = defineProps<{
  avatar: AvatarId | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  you?: boolean
  offline?: boolean
  ring?: string
  bot?: boolean
}>()

const initials = computed(() =>
  props.name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
)
</script>

<template>
  <span
    class="av"
    :class="[size && `av-${size}`, { 'is-you': you, 'is-off': offline }]"
    :style="ring ? { '--ring': ring } : undefined"
  >
    <span v-if="avatar" class="face" :class="`f-${avatar}`" role="img" :aria-label="name" />
    <span v-else class="face is-initials" role="img" :aria-label="name">{{ initials }}</span>
    <span v-if="bot" class="bot-tag">BOT</span>
    <slot />
  </span>
</template>
