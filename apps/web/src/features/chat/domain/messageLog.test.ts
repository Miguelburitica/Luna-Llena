import { CHAT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { messageOf } from '../application/ChatGateway.fixtures'
import { chronological, emptyLog, latestIdOf, mergeMessages, nothingSeen, unreadCounts } from './messageLog'

describe('message log', () => {
  it('merges by id, oldest first, ties broken by id', () => {
    const late = messageOf({ id: 'b', sentAt: 20 })
    const early = messageOf({ id: 'c', sentAt: 10 })
    const tie = messageOf({ id: 'a', sentAt: 10 })
    expect(mergeMessages([late], [early, tie, late]).map((message) => message.id)).toEqual(['a', 'c', 'b'])
  })

  it('keeps only the most recent messages of a channel', () => {
    const many = Array.from({ length: CHAT_LIMITS.historyPerChannel + 5 }, (_, index) =>
      messageOf({ id: `m-${String(index).padStart(4, '0')}`, sentAt: index })
    )
    const merged = mergeMessages([], many)
    expect(merged).toHaveLength(CHAT_LIMITS.historyPerChannel)
    expect(merged[0]?.id).toBe('m-0005')
  })

  it('weaves channels together by time', () => {
    const log = {
      ...emptyLog(),
      village: [messageOf({ id: 'v', sentAt: 5 })],
      wolves: [messageOf({ id: 'w', channel: 'wolves', sentAt: 3 })]
    }
    expect(chronological(log).map((message) => message.id)).toEqual(['w', 'v'])
    expect(chronological(log, ['village']).map((message) => message.id)).toEqual(['v'])
    expect(latestIdOf(log.village)).toBe('v')
    expect(latestIdOf([])).toBeNull()
  })

  it('counts what arrived after the last message seen, never your own', () => {
    const wolves = [
      messageOf({ id: 'w1', channel: 'wolves', authorId: 'id-Tato' }),
      messageOf({ id: 'w2', channel: 'wolves', authorId: 'id-Tato' }),
      messageOf({ id: 'w3', channel: 'wolves', authorId: 'id-Luis' })
    ]
    const log = { ...emptyLog(), wolves }
    expect(unreadCounts(log, { ...nothingSeen(), wolves: 'w1' }, 'id-Luis')).toEqual({ village: 0, wolves: 1, ghosts: 0 })
    expect(unreadCounts(log, nothingSeen(), 'id-Luis').wolves).toBe(2)
    expect(unreadCounts(log, { ...nothingSeen(), wolves: 'w3' }, 'id-Luis').wolves).toBe(0)
  })
})
