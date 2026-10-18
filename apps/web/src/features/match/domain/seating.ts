import type { AvatarId, MatchView, MemberView, RoleId } from '@luna/contracts'

export interface Seat {
  readonly id: string
  readonly name: string
  readonly avatar: AvatarId | null
  readonly alive: boolean
  readonly revealedRole: RoleId | null
  readonly isYou: boolean
  readonly isPack: boolean
}

export const seatsOf = (
  view: MatchView,
  members: readonly MemberView[],
  myId: string | undefined,
  packIds: readonly string[] = []
): Seat[] =>
  view.players.map((player) => {
    const member = members.find((candidate) => candidate.id === player.id)
    return {
      id: player.id,
      name: member?.name ?? '',
      avatar: member?.avatar ?? null,
      alive: player.alive,
      revealedRole: player.revealedRole,
      isYou: player.id === myId,
      isPack: packIds.includes(player.id)
    }
  })

export const trueRoleOf = (view: MatchView, playerId: string): RoleId | null => {
  if (view.perspective === 'narrator') return view.roles[playerId] ?? null
  return view.players.find((player) => player.id === playerId)?.revealedRole ?? null
}

export const aliveCountOf = (view: MatchView): number => view.players.filter((player) => player.alive).length
