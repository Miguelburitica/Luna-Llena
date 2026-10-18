import { CHAT_LIMITS, type ChatMessage } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { ChatLog } from './ChatLog'
import { MessageText } from './MessageText'

const messageOf = (position: number, channel: ChatMessage['channel'] = 'village'): ChatMessage => ({
  id: `message-${position}`,
  channel,
  kind: 'player',
  authorId: 'caro',
  text: `line ${position}`,
  sentAt: position
})

describe('MessageText', () => {
  it('trims the text', () => {
    expect(MessageText.create('  hola  ')).toEqual({ ok: true, value: expect.objectContaining({ value: 'hola' }) })
  })

  it('rejects a blank message', () => {
    expect(MessageText.create('   \n ')).toEqual({ ok: false, error: { code: 'message-invalid' } })
  })

  it('rejects anything that is not text', () => {
    for (const input of [undefined, null, 7, {}, ['a']]) {
      expect(MessageText.create(input)).toEqual({ ok: false, error: { code: 'message-invalid' } })
    }
  })

  it('accepts 280 characters and rejects 281', () => {
    expect(MessageText.create('x'.repeat(CHAT_LIMITS.maxMessageLength)).ok).toBe(true)
    expect(MessageText.create('x'.repeat(CHAT_LIMITS.maxMessageLength + 1))).toEqual({
      ok: false,
      error: { code: 'message-invalid' }
    })
  })
})

describe('ChatLog', () => {
  it('keeps one list per channel', () => {
    const log = ChatLog.open('LUNA42')
    log.append(messageOf(1, 'village'))
    log.append(messageOf(2, 'wolves'))
    expect(log.messagesIn('village').map((message) => message.id)).toEqual(['message-1'])
    expect(log.messagesIn('ghosts')).toEqual([])
    expect(log.messagesOf(['wolves', 'village']).map((message) => message.id)).toEqual(['message-1', 'message-2'])
  })

  it('keeps only the most recent messages of each channel', () => {
    const log = ChatLog.open('LUNA42')
    const total = CHAT_LIMITS.historyPerChannel + 5
    for (let position = 1; position <= total; position += 1) log.append(messageOf(position))
    log.append(messageOf(1000, 'ghosts'))
    const village = log.messagesIn('village')
    expect(village).toHaveLength(CHAT_LIMITS.historyPerChannel)
    expect(village[0]?.id).toBe('message-6')
    expect(village.at(-1)?.id).toBe(`message-${total}`)
    expect(log.messagesIn('ghosts')).toHaveLength(1)
  })
})
