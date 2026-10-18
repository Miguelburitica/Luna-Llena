<script setup lang="ts">
defineProps<{ name: string; size?: 'sm' | 'lg' | 'xl' }>()
</script>

<template>
  <span class="i" :class="[`i-${name}`, size && `i-${size}`]" aria-hidden="true" />
</template>
