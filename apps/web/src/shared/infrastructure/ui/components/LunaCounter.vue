<script setup lang="ts">
const count = defineModel<number>({ required: true })
const props = defineProps<{ min: number; max: number; fewerLabel: string; moreLabel: string }>()

const change = (step: number) => {
  count.value = Math.min(props.max, Math.max(props.min, count.value + step))
}
</script>

<template>
  <div class="counter">
    <button type="button" :aria-label="fewerLabel" :disabled="count <= min" @click="change(-1)">
      <span class="i i-minus" aria-hidden="true" />
    </button>
    <output>{{ count }}</output>
    <button type="button" :aria-label="moreLabel" :disabled="count >= max" @click="change(1)">
      <span class="i i-plus" aria-hidden="true" />
    </button>
  </div>
</template>
