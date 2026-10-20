<script setup lang="ts">
import { CHAT_LIMITS, type ChatChannel } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useChatStore } from '../../application/useChatStore'
import { charactersLeft } from '../../domain/composer'

const props = defineProps<{ channel: ChatChannel; placeholder: string; label: string }>()
const { t } = useI18n()
const chat = useChatStore()
const draft = ref('')
const sending = ref(false)

const blank = computed(() => draft.value.trim() === '')
const left = computed(() => charactersLeft(draft.value))

const submit = async () => {
  if (blank.value || sending.value) return
  sending.value = true
  const result = await chat.send(props.channel, draft.value)
  sending.value = false
  if (result.ok) draft.value = ''
}
</script>

<template>
  <div class="chat-composer">
    <form class="composer" @submit.prevent="submit">
      <slot />
      <input
        v-model="draft"
        class="input"
        type="text"
        autocomplete="off"
        :maxlength="CHAT_LIMITS.maxMessageLength"
        :placeholder="placeholder"
        :aria-label="label"
      />
      <span
        v-if="left !== null"
        class="t-small chat-composer-count"
        :class="{ err: left === 0 }"
        aria-live="polite"
        :aria-label="t('chat.composer.left', { count: left })"
      >{{ left }}</span>
      <button type="submit" class="btn btn-icon btn-primary" :disabled="blank || sending" :aria-label="t('chat.composer.send')">
        <LunaIcon name="send" />
      </button>
    </form>
    <span v-if="chat.failure" class="err chat-composer-error" role="alert">
      <LunaIcon name="info" size="sm" />{{ t(`chat.errors.${chat.failure.code}`, { max: CHAT_LIMITS.maxMessageLength }) }}
    </span>
  </div>
</template>

<style scoped>
.chat-composer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.composer .input {
  flex: 1;
  min-width: 0;
}

.chat-composer-count {
  flex: none;
  min-width: 2ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.chat-composer-count.err {
  color: var(--warn);
}

.chat-composer-error {
  padding-left: 8px;
}
</style>
