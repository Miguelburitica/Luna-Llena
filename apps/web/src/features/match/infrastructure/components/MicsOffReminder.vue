<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { MICS_KEY_PREFIX } from '../matchMemory'

const isDismissed = (value: unknown): value is true => value === true

const props = defineProps<{ code: string; round: number }>()
const { t } = useI18n()

const dismissedKey = computed(() => `${MICS_KEY_PREFIX}${props.code}.${props.round}`)
const dismissed = ref(readStored(dismissedKey.value, isDismissed, 'tab') === true)

const dismiss = () => {
  writeStored(dismissedKey.value, true, 'tab')
  dismissed.value = true
}
</script>

<template>
  <div v-if="!dismissed" class="toast mics-off" role="status">
    <LunaIcon name="moon" />
    <span class="mics-off-text">{{ t('voiceCall.micsOff') }}</span>
    <button type="button" class="btn btn-ghost btn-sm" @click="dismiss">{{ t('voiceCall.micsOffDismiss') }}</button>
  </div>
</template>

<style scoped>
.mics-off {
  margin: 8px 12px 0;
}

.mics-off-text {
  flex: 1;
}
</style>
