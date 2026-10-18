<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useChatStore } from '../../application/useChatStore'
import { MONITOR_TABS, monitorChannels, type MonitorTab } from '../../domain/channels'
import { chronological } from '../../domain/messageLog'
import ChatComposer from './ChatComposer.vue'
import ChatMessageList from './ChatMessageList.vue'

const { t } = useI18n()
const chat = useChatStore()
const tab = ref<MonitorTab>('all')

const shown = computed(() => chronological(chat.messages, monitorChannels(tab.value)))
const countOf = (monitorTab: MonitorTab): number => (monitorTab === 'all' ? 0 : chat.unread[monitorTab])
const tabLabel = (monitorTab: MonitorTab): string =>
  monitorTab === 'all' ? t('chat.monitor.all') : t(`chat.channels.${monitorTab}`)

watch(
  () => [tab.value, chat.messages] as const,
  ([monitorTab]) => chat.markSeen(monitorChannels(monitorTab)),
  { immediate: true }
)
</script>

<template>
  <section class="panel">
    <div class="panel-h">
      <h2 class="h3 monitor-heading">{{ t('chat.monitor.title') }}</h2>
      <div class="tabs monitor-tabs" role="tablist" :aria-label="t('chat.monitor.tabs')">
        <button
          v-for="monitorTab in MONITOR_TABS"
          :key="monitorTab"
          type="button"
          class="tab"
          :class="{ 'is-on': monitorTab === tab }"
          role="tab"
          :aria-selected="monitorTab === tab"
          @click="tab = monitorTab"
        >
          {{ tabLabel(monitorTab) }}
          <span v-if="countOf(monitorTab) > 0" class="count" :class="{ 'monitor-count-wolves': monitorTab === 'wolves' }">
            {{ countOf(monitorTab) }}
          </span>
        </button>
      </div>
    </div>
    <ChatMessageList :messages="shown" monitor class="monitor-list" />
    <ChatComposer channel="village" :placeholder="t('chat.monitor.placeholder')" :label="t('chat.monitor.label')">
      <span class="sbadge monitor-badge"><LunaIcon name="quill" size="sm" />{{ t('chat.monitor.asNarrator') }}</span>
    </ChatComposer>
  </section>
</template>

<style scoped>
.monitor-heading {
  font-size: 18px;
}

.monitor-tabs {
  width: 420px;
  max-width: 100%;
}

.monitor-count-wolves {
  background: #b8323a;
}

.monitor-list {
  max-height: 320px;
  margin-bottom: 12px;
}

.monitor-badge {
  white-space: nowrap;
}
</style>
