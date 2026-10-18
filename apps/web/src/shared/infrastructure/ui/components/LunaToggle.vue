<script setup lang="ts">
const enabled = defineModel<boolean>({ required: true })
defineProps<{ label: string; disabled?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="toggle"
    :class="{ 'is-on': enabled }"
    role="switch"
    :aria-checked="enabled"
    :aria-label="label"
    :disabled="disabled"
    @click="enabled = !enabled"
  />
</template>
