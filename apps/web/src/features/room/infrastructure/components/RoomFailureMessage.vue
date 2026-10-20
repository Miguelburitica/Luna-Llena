<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import type { RoomFailure } from '../../application/ports'

const props = defineProps<{ failure: RoomFailure; name?: string }>()
const { t, locale } = useI18n()

const until = computed(() =>
  'until' in props.failure
    ? new Date(props.failure.until).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
    : ''
)
</script>

<template>
  <span class="err" role="alert">
    <LunaIcon name="info" size="sm" />{{ t(`room.errors.${failure.code}`, { name, until }) }}
  </span>
</template>
