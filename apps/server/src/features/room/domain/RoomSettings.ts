import {
  DEFAULT_ROOM_SETTINGS,
  err,
  HOUSE_RULE_IDS,
  ok,
  PLAYABLE_THEME_IDS,
  ROLE_IDS,
  ROLE_CATALOG,
  roomError,
  ROOM_LIMITS,
  TIMER_OPTIONS,
  TIMER_PHASES,
  type HouseRuleId,
  type Result,
  type RoleId,
  type RoomError,
  type ThemeId,
  type TimerPhase
} from '@luna/contracts'

type Timers = Readonly<Record<TimerPhase, number>>
type HouseRules = Readonly<Record<HouseRuleId, boolean>>
type Deck = Readonly<Record<RoleId, number>>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const includes = <T>(allowed: readonly T[], value: unknown): value is T => allowed.includes(value as T)

const invalid = () => err(roomError('settings-invalid'))

const mergeTheme = (current: ThemeId, input: unknown): Result<ThemeId, RoomError> => {
  if (input === undefined) return ok(current)
  return includes(PLAYABLE_THEME_IDS, input) ? ok(input) : invalid()
}

const mergeTimers = (current: Timers, input: unknown): Result<Timers, RoomError> => {
  if (input === undefined) return ok(current)
  if (!isRecord(input)) return invalid()
  const merged: Record<TimerPhase, number> = { ...current }
  for (const [phase, seconds] of Object.entries(input)) {
    if (!includes(TIMER_PHASES, phase) || !includes<number>(TIMER_OPTIONS[phase], seconds)) return invalid()
    merged[phase] = seconds
  }
  return ok(merged)
}

const mergeHouseRules = (current: HouseRules, input: unknown): Result<HouseRules, RoomError> => {
  if (input === undefined) return ok(current)
  if (!isRecord(input)) return invalid()
  const merged: Record<HouseRuleId, boolean> = { ...current }
  for (const [rule, enabled] of Object.entries(input)) {
    if (!includes(HOUSE_RULE_IDS, rule) || typeof enabled !== 'boolean') return invalid()
    merged[rule] = enabled
  }
  return ok(merged)
}

const isCardCountFor = (role: RoleId, value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= 0 &&
  (value as number) <= Math.min(ROOM_LIMITS.maxCardsPerRole, ROLE_CATALOG[role].maxCopies)

const sizeOf = (deck: Deck): number => ROLE_IDS.reduce((total, role) => total + deck[role], 0)

const mergeDeck = (current: Deck, input: unknown): Result<Deck, RoomError> => {
  if (input === undefined) return ok(current)
  if (!isRecord(input)) return invalid()
  const merged: Record<RoleId, number> = { ...current }
  for (const [role, count] of Object.entries(input)) {
    if (!includes(ROLE_IDS, role) || !isCardCountFor(role, count)) return invalid()
    merged[role] = count
  }
  return sizeOf(merged) <= ROOM_LIMITS.maxPlayers ? ok(merged) : invalid()
}

export class RoomSettings {
  private constructor(
    readonly theme: ThemeId,
    readonly timers: Timers,
    readonly houseRules: HouseRules,
    readonly deck: Deck
  ) {}

  static defaults(): RoomSettings {
    const { theme, timers, houseRules, deck } = DEFAULT_ROOM_SETTINGS
    return new RoomSettings(theme, timers, houseRules, deck)
  }

  static fromInput(input: unknown): Result<RoomSettings, RoomError> {
    return RoomSettings.defaults().apply(input ?? {})
  }

  apply(input: unknown): Result<RoomSettings, RoomError> {
    if (!isRecord(input)) return invalid()
    const theme = mergeTheme(this.theme, input.theme)
    if (!theme.ok) return theme
    const timers = mergeTimers(this.timers, input.timers)
    if (!timers.ok) return timers
    const houseRules = mergeHouseRules(this.houseRules, input.houseRules)
    if (!houseRules.ok) return houseRules
    const deck = mergeDeck(this.deck, input.deck)
    if (!deck.ok) return deck
    return ok(new RoomSettings(theme.value, timers.value, houseRules.value, deck.value))
  }

  get deckSize(): number {
    return sizeOf(this.deck)
  }
}
