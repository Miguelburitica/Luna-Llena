import type { BotLanguage, BotProfile, RoomSnapshot } from '@luna/contracts'

export interface BotRoster {
  readonly code: string
  readonly language: BotLanguage
  readonly status: RoomSnapshot['status']
  readonly names: ReadonlyMap<string, string>
  readonly bots: ReadonlyMap<string, BotProfile>
  readonly mutedIds: ReadonlySet<string>
}

export const rosterOf = (snapshot: RoomSnapshot): BotRoster => ({
  code: snapshot.code,
  language: snapshot.settings.botLanguage,
  status: snapshot.status,
  names: new Map(snapshot.members.map((member) => [member.id, member.name])),
  bots: new Map(snapshot.members.flatMap((member) => (member.bot === null ? [] : [[member.id, member.bot] as const]))),
  mutedIds: new Set(snapshot.members.flatMap((member) => (member.muted ? [member.id] : [])))
})

export const nameIn = (roster: BotRoster, memberId: string | null): string =>
  memberId === null ? '' : (roster.names.get(memberId) ?? '')
