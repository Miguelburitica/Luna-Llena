<script setup lang="ts" generic="T extends string | number">
const selected = defineModel<T>({ required: true })
defineProps<{ options: ReadonlyArray<{ value: T; label: string }>; label: string }>()
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === selected"
      :class="{ 'is-on': option.value === selected }"
      @click="selected = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
