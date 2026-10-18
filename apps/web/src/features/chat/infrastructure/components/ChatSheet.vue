<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useChatStore } from '../../application/useChatStore'
import { channelIconOf } from '../../domain/channels'
import { composerState } from '../../domain/composer'
import ChatComposer from './ChatComposer.vue'
import ChatMessageList from './ChatMessageList.vue'

const props = defineProps<{ view: PlayerMatchView }>()
const { t } = useI18n()
const chat = useChatStore()

const composer = computed(() => composerState(props.view.chat, chat.currentTab, props.view.phase))
const noteIcon = computed(() => (composer.value.state === 'night-closed' ? 'lock' : 'hourglass'))
</script>

<template>
  <section v-if="chat.open" class="sheet chat-sheet" role="dialog" :aria-label="t('chat.sheet.label')">
    <button type="button" class="grabber chat-grabber" :aria-label="t('chat.sheet.close')" @click="chat.closeSheet()" />
    <div class="tabs" role="tablist" :aria-label="t('chat.sheet.tabs')">
      <button
        v-for="tab in chat.tabs"
        :key="tab"
        type="button"
        class="tab"
        :class="{ 'is-on': tab === chat.currentTab }"
        role="tab"
        :aria-selected="tab === chat.currentTab"
        @click="chat.selectTab(tab)"
      >
        <LunaIcon :name="channelIconOf(tab)" size="sm" />{{ t(`chat.channels.${tab}`) }}
        <span v-if="chat.unread[tab] > 0" class="count" :class="{ 'chat-count-wolves': tab === 'wolves' }">
          {{ chat.unread[tab] }}
        </span>
      </button>
    </div>
    <ChatMessageList :messages="chat.messages[chat.currentTab]" />
    <ChatComposer
      v-if="composer.state === 'write'"
      :channel="chat.currentTab"
      :placeholder="t(`chat.composer.${chat.currentTab}`)"
      :label="t('chat.composer.label', { channel: t(`chat.channels.${chat.currentTab}`) })"
    />
    <div v-else class="locked-note" role="status">
      <LunaIcon :name="noteIcon" size="sm" />{{ composer.note ? t(`chat.notes.${composer.note}`) : '' }}
    </div>
  </section>
</template>

<style scoped>
.chat-sheet {
  position: fixed;
  top: 96px;
  bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  z-index: 40;
}

.chat-grabber {
  display: block;
  flex: none;
  padding: 0;
  border: 0;
  cursor: pointer;
}

.chat-count-wolves {
  background: #b8323a;
}
</style>
