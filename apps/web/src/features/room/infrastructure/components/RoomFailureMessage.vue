<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { RoomFailure } from '../../application/ports'

defineProps<{ failure: RoomFailure; name?: string }>()
const { t } = useI18n()
</script>

<template>
  <span class="err" role="alert">
    <LunaIcon name="info" size="sm" />{{ t(`room.errors.${failure.code}`, { name }) }}
  </span>
</template>
