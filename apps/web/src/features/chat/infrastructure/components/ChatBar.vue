<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useChatStore } from '../../application/useChatStore'
import { isDead } from '../../domain/channels'
import { composerState } from '../../domain/composer'

const props = defineProps<{ view: PlayerMatchView }>()
const { t } = useI18n()
const chat = useChatStore()

const dead = computed(() => isDead(props.view.chat))
const village = computed(() => composerState(props.view.chat, 'village', props.view.phase))
const closed = computed(() => !dead.value && village.value.state !== 'write')
const unreadTotal = computed(() => Object.values(chat.unread).reduce((sum, count) => sum + count, 0))
const icon = computed(() => {
  if (dead.value) return 'ghost'
  return closed.value ? 'lock' : 'chat'
})
</script>

<template>
  <button type="button" class="chatbar" :aria-label="t('chat.sheet.label')" @click="chat.openSheet()">
    <LunaIcon :name="icon" />
    <span class="chat-bar-label">
      <template v-if="dead">
        {{ t('chat.channels.ghosts') }}
        <span v-if="village.note" class="t-muted">· {{ t(`chat.notes.${village.note}`) }}</span>
      </template>
      <span v-else-if="village.note" class="t-muted">{{ t(`chat.notes.${village.note}`) }}</span>
      <template v-else>{{ t('chat.bar.open') }}</template>
    </span>
    <span v-if="unreadTotal > 0" class="count" :aria-label="t('chat.bar.unread', { count: unreadTotal })">{{ unreadTotal }}</span>
    <LunaIcon name="chevron-up" />
  </button>
</template>

<style scoped>
.chat-bar-label {
  flex: 1;
  min-width: 0;
}
</style>
