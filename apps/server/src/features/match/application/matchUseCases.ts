import type { Clock } from '../../../shared/application/Clock'
import type { RandomSource } from '../../../shared/application/RandomSource'
import { ActAtNight } from './ActAtNight'
import { AdvancePhase } from './AdvancePhase'
import { CastVote } from './CastVote'
import { CloseLastWords } from './CloseLastWords'
import { DescribeChatAudience } from './DescribeChatAudience'
import { EndGame } from './EndGame'
import { ExtendTimer } from './ExtendTimer'
import { DiscardMatch } from './DiscardMatch'
import { IsMatchOver } from './IsMatchOver'
import { KeepPlaying } from './KeepPlaying'
import type { MatchPublisher, MatchRepository } from './ports'
import { LockVote } from './LockVote'
import { SetAlive } from './SetAlive'
import { SkipRevenge } from './SkipRevenge'
import { StartMatch } from './StartMatch'
import { SyncMatch } from './SyncMatch'
import { TakeRevenge } from './TakeRevenge'

export interface MatchDependencies {
  readonly matches: MatchRepository
  readonly publisher: MatchPublisher
  readonly clock: Clock
  readonly random: RandomSource
}

export const createMatchUseCases = ({ matches, publisher, clock, random }: MatchDependencies) => {
  const access = { matches, publisher, clock }
  return {
    startMatch: new StartMatch(access, random),
    syncMatch: new SyncMatch(access),
    advancePhase: new AdvancePhase(access),
    extendTimer: new ExtendTimer(access),
    setAlive: new SetAlive(access),
    endGame: new EndGame(access),
    keepPlaying: new KeepPlaying(access),
    actAtNight: new ActAtNight(access, random),
    castVote: new CastVote(access),
    lockVote: new LockVote(access),
    takeRevenge: new TakeRevenge(access),
    skipRevenge: new SkipRevenge(access),
    describeChatAudience: new DescribeChatAudience(matches),
    closeLastWords: new CloseLastWords(access),
    isMatchOver: new IsMatchOver(matches),
    discardMatch: new DiscardMatch(matches)
  }
}

export type MatchUseCases = ReturnType<typeof createMatchUseCases>
