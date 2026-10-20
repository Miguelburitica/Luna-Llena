import type { PublicRoomCard } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PUBLIC_GAME_FILTERS, filterPublicRooms, statusBadgeClassOf } from './publicGames'

const card = (code: string, status: PublicRoomCard['status']): PublicRoomCard => ({
  code,
  name: code,
  narratorName: 'Nico',
  playerCount: 3,
  capacity: 15,
  botCount: 0,
  deckSize: 8,
  status,
  joinable: status === 'waiting'
})

const rooms = [card('WAITNG', 'waiting'), card('RUNNNN', 'in-progress'), card('FULLRM', 'full')]

describe('Public game filters', () => {
  it('show only waiting rooms with free seats by default', () => {
    expect(filterPublicRooms(rooms, DEFAULT_PUBLIC_GAME_FILTERS).map((room) => room.code)).toEqual(['WAITNG'])
  })

  it('show rooms in progress once Waiting to start is off', () => {
    expect(filterPublicRooms(rooms, { waitingOnly: false, freeSeatsOnly: true }).map((room) => room.code)).toEqual(['WAITNG', 'RUNNNN'])
  })

  it('show full rooms once Free seats is off', () => {
    expect(filterPublicRooms(rooms, { waitingOnly: true, freeSeatsOnly: false }).map((room) => room.code)).toEqual(['WAITNG', 'FULLRM'])
  })

  it('give each status its badge style', () => {
    expect(statusBadgeClassOf('waiting')).toBe('is-ok')
    expect(statusBadgeClassOf('full')).toBe('is-warn')
  })
})
