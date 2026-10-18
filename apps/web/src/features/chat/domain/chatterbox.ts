import type { Award, ChatMessage } from '@luna/contracts'

const SPOKEN_KINDS: readonly ChatMessage['kind'][] = ['player', 'last-words']

export const chatterboxOf = (villageMessages: readonly ChatMessage[], playerIds: readonly string[]): Award | null => {
  const counts = playerIds.map((memberId) => ({
    memberId,
    count: villageMessages.filter((message) => message.authorId === memberId && SPOKEN_KINDS.includes(message.kind)).length
  }))
  const best = counts.reduce<(typeof counts)[number] | null>(
    (leader, candidate) => (candidate.count > (leader?.count ?? 0) ? candidate : leader),
    null
  )
  return best === null ? null : { award: 'chatterbox', memberId: best.memberId, count: best.count }
}
