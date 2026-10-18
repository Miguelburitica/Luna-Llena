import {
  AVATAR_IDS,
  ROLE_IDS,
  ROLE_TEAMS,
  type AvatarId,
  type MemberView,
  type RoleId,
  type RoomSettingsView,
  type RoomSnapshot,
  type TeamId
} from '@luna/contracts'

export interface AvatarChoice {
  readonly avatar: AvatarId
  readonly holder: MemberView | null
  readonly mine: boolean
}

export interface DeckCard {
  readonly role: RoleId
  readonly count: number
}

export const memberWithId = (snapshot: RoomSnapshot, memberId: string | undefined): MemberView | null =>
  snapshot.members.find((member) => member.id === memberId) ?? null

export const narratorOf = (snapshot: RoomSnapshot): MemberView | null =>
  snapshot.members.find((member) => member.isNarrator) ?? null

export const playersOf = (snapshot: RoomSnapshot): MemberView[] => snapshot.members.filter((member) => !member.isNarrator)

export const readyPlayerCount = (snapshot: RoomSnapshot): number => playersOf(snapshot).filter((player) => player.ready).length

export const avatarChoices = (snapshot: RoomSnapshot, myId: string | undefined): AvatarChoice[] =>
  AVATAR_IDS.map((avatar) => {
    const holder = snapshot.members.find((member) => member.avatar === avatar) ?? null
    return { avatar, holder, mine: holder !== null && holder.id === myId }
  })

export const cardsInDeck = (deck: RoomSettingsView['deck']): DeckCard[] =>
  ROLE_IDS.map((role) => ({ role, count: deck[role] })).filter((card) => card.count > 0)

export const deckSizeOf = (deck: Partial<Record<RoleId, number>>): number =>
  ROLE_IDS.reduce((total, role) => total + (deck[role] ?? 0), 0)

export const namesOf = (snapshot: RoomSnapshot, memberIds: readonly string[]): string[] =>
  memberIds.flatMap((memberId) => memberWithId(snapshot, memberId)?.name ?? [])

export type TeamCounts = Readonly<Record<TeamId, number>>

export const teamCountsOf = (deck: Readonly<Record<RoleId, number>>): TeamCounts =>
  ROLE_IDS.reduce<Record<TeamId, number>>(
    (counts, role) => ({ ...counts, [ROLE_TEAMS[role]]: counts[ROLE_TEAMS[role]] + deck[role] }),
    { wolves: 0, village: 0, solo: 0 }
  )

export type TimerLabel = { readonly unit: 'off' } | { readonly unit: 'seconds' | 'minutes'; readonly value: number }

export const timerLabelOf = (seconds: number): TimerLabel => {
  if (seconds === 0) return { unit: 'off' }
  return seconds >= 120 ? { unit: 'minutes', value: seconds / 60 } : { unit: 'seconds', value: seconds }
}
