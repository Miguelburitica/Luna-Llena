<script setup lang="ts">
import SlimeWordmark from './SlimeWordmark.vue'

defineProps<{ trail: string }>()
</script>

<template>
  <header class="desk-header">
    <span class="art f-logo desk-logo" aria-hidden="true" />
    <SlimeWordmark tag="b" size="desk" class="desk-brand" />
    <span class="t-muted desk-trail">/ {{ trail }}</span>
    <div class="desk-actions"><slot /></div>
  </header>
</template>

<style scoped>
.desk-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 32px;
  border-bottom: 3px solid var(--outline);
  box-shadow: 0 3px 0 var(--tint-line);
  flex-wrap: wrap;
}

.desk-logo {
  width: 46px;
  height: 46px;
}

.desk-brand {
  margin-bottom: 6px;
}

.desk-trail {
  font-size: 14px;
}

.desk-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 420px) {
  .desk-header {
    padding: 12px 16px;
  }
}
</style>
