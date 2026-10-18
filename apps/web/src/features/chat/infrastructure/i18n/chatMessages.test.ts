import { CHAT_ERROR_CODES } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { chatMessages } from './chatMessages'

describe('chat messages', () => {
  it('has copy for every chat error in both languages, plus an unreachable server', () => {
    for (const language of ['en', 'es'] as const) {
      const errors = Object.keys(chatMessages[language].errors)
      expect(errors.sort()).toEqual([...CHAT_ERROR_CODES, 'unreachable'].sort())
    }
  })
})
