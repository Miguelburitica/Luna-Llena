<script setup lang="ts">
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'

withDefaults(defineProps<{ icon?: string; tone?: 'ok' | 'info' }>(), { icon: 'check', tone: 'ok' })
</script>

<template>
  <div class="dock-note" :class="`is-${tone}`" role="status">
    <LunaIcon :name="icon" size="sm" /><span><slot /></span>
  </div>
</template>

<style scoped>
.dock-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  font: 700 13px var(--font-ui);
}

.is-ok {
  background: rgba(95, 211, 154, 0.12);
  color: #8fe6bc;
}

.is-info {
  background: var(--surface-2);
  color: var(--muted);
}
</style>
