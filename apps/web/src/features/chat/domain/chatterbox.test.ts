import { describe, expect, it } from 'vitest'
import { messageOf } from '../application/ChatGateway.fixtures'
import { chatterboxOf } from './chatterbox'

const players = ['id-Ana', 'id-Juan', 'id-Marta']
const from = (authorId: string, count: number, kind: 'player' | 'last-words' | 'narrator' = 'player') =>
  Array.from({ length: count }, () => messageOf({ authorId, kind }))

describe('chatterboxOf', () => {
  it('picks the player with the most village messages', () => {
    const award = chatterboxOf([...from('id-Ana', 2), ...from('id-Marta', 5)], players)
    expect(award).toEqual({ award: 'chatterbox', memberId: 'id-Marta', count: 5 })
  })

  it('counts last words and ignores narrator messages and non-players', () => {
    const messages = [...from('id-Ana', 1), ...from('id-Ana', 1, 'last-words'), ...from('id-Nico', 9, 'narrator'), ...from('id-Juan', 1, 'narrator')]
    expect(chatterboxOf(messages, players)).toEqual({ award: 'chatterbox', memberId: 'id-Ana', count: 2 })
  })

  it('breaks ties by seat order', () => {
    expect(chatterboxOf([...from('id-Marta', 3), ...from('id-Juan', 3)], players)?.memberId).toBe('id-Juan')
  })

  it('is absent when nobody spoke', () => {
    expect(chatterboxOf([], players)).toBeNull()
    expect(chatterboxOf(from('id-Nico', 4), players)).toBeNull()
  })
})
