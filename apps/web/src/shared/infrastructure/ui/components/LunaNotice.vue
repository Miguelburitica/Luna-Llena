<script setup lang="ts">
import LunaIcon from './LunaIcon.vue'

defineProps<{ icon: string; title: string; tone?: 'warn' }>()
</script>

<template>
  <main class="phone ph-night notice-page">
    <section class="notice" :class="{ 'is-warn': tone === 'warn' }">
      <span class="notice-icon"><LunaIcon :name="icon" size="xl" /></span>
      <h1 class="h2">{{ title }}</h1>
      <div class="t-small t-muted notice-body"><slot /></div>
      <div class="notice-actions"><slot name="actions" /></div>
    </section>
  </main>
</template>

<style scoped>
.notice-page {
  justify-content: center;
  padding: 20px;
}

.notice {
  border-radius: 26px;
  background: linear-gradient(180deg, #14173a, #1f2350);
  box-shadow: inset 0 0 0 1px rgba(233, 230, 255, 0.12);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  min-height: 380px;
}

.notice-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 235, 200, 0.08);
  color: var(--moon);
  margin-bottom: 6px;
}

.is-warn .notice-icon {
  color: #ff9c92;
}

.notice-body {
  margin: 0;
}

.notice-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
</style>
