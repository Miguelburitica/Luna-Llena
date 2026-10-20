import type { BotCastId, BotLanguage, BotProfile } from '../bots/vocabulary'
import type { RoleId } from '../roles/catalog'
import type {
  AvatarId,
  HouseRuleId,
  PublicRoomStatus,
  RoomStatus,
  RoomVisibility,
  StartCondition,
  ThemeId,
  TimerPhase
} from './vocabulary'

export interface RoomSettingsView {
  readonly theme: ThemeId
  readonly timers: Readonly<Record<TimerPhase, number>>
  readonly houseRules: Readonly<Record<HouseRuleId, boolean>>
  readonly deck: Readonly<Record<RoleId, number>>
  readonly botLanguage: BotLanguage
}

export interface RoomSettingsInput {
  readonly theme?: ThemeId
  readonly timers?: Partial<Record<TimerPhase, number>>
  readonly houseRules?: Partial<Record<HouseRuleId, boolean>>
  readonly deck?: Partial<Record<RoleId, number>>
  readonly botLanguage?: BotLanguage
}

export interface MemberView {
  readonly id: string
  readonly name: string
  readonly avatar: AvatarId | null
  readonly isNarrator: boolean
  readonly bot: BotProfile | null
  readonly ready: boolean
  readonly connected: boolean
  readonly muted: boolean
}

export interface StartReadiness {
  readonly canStart: boolean
  readonly unmet: readonly StartCondition[]
  readonly notReadyMemberIds: readonly string[]
  readonly playerCount: number
  readonly deckSize: number
}

export interface RoomSnapshot {
  readonly code: string
  readonly name: string
  readonly status: RoomStatus
  readonly visibility: RoomVisibility
  readonly voiceCallUrl: string | null
  readonly settings: RoomSettingsView
  readonly members: readonly MemberView[]
  readonly botCast: BotCastId | null
  readonly startReadiness: StartReadiness
}

export interface RoomSummary {
  readonly code: string
  readonly name: string
  readonly narratorName: string
  readonly theme: ThemeId
  readonly playerCount: number
  readonly capacity: number
  readonly avatarsInUse: readonly AvatarId[]
  readonly acceptingPlayers: boolean
  readonly voiceCallUrl: string | null
}

export interface PublicRoomCard {
  readonly code: string
  readonly name: string
  readonly narratorName: string
  readonly playerCount: number
  readonly capacity: number
  readonly botCount: number
  readonly deckSize: number
  readonly status: PublicRoomStatus
  readonly joinable: boolean
}

export interface SeatTakeover {
  readonly formerName: string
  readonly botName: string
}

export interface RoomSession {
  readonly code: string
  readonly memberId: string
  readonly token: string
  readonly snapshot: RoomSnapshot
}
