import type { ChatMessage } from '@luna/contracts'
import { computed } from 'vue'
import { useTickingNow } from '@/features/match/application/useCountdown'
import { useMatchStore } from '@/features/match/application/useMatchStore'
import { lastWordsSecondsLeft, spokenLastWords, spotlightUntil } from '../domain/lastWords'
import { useChatStore } from './useChatStore'

export interface LastWordsPromptState {
  readonly secondsLeft: number
}

export interface LastWordsSpotlightState {
  readonly message: ChatMessage
  readonly secondsLeft: number
  readonly paused: boolean
}

export const useLastWords = () => {
  const chat = useChatStore()
  const match = useMatchStore()
  const now = useTickingNow()

  const secondsUntil = (until: number | null): number | null => {
    const view = match.view
    if (view === null) return null
    return lastWordsSecondsLeft(until, view.serverNow, match.receivedAt, Math.max(now.value, match.receivedAt))
  }

  const prompt = computed<LastWordsPromptState | null>(() => {
    const access = chat.access
    if (access === null || !access.write.includes('village')) return null
    const seconds = secondsUntil(access.lastWordsUntil)
    return seconds === null || seconds <= 0 ? null : { secondsLeft: seconds }
  })

  const spotlight = computed<LastWordsSpotlightState | null>(() => {
    const message = spokenLastWords(chat.messages.village)
    if (message === null) return null
    const seconds = secondsUntil(spotlightUntil(message))
    if (seconds === null || seconds <= 0) return null
    return { message, secondsLeft: seconds, paused: chat.access?.villagePaused ?? false }
  })

  return { prompt, spotlight }
}
