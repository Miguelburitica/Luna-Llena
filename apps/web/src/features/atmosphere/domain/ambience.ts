import type { MatchView, Phase, SoundCue } from '@luna/contracts'

export type AmbientId = Phase | 'none'

export const STING_SPACING_MS = 2000

type AmbientMoment = Pick<MatchView, 'phase' | 'outcome'>

type StingMoment = Pick<MatchView, 'code' | 'phase' | 'round' | 'dawn' | 'verdict' | 'outcome' | 'soloWinnerIds'>

export const ambientFor = (view: AmbientMoment | null): AmbientId => (view === null || view.outcome !== null ? 'none' : view.phase)

export const stingsBetween = (previous: StingMoment | null, next: StingMoment): SoundCue[] => {
  if (previous === null || previous.code !== next.code) return []
  const stings: SoundCue[] = []
  const phaseChanged = previous.phase !== next.phase || previous.round !== next.round
  if (phaseChanged && next.phase === 'night') stings.push('howl')
  if (next.dawn !== null && next.dawn.round !== previous.dawn?.round) {
    stings.push(next.dawn.deaths.length > 0 ? 'bell' : 'rooster')
  }
  const verdict = next.verdict
  if (verdict !== null && verdict.round !== previous.verdict?.round) {
    stings.push('drumroll')
    if (verdict.executedId !== null) stings.push('scream')
    if (verdict.tie || verdict.foolWins) stings.push('trombone')
  }
  const soloWin = next.outcome !== null && previous.outcome === null && next.soloWinnerIds.length > 0
  if (soloWin && verdict?.foolWins !== true) stings.push('trombone')
  return stings
}
