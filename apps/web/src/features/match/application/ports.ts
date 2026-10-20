import type { HauntEffect, HauntInput, MatchError, MatchView, NightActionInput, Result } from '@luna/contracts'
import type { InjectionKey } from 'vue'

export type MatchFailure = MatchError | { readonly code: 'unreachable' }

export type MatchResult<T> = Promise<Result<T, MatchFailure>>

export interface MatchGateway {
  sync(): MatchResult<MatchView>
  advance(): MatchResult<void>
  extendTimer(): MatchResult<void>
  setAlive(memberId: string, alive: boolean): MatchResult<void>
  endGame(): MatchResult<void>
  keepPlaying(): MatchResult<void>
  declareFoolWin(memberId: string): MatchResult<void>
  act(input: NightActionInput): MatchResult<void>
  vote(targetId: string | null): MatchResult<void>
  lockVote(): MatchResult<void>
  avenge(targetId: string): MatchResult<void>
  skipRevenge(): MatchResult<void>
  haunt(input: HauntInput): MatchResult<void>
  onView(listener: (view: MatchView) => void): void
  onHaunted(listener: (effect: HauntEffect) => void): void
}

export const MATCH_GATEWAY: InjectionKey<MatchGateway> = Symbol('MatchGateway')
