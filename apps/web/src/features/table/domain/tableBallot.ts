import type { CastVote, VoteTally } from '@luna/contracts'

type Votes = Readonly<Record<string, CastVote>> | null

export const votersFor = (votes: Votes, accusedId: string): string[] =>
  Object.entries(votes ?? {})
    .filter(([, cast]) => cast.targetId === accusedId)
    .map(([voterId]) => voterId)

export const toggledVote = (votes: Votes, voterId: string, accusedId: string): string | null =>
  votes?.[voterId]?.targetId === accusedId ? null : accusedId

export const liveTallyOf = (votes: Votes): VoteTally[] => {
  const byTarget = new Map<string, string[]>()
  for (const [voterId, cast] of Object.entries(votes ?? {})) {
    if (cast.targetId === null) continue
    byTarget.set(cast.targetId, [...(byTarget.get(cast.targetId) ?? []), voterId])
  }
  return [...byTarget.entries()]
    .map(([targetId, voterIds]) => ({ targetId, votes: voterIds.length, voterIds }))
    .sort((first, second) => second.votes - first.votes)
}
