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

export const ROOM_VISIBILITIES = ['private', 'public'] as const
export type RoomVisibility = (typeof ROOM_VISIBILITIES)[number]

export const PUBLIC_ROOM_STATUSES = ['waiting', 'in-progress', 'full'] as const
export type PublicRoomStatus = (typeof PUBLIC_ROOM_STATUSES)[number]

export const PUBLIC_LOBBY_LIMITS = {
  maxPublicRoomsPerAddress: 2,
  reportsToHide: 3,
  maxListedRooms: 50,
  listingThrottleMs: 500
} as const

export const ROOM_CLEANUP = {
  narratorAwayMinutes: 10,
  idleLobbyMinutes: 60,
  noHumansMinutes: 5,
  sweepSeconds: 60
} as const

export const START_CONDITIONS = ['not-enough-players', 'deck-mismatch', 'no-wolves', 'players-not-ready'] as const
export type StartCondition = (typeof START_CONDITIONS)[number]

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const ROOM_LIMITS = {
  maxPlayers: 15,
  minPlayersToStart: 6,
  maxNameLength: 20,
  maxRoomNameLength: 40,
  maxCardsPerRole: 15,
  codeLength: 6,
  maxVoiceCallUrlLength: 300
} as const
