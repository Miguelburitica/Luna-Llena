<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { roleArtClassOf } from '@/shared/infrastructure/ui/roleArt'

defineProps<{ name: string; isWolf: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="vision ph-night" role="dialog" :aria-label="t('table.night.resultFor', { name })">
    <span class="t-cap t-muted">{{ t('table.night.resultFor', { name }) }}</span>
    <span class="rcard-art vision-art a-wobble" :class="roleArtClassOf(isWolf ? 'werewolf' : 'villager')" aria-hidden="true" />
    <b class="t-display vision-result" :class="isWolf ? 'team-wolf' : 'team-village'">
      {{ isWolf ? t('table.night.isWolf') : t('table.night.notWolf') }}
    </b>
    <button type="button" class="btn btn-secondary btn-lg vision-close" @click="emit('close')">
      <LunaIcon name="x" />{{ t('table.night.close') }}
    </button>
  </div>
</template>

<style scoped>
.vision {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 24px 16px;
  background: var(--bg-2);
  text-align: center;
}

.vision-art {
  width: 220px;
  height: 220px;
}

.vision-result {
  font-size: 44px;
  background: none;
}

.vision-close {
  margin-top: 12px;
}
</style>
