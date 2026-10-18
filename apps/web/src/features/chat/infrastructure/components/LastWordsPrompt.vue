<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { clockText } from '@/features/match/domain/phases'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useLastWords } from '../../application/useLastWords'
import ChatComposer from './ChatComposer.vue'

const { t } = useI18n()
const { prompt } = useLastWords()
</script>

<template>
  <div v-if="prompt" class="chat-prompt">
    <section class="dock" role="alert">
      <div class="chat-prompt-head">
        <LunaIcon name="feather" />
        <h2 class="h3 chat-prompt-title">{{ t('chat.lastWords.promptTitle') }}</h2>
        <span class="sbadge" role="timer" :aria-label="t('chat.lastWords.timer')">{{ clockText(prompt.secondsLeft) }}</span>
      </div>
      <p class="t-small t-muted chat-prompt-hint">{{ t('chat.lastWords.promptHint') }}</p>
      <ChatComposer
        channel="village"
        :placeholder="t('chat.lastWords.promptPlaceholder')"
        :label="t('chat.lastWords.promptLabel')"
      />
    </section>
  </div>
</template>

<style scoped>
.chat-prompt {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 12px;
  max-width: 480px;
  margin: 0 auto;
  z-index: 60;
}

.chat-prompt-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-prompt-title {
  flex: 1;
}

.chat-prompt-hint {
  margin: 4px 0 10px;
}
</style>
