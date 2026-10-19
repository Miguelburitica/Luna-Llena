import type { PlayerMatchView } from '@luna/contracts'
import type { BotMind, RandomNumbers } from './BotMind'
import { nameIn, type BotRoster } from './BotRoster'
import { livingOthers, mostAccused, mostSuspected } from './decisions'

export interface SeerClaim {
  readonly subject: string
  readonly isWolf: boolean
}

export type BotIntent =
  | { readonly kind: 'open-day'; readonly subject: string; readonly claim: SeerClaim | null; readonly lie: boolean }
  | { readonly kind: 'answer'; readonly asker: string; readonly question: string; readonly subject: string; readonly lie: boolean }
  | { readonly kind: 'explain-vote'; readonly subject: string; readonly lie: boolean }
  | { readonly kind: 'react-dawn'; readonly deaths: readonly string[] }
  | { readonly kind: 'last-words'; readonly subject: string }
  | { readonly kind: 'wolf-plan'; readonly subject: string; readonly against: string | null }
  | { readonly kind: 'ghost'; readonly subject: string }

export type IntentKind = BotIntent['kind']

const lies = (mind: BotMind, view: PlayerMatchView): boolean => mind.isWolf || view.you.role === 'fool'

const blameTargetOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): string | null => {
  const candidates = livingOthers(mind, view).filter((candidate) => !mind.allies.includes(candidate))
  if (mind.isWolf) return mostAccused(mind, candidates) ?? mostSuspected(mind, candidates, random)
  return mostSuspected(mind, candidates, random)
}

const seerClaimOf = (mind: BotMind, view: PlayerMatchView, roster: BotRoster): SeerClaim | null => {
  if (view.you.role !== 'seer') return null
  const living = new Set(livingOthers(mind, view))
  const visions = view.you.visions.filter((vision) => living.has(vision.targetId))
  const wolf = visions.findLast((vision) => vision.isWolf)
  const latest = visions.at(-1)
  const difficulty = mind.profile.difficulty
  const chosen =
    wolf ?? (difficulty === 'easy' || (difficulty === 'normal' && view.round >= 2) ? latest : undefined)
  return chosen === undefined ? null : { subject: nameIn(roster, chosen.targetId), isWolf: chosen.isWolf }
}

export const openingIntentOf = (
  mind: BotMind,
  view: PlayerMatchView,
  roster: BotRoster,
  random: RandomNumbers
): BotIntent | null => {
  const claim = seerClaimOf(mind, view, roster)
  const subject = claim?.subject ?? nameIn(roster, blameTargetOf(mind, view, random))
  return subject === '' ? null : { kind: 'open-day', subject, claim, lie: lies(mind, view) }
}

export const answerIntentOf = (
  mind: BotMind,
  view: PlayerMatchView,
  roster: BotRoster,
  askerId: string,
  question: string,
  random: RandomNumbers
): BotIntent => ({
  kind: 'answer',
  asker: nameIn(roster, askerId),
  question,
  subject: nameIn(roster, blameTargetOf(mind, view, random)),
  lie: lies(mind, view)
})

export const voteIntentOf = (mind: BotMind, view: PlayerMatchView, roster: BotRoster, targetId: string): BotIntent => ({
  kind: 'explain-vote',
  subject: nameIn(roster, targetId),
  lie: lies(mind, view)
})

export const dawnIntentOf = (view: PlayerMatchView, roster: BotRoster): BotIntent | null => {
  const deaths = view.dawn?.deaths ?? []
  return deaths.length === 0 ? null : { kind: 'react-dawn', deaths: deaths.map((id) => nameIn(roster, id)) }
}

export const lastWordsIntentOf = (
  mind: BotMind,
  view: PlayerMatchView,
  roster: BotRoster,
  random: RandomNumbers
): BotIntent => ({ kind: 'last-words', subject: nameIn(roster, blameTargetOf(mind, view, random)) })

export const wolfPlanIntentOf = (view: PlayerMatchView, roster: BotRoster, selfId: string): BotIntent | null => {
  const night = view.you.night
  if (night?.action !== 'hunt' || night.targetId === null) return null
  const mine = night.targetId
  const rival = Object.entries(night.packPicks).find(([wolfId, targetId]) => wolfId !== selfId && targetId !== mine)
  return { kind: 'wolf-plan', subject: nameIn(roster, mine), against: rival === undefined ? null : nameIn(roster, rival[1]) }
}

export const ghostIntentOf = (
  mind: BotMind,
  view: PlayerMatchView,
  roster: BotRoster,
  random: RandomNumbers
): BotIntent => ({ kind: 'ghost', subject: nameIn(roster, mostSuspected(mind, livingOthers(mind, view), random)) })
