import { CHAT_CHANNELS, type ChatChannel, type ChatMessage, type Result } from '@luna/contracts'
import { defineStore } from 'pinia'
import { computed, inject, ref, watch } from 'vue'
import { useMatchStore } from '@/features/match/application/useMatchStore'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { defaultTab, visibleTabs } from '../domain/channels'
import {
  emptyLog,
  latestIdOf,
  mergeMessages,
  nothingSeen,
  unreadCounts,
  type LastSeen,
  type MessageLog
} from '../domain/messageLog'
import { CHAT_GATEWAY, type ChatFailure } from './ports'

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} was not provided to the app`)
  return value
}

export const useChatStore = defineStore('chat', () => {
  const gateway = required(inject(CHAT_GATEWAY), 'ChatGateway')
  const match = useMatchStore()
  const room = useRoomStore()

  const messages = ref<MessageLog>(emptyLog())
  const lastSeen = ref<LastSeen>(nothingSeen())
  const requestedTab = ref<ChatChannel | null>(null)
  const open = ref(false)
  const failure = ref<ChatFailure | null>(null)
  const reloadOnResume = ref(false)
  const loadedChannels = ref<readonly ChatChannel[]>([])

  const access = computed(() => match.view?.chat ?? null)
  const myId = computed(() => room.session?.memberId)
  const tabs = computed(() => (access.value === null ? [] : visibleTabs(access.value)))
  const currentTab = computed<ChatChannel>(() => {
    if (requestedTab.value !== null && tabs.value.includes(requestedTab.value)) return requestedTab.value
    return access.value === null ? 'village' : defaultTab(access.value)
  })
  const unread = computed(() => unreadCounts(messages.value, lastSeen.value, myId.value))

  const take = (incoming: readonly ChatMessage[]) => {
    const next: Record<ChatChannel, readonly ChatMessage[]> = { ...messages.value }
    for (const channel of CHAT_CHANNELS) {
      const fresh = incoming.filter((message) => message.channel === channel)
      if (fresh.length > 0) next[channel] = mergeMessages(next[channel], fresh)
    }
    messages.value = next
  }

  const markSeen = (channels: readonly ChatChannel[]) => {
    const next: Record<ChatChannel, string | null> = { ...lastSeen.value }
    for (const channel of channels) next[channel] = latestIdOf(messages.value[channel])
    lastSeen.value = next
  }

  const receive = (message: ChatMessage) => {
    if (access.value?.read.includes(message.channel)) take([message])
  }

  const loadHistory = async (): Promise<Result<readonly ChatMessage[], ChatFailure>> => {
    const result = await gateway.history()
    if (!result.ok) {
      failure.value = result.error
      return result
    }
    take(result.value)
    const firstLoad = (access.value?.read ?? []).filter((channel) => !loadedChannels.value.includes(channel))
    markSeen(firstLoad)
    loadedChannels.value = [...loadedChannels.value, ...firstLoad]
    return result
  }

  const send = async (channel: ChatChannel, text: string): Promise<Result<ChatMessage, ChatFailure>> => {
    const result = await gateway.send(channel, text)
    failure.value = result.ok ? null : result.error
    if (result.ok) take([result.value])
    return result
  }

  gateway.onMessage(receive)
  gateway.onReconnected(() => {
    reloadOnResume.value = true
  })

  watch(
    () => (match.view === null ? null : `${match.view.code}:${match.view.chat.read.join(',')}`),
    (key) => {
      if (key !== null) void loadHistory()
    },
    { immediate: true }
  )

  watch(
    () => room.snapshot,
    () => {
      if (!reloadOnResume.value) return
      reloadOnResume.value = false
      if (match.view !== null) void loadHistory()
    }
  )

  watch(
    () => [open.value, currentTab.value, latestIdOf(messages.value[currentTab.value])] as const,
    ([isOpen, tab]) => {
      if (isOpen) markSeen([tab])
    }
  )

  return {
    messages,
    access,
    tabs,
    currentTab,
    unread,
    open,
    failure,
    loadHistory,
    send,
    markSeen,
    selectTab: (tab: ChatChannel) => {
      requestedTab.value = tab
      failure.value = null
    },
    openSheet: () => {
      open.value = true
    },
    closeSheet: () => {
      open.value = false
      failure.value = null
    }
  }
})
