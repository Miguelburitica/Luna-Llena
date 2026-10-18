import { CHAT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { messageOf } from '../application/ChatGateway.fixtures'
import { lastWordsSecondsLeft, spokenLastWords, spotlightUntil } from './lastWords'

describe('last words', () => {
  it('counts down on the server clock offset', () => {
    expect(lastWordsSecondsLeft(1_015_000, 1_000_000, 500, 500)).toBe(15)
    expect(lastWordsSecondsLeft(1_015_000, 1_000_000, 500, 3_100)).toBe(13)
    expect(lastWordsSecondsLeft(1_015_000, 1_000_000, 500, 40_000)).toBe(0)
    expect(lastWordsSecondsLeft(null, 1_000_000, 500, 500)).toBeNull()
  })

  it('finds the latest last-words message of the village', () => {
    const first = messageOf({ kind: 'last-words', id: 'first' })
    const second = messageOf({ kind: 'last-words', id: 'second' })
    expect(spokenLastWords([first, messageOf(), second, messageOf()])).toBe(second)
    expect(spokenLastWords([messageOf()])).toBeNull()
  })

  it('shows the spotlight for the length of a last-words window', () => {
    const message = messageOf({ kind: 'last-words', sentAt: 2_000 })
    expect(spotlightUntil(message)).toBe(2_000 + CHAT_LIMITS.lastWordsSeconds * 1000)
  })
})
