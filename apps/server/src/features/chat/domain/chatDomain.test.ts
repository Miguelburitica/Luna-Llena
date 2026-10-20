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

  it('accepts exactly 200 characters unchanged and rejects 201', () => {
    expect(CHAT_LIMITS.maxMessageLength).toBe(200)
    const atLimit = 'x'.repeat(CHAT_LIMITS.maxMessageLength)
    expect(MessageText.create(atLimit)).toEqual({ ok: true, value: { value: atLimit } })
    expect(MessageText.create('x'.repeat(CHAT_LIMITS.maxMessageLength + 1))).toEqual({
      ok: false,
      error: { code: 'message-invalid' }
    })
  })
})

describe('Hidden characters', () => {
  it('strips direction overrides from a message', () => {
    expect(MessageText.create('hola\u202Eodnum')).toEqual({ ok: true, value: { value: 'holaodnum' } })
  })
})

describe('Flood window', () => {
  it('admits 5 messages in 10 seconds and refuses the sixth', () => {
    const log = ChatLog.open('LUNA42')
    for (let sent = 0; sent < CHAT_LIMITS.burstMessages; sent += 1) {
      expect(log.admits('tato', 1000 + sent)).toBe(true)
      log.recordSend('tato', 1000 + sent)
    }
    expect(log.admits('tato', 2000)).toBe(false)
    expect(log.admits('caro', 2000)).toBe(true)
  })

  it('admits again once 10 seconds have passed', () => {
    const log = ChatLog.open('LUNA42')
    for (let sent = 0; sent < CHAT_LIMITS.burstMessages; sent += 1) log.recordSend('tato', 1000)
    expect(log.admits('tato', 1000 + CHAT_LIMITS.burstSeconds * 1000)).toBe(true)
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
