import { ROOM_LIMITS, type StartCondition, type StartReadiness } from '@luna/contracts'
import type { Member } from './Member'
import type { RoomSettings } from './RoomSettings'

export const evaluateStartReadiness = (players: readonly Member[], settings: RoomSettings): StartReadiness => {
  const notReadyMemberIds = players.filter((player) => !player.isReadyToPlay).map((player) => player.id)
  const checks: ReadonlyArray<readonly [StartCondition, boolean]> = [
    ['not-enough-players', players.length < ROOM_LIMITS.minPlayersToStart],
    ['deck-mismatch', settings.deckSize !== players.length],
    ['no-wolves', settings.deck.werewolf === 0],
    ['players-not-ready', notReadyMemberIds.length > 0]
  ]
  const unmet = checks.filter(([, failing]) => failing).map(([condition]) => condition)
  return {
    canStart: unmet.length === 0,
    unmet,
    notReadyMemberIds,
    playerCount: players.length,
    deckSize: settings.deckSize
  }
}
