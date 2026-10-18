import { ROOM_LIMITS, type StartCondition, type StartReadiness } from '@luna/contracts'
import type { Member } from './Member'

export const evaluateStartReadiness = (players: readonly Member[], deckSize: number): StartReadiness => {
  const notReadyMemberIds = players.filter((player) => !player.isReadyToPlay).map((player) => player.id)
  const checks: ReadonlyArray<readonly [StartCondition, boolean]> = [
    ['not-enough-players', players.length < ROOM_LIMITS.minPlayersToStart],
    ['deck-mismatch', deckSize !== players.length],
    ['players-not-ready', notReadyMemberIds.length > 0]
  ]
  const unmet = checks.filter(([, failing]) => failing).map(([condition]) => condition)
  return { canStart: unmet.length === 0, unmet, notReadyMemberIds, playerCount: players.length, deckSize }
}
