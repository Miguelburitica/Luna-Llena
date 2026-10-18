export const ROLE_IDS = ['werewolf', 'villager', 'seer', 'doctor', 'witch', 'hunter', 'fool', 'drunk'] as const
export type RoleId = (typeof ROLE_IDS)[number]

export const TEAM_IDS = ['wolves', 'village', 'solo'] as const
export type TeamId = (typeof TEAM_IDS)[number]

export const ROLE_TEAMS: Readonly<Record<RoleId, TeamId>> = {
  werewolf: 'wolves',
  villager: 'village',
  seer: 'village',
  doctor: 'village',
  witch: 'village',
  hunter: 'village',
  fool: 'solo',
  drunk: 'village'
}

export const AVATAR_IDS = ['ana', 'caro', 'juan', 'luis', 'marta', 'nico', 'pipe', 'sofi', 'tato', 'vale'] as const
export type AvatarId = (typeof AVATAR_IDS)[number]

export const THEME_IDS = ['classic', 'colombia'] as const
export type ThemeId = (typeof THEME_IDS)[number]
export const PLAYABLE_THEME_IDS: readonly ThemeId[] = ['classic']

export const TIMER_OPTIONS = {
  night: [0, 45, 60, 90],
  day: [0, 120, 180, 300],
  vote: [0, 30, 60, 90]
} as const satisfies Record<string, readonly number[]>
export type TimerPhase = keyof typeof TIMER_OPTIONS
export const TIMER_PHASES = Object.keys(TIMER_OPTIONS) as TimerPhase[]

export const HOUSE_RULE_IDS = ['ghostPowers', 'lastWords', 'revealRoleOnDeath', 'anonymousVotes'] as const
export type HouseRuleId = (typeof HOUSE_RULE_IDS)[number]

export const ROOM_STATUSES = ['lobby', 'in-game'] as const
export type RoomStatus = (typeof ROOM_STATUSES)[number]

export const START_CONDITIONS = ['not-enough-players', 'deck-mismatch', 'players-not-ready'] as const
export type StartCondition = (typeof START_CONDITIONS)[number]

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const ROOM_LIMITS = {
  maxPlayers: 15,
  minPlayersToStart: 6,
  maxNameLength: 20,
  maxRoomNameLength: 40,
  maxCardsPerRole: 15,
  codeLength: 6
} as const
