import type { PlayerMatchView } from '@luna/contracts'
import type { RandomNumbers } from './BotMind'

const SECOND = 1000

const between = (minimum: number, maximum: number, random: RandomNumbers): number =>
  Math.round(minimum + (maximum - minimum) * random.next())

const remainingOf = (view: PlayerMatchView): number | null =>
  view.phaseEndsAt === null ? null : view.phaseEndsAt - view.serverNow

const capped = (delay: number, ceiling: number): number => Math.max(SECOND, Math.min(delay, ceiling))

export const nightDelayOf = (view: PlayerMatchView, random: RandomNumbers): number => {
  const remaining = remainingOf(view)
  return capped(between(4 * SECOND, 20 * SECOND, random), remaining === null ? 30 * SECOND : remaining - 3 * SECOND)
}

export const voteDelayOf = (view: PlayerMatchView, random: RandomNumbers): number => {
  const remaining = remainingOf(view)
  return capped(between(10 * SECOND, 25 * SECOND, random), remaining === null ? 40 * SECOND : remaining - 8 * SECOND)
}

export const lockDelayOf = (view: PlayerMatchView): number => {
  const remaining = remainingOf(view)
  return remaining === null ? 45 * SECOND : Math.max(2 * SECOND, remaining - 5 * SECOND)
}

export const talkDelayOf = (minimumSeconds: number, maximumSeconds: number, random: RandomNumbers): number =>
  between(minimumSeconds * SECOND, maximumSeconds * SECOND, random)
