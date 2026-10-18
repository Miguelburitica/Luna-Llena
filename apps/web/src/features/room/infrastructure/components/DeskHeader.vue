<script setup lang="ts">
defineProps<{ trail: string }>()
</script>

<template>
  <header class="desk-header">
    <span class="art f-logo desk-logo" aria-hidden="true" />
    <b class="t-display desk-brand">Luna Llena</b>
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
  border-bottom: 1px solid rgba(233, 230, 255, 0.1);
  flex-wrap: wrap;
}

.desk-logo {
  width: 40px;
  height: 40px;
}

.desk-brand {
  font-size: 22px;
  color: var(--moon);
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
</style>
