<script setup lang="ts">
import type { PlayerMatchView } from '@luna/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import { useChatStore } from '../../application/useChatStore'
import { channelIconOf } from '../../domain/channels'
import { composerState } from '../../domain/composer'
import { SHEET_TAP_SLOP, sheetOffsetOf, sheetReleaseOf } from '../../domain/sheetDrag'
import ChatComposer from './ChatComposer.vue'
import ChatMessageList from './ChatMessageList.vue'

const props = defineProps<{ view: PlayerMatchView }>()
const { t } = useI18n()
const chat = useChatStore()

const composer = computed(() => composerState(props.view.chat, chat.currentTab, props.view.phase))
const noteIcon = computed(() => (composer.value.state === 'night-closed' ? 'lock' : 'hourglass'))

interface DragTrack {
  readonly startY: number
  lastY: number
  lastAt: number
  velocity: number
}

const sheet = ref<HTMLElement | null>(null)
const offset = ref(0)
const dragging = ref(false)
let track: DragTrack | null = null
let swallowClick = false

const startDrag = (event: PointerEvent) => {
  swallowClick = false
  track = { startY: event.clientY, lastY: event.clientY, lastAt: performance.now(), velocity: 0 }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const moveDrag = (event: PointerEvent) => {
  if (track === null) return
  const now = performance.now()
  const elapsed = now - track.lastAt
  if (elapsed > 0) track.velocity = (event.clientY - track.lastY) / elapsed
  track.lastY = event.clientY
  track.lastAt = now
  const next = sheetOffsetOf(track.startY, event.clientY)
  if (!dragging.value && next < SHEET_TAP_SLOP) return
  dragging.value = true
  offset.value = next
}

const endDrag = () => {
  if (track === null) return
  const velocity = track.velocity
  track = null
  if (!dragging.value) return
  dragging.value = false
  swallowClick = true
  const height = sheet.value?.getBoundingClientRect().height ?? 0
  if (sheetReleaseOf({ offset: offset.value, height, velocity }) === 'close') chat.closeSheet()
  else offset.value = 0
}

const cancelDrag = () => {
  track = null
  dragging.value = false
  offset.value = 0
}

const guardClick = (event: MouseEvent) => {
  if (!swallowClick) return
  swallowClick = false
  event.stopPropagation()
  event.preventDefault()
}
</script>

<template>
  <Transition name="chat-sheet" @after-leave="offset = 0">
    <section
      v-if="chat.open"
      ref="sheet"
      class="sheet chat-sheet"
      :class="{ 'is-dragging': dragging }"
      :style="{ '--chat-sheet-drag': `${offset}px` }"
      role="dialog"
      :aria-label="t('chat.sheet.label')"
    >
      <div
        class="chat-sheet-handle"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="cancelDrag"
        @click.capture="guardClick"
      >
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
  </Transition>
</template>

<style scoped>
.chat-sheet {
  position: fixed;
  top: 96px;
  bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  z-index: 40;
  transform: translateY(var(--chat-sheet-drag, 0px));
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.chat-sheet.is-dragging {
  transition: none;
}

.chat-sheet-enter-from,
.chat-sheet-leave-to {
  transform: translateY(100%);
}

.chat-sheet-handle {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: none;
  touch-action: pan-x;
  user-select: none;
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
