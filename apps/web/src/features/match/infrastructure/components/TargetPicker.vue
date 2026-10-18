<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { Target } from '../../domain/night'

defineProps<{ targets: readonly Target[]; selectedId: string | null; disabled?: boolean }>()
const emit = defineEmits<{ pick: [id: string] }>()
const { t } = useI18n()
</script>

<template>
  <div class="picker">
    <button
      v-for="target in targets"
      :key="target.seat.id"
      type="button"
      class="pick"
      :class="{ 'is-sel': target.seat.id === selectedId }"
      :disabled="disabled || target.blocked !== null"
      :aria-pressed="target.seat.id === selectedId"
      @click="emit('pick', target.seat.id)"
    >
      <LunaAvatar :avatar="target.seat.avatar" :name="target.seat.name" />
      <span class="pick-name">{{ target.seat.isYou ? t('match.table.you') : target.seat.name }}</span>
      <span v-if="target.blocked" class="why">{{ t(`match.night.why.${target.blocked}`) }}</span>
      <span v-if="target.seat.id === selectedId" class="chk"><LunaIcon name="check" size="sm" /></span>
      <slot name="extra" :target="target" />
    </button>
  </div>
</template>
