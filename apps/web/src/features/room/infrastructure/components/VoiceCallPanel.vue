<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VoiceCallForm from '@/shared/infrastructure/ui/components/VoiceCallForm.vue'
import { useRoomAction } from '../../application/useRoomAction'
import { useRoomStore } from '../../application/useRoomStore'

defineProps<{ url: string | null; code: string }>()
const { t } = useI18n()
const store = useRoomStore()
const { failure, pending, run } = useRoomAction()

const failureText = computed(() => (failure.value === null ? null : t(`room.errors.${failure.value.code}`)))
</script>

<template>
  <section class="panel call-panel">
    <div class="panel-h">
      <h2 class="h3">{{ url === null ? t('voiceCall.add') : t('voiceCall.title') }}</h2>
    </div>
    <p v-if="url === null" class="t-small t-muted call-panel-hint">{{ t('voiceCall.hint') }}</p>
    <VoiceCallForm
      :url="url"
      :code="code"
      :pending="pending"
      :failure-text="failureText"
      @save="(next) => run(() => store.setVoiceCall(next))"
    />
  </section>
</template>

<style scoped>
.call-panel-hint {
  margin: 0 0 10px;
}
</style>
