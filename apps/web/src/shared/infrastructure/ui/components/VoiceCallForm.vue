<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ROOM_LIMITS } from '@luna/contracts'
import { freeCallFor } from '@/shared/domain/voiceCall'
import JoinCallButton from './JoinCallButton.vue'
import LunaIcon from './LunaIcon.vue'

const props = defineProps<{ url: string | null; code: string; pending?: boolean; failureText?: string | null }>()
const emit = defineEmits<{ save: [url: string | null] }>()
const { t } = useI18n()

const draft = ref(props.url ?? '')
watch(
  () => props.url,
  (current) => (draft.value = current ?? '')
)

const trimmed = computed(() => draft.value.trim())
const changed = computed(() => trimmed.value !== (props.url ?? ''))

const save = () => {
  if (changed.value && props.pending !== true) emit('save', trimmed.value === '' ? null : trimmed.value)
}

const remove = () => {
  draft.value = ''
  emit('save', null)
}
</script>

<template>
  <form class="call-form" @submit.prevent="save">
    <label class="field">
      <span class="label">{{ t('voiceCall.title') }}</span>
      <input
        v-model="draft"
        class="input"
        :class="{ 'is-err': failureText }"
        type="text"
        inputmode="url"
        autocomplete="off"
        :maxlength="ROOM_LIMITS.maxVoiceCallUrlLength"
        :placeholder="t('voiceCall.placeholder')"
        :aria-invalid="Boolean(failureText)"
      >
    </label>
    <span v-if="failureText" class="err" role="alert"><LunaIcon name="info" size="sm" />{{ failureText }}</span>
    <div class="call-form-actions">
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!changed || pending">{{ t('voiceCall.save') }}</button>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="url === null || pending" @click="remove">
        {{ t('voiceCall.remove') }}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" @click="draft = freeCallFor(code)">
        <LunaIcon name="phone" size="sm" />{{ t('voiceCall.free') }}
      </button>
    </div>
    <JoinCallButton v-if="url" :url="url" compact />
  </form>
</template>

<style scoped>
.call-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.call-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
