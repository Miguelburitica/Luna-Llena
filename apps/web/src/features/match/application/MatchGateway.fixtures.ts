import {
  err,
  ok,
  type MatchView,
  type NightActionInput,
  type NarratorMatchView,
  type PlayerMatchView,
  type Result
} from '@luna/contracts'
import type { MatchFailure, MatchGateway } from './ports'

type Listener = (view: MatchView) => void

const baseView = {
  code: 'LUNA42',
  phase: 'night',
  round: 1,
  phaseEndsAt: null,
  serverNow: 1_000_000,
  players: [],
  outcome: null,
  dawn: null
} as const

export const youOf = (overrides: Partial<PlayerMatchView['you']> = {}): PlayerMatchView['you'] => ({
  role: 'villager',
  team: 'village',
  packIds: [],
  night: null,
  visions: [],
  ...overrides
})

export const playerViewOf = (overrides: Partial<PlayerMatchView> = {}): PlayerMatchView => ({
  ...baseView,
  perspective: 'player',
  you: youOf(),
  ...overrides
})

export const narratorViewOf = (overrides: Partial<NarratorMatchView> = {}): NarratorMatchView => ({
  ...baseView,
  perspective: 'narrator',
  roles: {},
  pendingWinner: null,
  night: null,
  ...overrides
})

export class FakeMatchGateway implements MatchGateway {
  readonly calls: Array<{ command: string; input: unknown }> = []
  responses: Partial<Record<string, Result<unknown, MatchFailure>>> = {}
  private readonly viewListeners: Listener[] = []

  constructor(public syncView: MatchView = playerViewOf()) {}

  answer(command: string, result: Result<unknown, MatchFailure>): this {
    this.responses[command] = result
    return this
  }

  private respond<T>(command: string, input: unknown, fallback: Result<unknown, MatchFailure>) {
    this.calls.push({ command, input })
    return Promise.resolve((this.responses[command] ?? fallback) as Result<T, MatchFailure>)
  }

  sync() {
    return this.respond<MatchView>('sync', undefined, ok(this.syncView))
  }

  advance() {
    return this.respond<undefined>('advance', undefined, ok(undefined))
  }

  extendTimer() {
    return this.respond<undefined>('extendTimer', undefined, ok(undefined))
  }

  setAlive(memberId: string, alive: boolean) {
    return this.respond<undefined>('setAlive', { memberId, alive }, ok(undefined))
  }

  endGame() {
    return this.respond<undefined>('endGame', undefined, ok(undefined))
  }

  keepPlaying() {
    return this.respond<undefined>('keepPlaying', undefined, ok(undefined))
  }

  act(input: NightActionInput) {
    return this.respond<undefined>('act', input, ok(undefined))
  }

  onView(listener: Listener) {
    this.viewListeners.push(listener)
  }

  pushView(view: MatchView) {
    for (const listener of this.viewListeners) listener(view)
  }

  commands(): string[] {
    return this.calls.map((call) => call.command)
  }

  failWith(command: string, code: MatchFailure['code']): this {
    return this.answer(command, err({ code } as MatchFailure))
  }
}
