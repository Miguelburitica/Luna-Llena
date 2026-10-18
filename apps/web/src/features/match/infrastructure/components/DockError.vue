<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useMatchStore } from '../../application/useMatchStore'

const { t } = useI18n()
const match = useMatchStore()
</script>

<template>
  <span v-if="match.failure" class="err dock-error" role="alert">
    <LunaIcon name="info" size="sm" />{{ t(`match.errors.${match.failure.code}`) }}
  </span>
</template>

<style scoped>
.dock-error {
  margin: 0 16px;
}
</style>
