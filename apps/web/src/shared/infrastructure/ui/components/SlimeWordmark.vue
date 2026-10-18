<script setup lang="ts">
withDefaults(defineProps<{ tag?: 'h1' | 'b'; size?: 'hero' | 'desk' }>(), { tag: 'h1', size: 'hero' })

const drips = [
  { x: 14, length: 22, width: 9, delay: '0s' },
  { x: 38, length: 34, width: 11, delay: '.8s' },
  { x: 61, length: 16, width: 8, delay: '1.6s' },
  { x: 86, length: 28, width: 10, delay: '.4s' },
  { x: 112, length: 40, width: 12, delay: '1.2s' },
  { x: 140, length: 20, width: 9, delay: '2s' },
  { x: 166, length: 30, width: 10, delay: '.6s' },
  { x: 188, length: 18, width: 8, delay: '1.4s' }
]

const dripPath = (x: number, length: number, width: number): string => {
  const half = width / 2
  return `M${x - half} 0 C${x - half} ${length * 0.6} ${x - half - 1} ${length} ${x} ${length} C${x + half + 1} ${length} ${x + half} ${length * 0.6} ${x + half} 0Z`
}
</script>

<template>
  <component :is="tag" class="wordmark" :class="`wordmark-${size}`">
    <span class="wordmark-line wordmark-luna">Luna</span> <span class="wordmark-line wordmark-llena">Llena</span>
    <svg class="wordmark-drips" viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden="true">
      <path
        v-for="drip in drips"
        :key="drip.x"
        class="wordmark-drip"
        :d="dripPath(drip.x, drip.length, drip.width)"
        :style="{ animationDelay: drip.delay }"
      />
    </svg>
  </component>
</template>

<style scoped>
.wordmark {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  font-family: var(--font-logo);
  font-weight: 400;
  letter-spacing: 0.03em;
  color: var(--slime);
  paint-order: stroke fill;
  -webkit-text-stroke: 0.16em var(--outline);
  text-shadow: 0 0.09em 0 var(--outline);
  line-height: 0.92;
  text-align: center;
}

.wordmark-line {
  display: block;
  position: relative;
  z-index: 1;
}

.wordmark-luna {
  transform: rotate(-4deg);
  color: var(--bubblegum);
}

.wordmark-llena {
  transform: rotate(2deg);
}

.wordmark-drips {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -0.42em;
  width: 84%;
  height: 0.6em;
  overflow: visible;
  fill: var(--slime);
  stroke: var(--outline);
  stroke-width: 3.5px;
  vector-effect: non-scaling-stroke;
}

.wordmark-hero {
  font-size: 66px;
}

.wordmark-desk {
  flex-direction: row;
  gap: 0.25em;
  font-size: 24px;
  -webkit-text-stroke: 0.14em var(--outline);
}

.wordmark-desk .wordmark-drips {
  bottom: -0.3em;
  height: 0.45em;
}
</style>
