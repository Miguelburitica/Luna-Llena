import type { MatchError, MatchView, Result } from '@luna/contracts'
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
  onView(listener: (view: MatchView) => void): void
}

export const MATCH_GATEWAY: InjectionKey<MatchGateway> = Symbol('MatchGateway')
