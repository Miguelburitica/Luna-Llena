import { CHAT_LIMITS, type ChatMessage } from '@luna/contracts'
import { secondsLeft } from '@/features/match/domain/phases'

const MILLISECONDS_PER_SECOND = 1000

export const lastWordsSecondsLeft = (
  until: number | null,
  serverNow: number,
  receivedAt: number,
  clientNow: number
): number | null => secondsLeft(until, serverNow, receivedAt, clientNow)

export const spokenLastWords = (villageMessages: readonly ChatMessage[]): ChatMessage | null =>
  villageMessages.findLast((message) => message.kind === 'last-words') ?? null

export const spotlightUntil = (message: ChatMessage): number =>
  message.sentAt + CHAT_LIMITS.lastWordsSeconds * MILLISECONDS_PER_SECOND
