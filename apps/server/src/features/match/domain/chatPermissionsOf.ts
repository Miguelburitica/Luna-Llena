import { CHAT_CHANNELS, ROLE_CATALOG, type ChatChannel } from '@luna/contracts'
import type { Match } from './Match'

export interface ChatPermissions {
  readonly read: readonly ChatChannel[]
  readonly write: readonly ChatChannel[]
  readonly closed: readonly ChatChannel[]
  readonly lastWordsUntil: number | null
  readonly villagePaused: boolean
}

const NO_PERMISSIONS: ChatPermissions = { read: [], write: [], closed: [], lastWordsUntil: null, villagePaused: false }

const narratorPermissions: ChatPermissions = { ...NO_PERMISSIONS, read: CHAT_CHANNELS, write: ['village'] }

export const chatPermissionsOf = (match: Match, memberId: string, now: number): ChatPermissions => {
  if (memberId === match.narratorId) return narratorPermissions
  const seat = match.seats.find((candidate) => candidate.memberId === memberId)
  if (seat === undefined) return NO_PERMISSIONS
  const isWolf = ROLE_CATALOG[seat.role].team === 'wolves'
  const gameOver = match.outcome !== null
  const lastWordsUntil = match.lastWordsUntilOf(memberId, now)
  const villagePaused = !gameOver && seat.alive && match.hasOpenLastWords(now)
  const read: ChatChannel[] = ['village']
  const write: ChatChannel[] = []
  const closed: ChatChannel[] = []

  if (isWolf) read.push('wolves')
  if (!seat.alive) read.push('ghosts')

  const villageOpen = gameOver || (seat.alive ? match.phase !== 'night' && !villagePaused : lastWordsUntil !== null)
  if (villageOpen) write.push('village')
  else if (seat.alive) closed.push('village')

  if (isWolf && seat.alive) (match.phase === 'night' ? write : closed).push('wolves')
  if (!seat.alive) write.push('ghosts')

  return { read, write, closed, lastWordsUntil, villagePaused }
}
