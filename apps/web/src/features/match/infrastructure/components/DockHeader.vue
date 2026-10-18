<script setup lang="ts">
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'

defineProps<{ icon: string; title: string; iconColor?: string }>()
</script>

<template>
  <div class="dock-head">
    <LunaIcon :name="icon" :style="iconColor ? { color: iconColor } : { color: 'var(--accent)' }" />
    <span class="h3 dock-head-title">{{ title }}</span>
    <slot />
  </div>
</template>

<style scoped>
.dock-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dock-head-title {
  flex: 1;
}
</style>
