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
  readonly now?: number
}

export const beginMatch = ({
  roles = SEVEN_ROLES,
  timers = {},
  revealRoleOnDeath = true,
  now = START_TIME
}: MatchSetup = {}): Match =>
  Match.begin({
    code: 'LUNA42',
    narratorId: NARRATOR_ID,
    seats: seatsOf(roles),
    timers: { ...DEFAULT_ROOM_SETTINGS.timers, ...timers },
    revealRoleOnDeath,
    now
  })
