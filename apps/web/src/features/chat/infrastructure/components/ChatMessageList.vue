<script setup lang="ts">
import type { ChatMessage } from '@luna/contracts'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { memberWithId } from '@/features/room/domain/lobby'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import LunaAvatar from '@/shared/infrastructure/ui/components/LunaAvatar.vue'
import { messageStyle } from '../../domain/messageStyle'

const props = defineProps<{ messages: readonly ChatMessage[]; monitor?: boolean }>()
const { t } = useI18n()
const room = useRoomStore()
const list = ref<HTMLElement | null>(null)

const whoOf = (message: ChatMessage, name: string): string => {
  const place = props.monitor ? t(`chat.channels.${message.channel}`) : null
  if (message.kind === 'narrator') {
    return props.monitor ? `${t('chat.narrator')} · ${t('chat.toEveryone')}` : t('chat.narrator')
  }
  if (message.kind === 'last-words') return `${name} · ${t('chat.lastWordsTag')}`
  return place === null ? name : `${name} · ${place}`
}

const entries = computed(() =>
  props.messages.map((message) => {
    const style = messageStyle(message, room.session?.memberId)
    const author = room.snapshot === null ? null : memberWithId(room.snapshot, message.authorId)
    const name = author?.name ?? ''
    return {
      message,
      style,
      name,
      avatar: author?.avatar ?? null,
      own: style === 'msg-own',
      who: style === 'msg-own' ? null : whoOf(message, name)
    }
  })
)

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (list.value !== null) list.value.scrollTop = list.value.scrollHeight
  },
  { immediate: true, flush: 'post' }
)
</script>

<template>
  <div ref="list" class="msgs chat-list" role="log" :aria-label="t('chat.sheet.messages')">
    <p v-if="entries.length === 0" class="t-small t-muted t-center chat-empty">{{ t('chat.empty') }}</p>
    <div v-for="entry in entries" :key="entry.message.id" class="msg" :class="entry.style">
      <LunaAvatar v-if="!entry.own" :avatar="entry.avatar" :name="entry.name" size="sm" />
      <div class="bubble" :class="{ 'chat-bubble-wide': monitor }">
        <span v-if="entry.who" class="who">{{ entry.who }}</span>{{ entry.message.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-list {
  min-height: 0;
  overflow-y: auto;
}

.chat-empty {
  margin: auto;
}

.msg-narr .av {
  --ring: #f4ebc8;
}

.msg-last .bubble {
  background: rgba(255, 208, 138, 0.16);
  box-shadow: inset 0 0 0 1.5px rgba(255, 208, 138, 0.6);
  font-style: italic;
}

.chat-bubble-wide {
  max-width: 520px;
  overflow-wrap: anywhere;
}
</style>
