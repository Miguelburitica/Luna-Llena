<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { providerOf } from '@/shared/domain/voiceCall'
import LunaIcon from './LunaIcon.vue'

const props = defineProps<{ url: string; compact?: boolean; iconOnly?: boolean }>()
const { t } = useI18n()

const label = computed(() => t(`voiceCall.join.${providerOf(props.url)}`))

const variant = computed(() => {
  if (props.iconOnly) return 'btn-icon btn-secondary'
  return props.compact ? 'btn-sm btn-secondary' : 'btn-primary'
})
</script>

<template>
  <a
    class="btn join-call"
    :class="variant"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="iconOnly ? label : undefined"
    :title="iconOnly ? label : undefined"
  >
    <LunaIcon name="phone" :size="iconOnly ? undefined : 'sm'" />
    <template v-if="!iconOnly">{{ label }}</template>
  </a>
</template>
