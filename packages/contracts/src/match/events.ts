import type { Result } from '../result'
import type { CueEffect, CueInput } from './cues'
import type { HauntEffect, HauntInput } from './ghosts'
import type { NightActionInput } from './night'
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
  'match:declareFoolWin': (input: { readonly memberId: string }, ack: MatchAck<void>) => void
  'match:act': (input: NightActionInput, ack: MatchAck<void>) => void
  'match:vote': (input: { readonly targetId: string | null }, ack: MatchAck<void>) => void
  'match:lockVote': (input: NoInput, ack: MatchAck<void>) => void
  'match:avenge': (input: { readonly targetId: string }, ack: MatchAck<void>) => void
  'match:skipRevenge': (input: NoInput, ack: MatchAck<void>) => void
  'match:haunt': (input: HauntInput, ack: MatchAck<void>) => void
  'match:cue': (input: CueInput, ack: MatchAck<void>) => void
}

export interface MatchServerEvents {
  'match:view': (view: MatchView) => void
  'match:haunted': (effect: HauntEffect) => void
  'match:cued': (effect: CueEffect) => void
}
