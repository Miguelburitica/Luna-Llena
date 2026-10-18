import { DEFAULT_ROOM_SETTINGS, type Result, type RoleId, type TimerPhase } from '@luna/contracts'
import { Match } from './Match'
import type { Seat } from './Seat'

export const NARRATOR_ID = 'narrator'

export const unwrap = <T>(result: Result<T, unknown>): T => {
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result.error)}`)
  return result.value
}

export const START_TIME = 1_000_000

export const seatsOf = (roles: readonly RoleId[]): Seat[] =>
  roles.map((role, position) => ({ memberId: `p${position + 1}`, role, alive: true }))

export const SEVEN_ROLES: readonly RoleId[] = ['werewolf', 'werewolf', 'seer', 'doctor', 'witch', 'hunter', 'fool']

export interface MatchSetup {
  readonly roles?: readonly RoleId[]
  readonly timers?: Partial<Record<TimerPhase, number>>
  readonly revealRoleOnDeath?: boolean
  readonly anonymousVotes?: boolean
  readonly now?: number
}

export const beginMatch = ({
  roles = SEVEN_ROLES,
  timers = {},
  revealRoleOnDeath = true,
  anonymousVotes = false,
  now = START_TIME
}: MatchSetup = {}): Match =>
  Match.begin({
    code: 'LUNA42',
    narratorId: NARRATOR_ID,
    seats: seatsOf(roles),
    timers: { ...DEFAULT_ROOM_SETTINGS.timers, ...timers },
    revealRoleOnDeath,
    anonymousVotes,
    now
  })

export const constantRandom = (value: number) => ({ next: () => value })

export const NIGHT_ROLES: readonly RoleId[] = [
  'werewolf',
  'werewolf',
  'seer',
  'doctor',
  'witch',
  'villager',
  'drunk',
  'villager'
]

export const WOLF_ONE = 'p1'
export const WOLF_TWO = 'p2'
export const SEER = 'p3'
export const DOCTOR = 'p4'
export const WITCH = 'p5'
export const VILLAGER = 'p6'
export const DRUNK = 'p7'
export const OTHER_VILLAGER = 'p8'
