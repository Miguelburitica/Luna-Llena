import type { Result } from '../result'
import type { MatchView } from './views'
import type { MatchError } from './vocabulary'

export type MatchAck<T> = (result: Result<T, MatchError>) => void

type NoInput = Record<string, never>

export interface MatchClientEvents {
  'match:sync': (input: NoInput, ack: MatchAck<MatchView>) => void
  'match:advance': (input: NoInput, ack: MatchAck<void>) => void
  'match:extendTimer': (input: NoInput, ack: MatchAck<void>) => void
  'match:setAlive': (input: { readonly memberId: string; readonly alive: boolean }, ack: MatchAck<void>) => void
  'match:endGame': (input: NoInput, ack: MatchAck<void>) => void
  'match:keepPlaying': (input: NoInput, ack: MatchAck<void>) => void
}

export interface MatchServerEvents {
  'match:view': (view: MatchView) => void
}
