import { describe, expect, it } from 'vitest'
import { messageOf } from '../application/ChatGateway.fixtures'
import { messageStyle } from './messageStyle'

describe('message style', () => {
  it('styles your own message on the right', () => {
    expect(messageStyle(messageOf({ authorId: 'id-Ana' }), 'id-Ana')).toBe('msg-own')
  })

  it('leaves other players plain in the village', () => {
    expect(messageStyle(messageOf(), 'id-Ana')).toBeNull()
  })

  it('gives the narrator a parchment style, even to the narrator', () => {
    const narration = messageOf({ kind: 'narrator', authorId: 'id-Nico' })
    expect(messageStyle(narration, 'id-Ana')).toBe('msg-narr')
    expect(messageStyle(narration, 'id-Nico')).toBe('msg-narr')
  })

  it('marks last words, ghosts and wolves', () => {
    expect(messageStyle(messageOf({ kind: 'last-words' }), 'id-Ana')).toBe('msg-last')
    expect(messageStyle(messageOf({ channel: 'ghosts' }), 'id-Ana')).toBe('msg-ghost')
    expect(messageStyle(messageOf({ channel: 'wolves' }), 'id-Ana')).toBe('msg-wolf')
  })
})
