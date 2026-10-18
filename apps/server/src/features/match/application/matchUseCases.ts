import type { Clock } from '../../../shared/application/Clock'
import type { RandomSource } from '../../../shared/application/RandomSource'
import { ActAtNight } from './ActAtNight'
import { AdvancePhase } from './AdvancePhase'
import { EndGame } from './EndGame'
import { ExtendTimer } from './ExtendTimer'
import { KeepPlaying } from './KeepPlaying'
import type { MatchPublisher, MatchRepository } from './ports'
import { SetAlive } from './SetAlive'
import { StartMatch } from './StartMatch'
import { SyncMatch } from './SyncMatch'

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
    actAtNight: new ActAtNight(access, random)
  }
}

export type MatchUseCases = ReturnType<typeof createMatchUseCases>
