import type { BotLanguage, HauntInput, NightActionInput, PlayerMatchView } from '@luna/contracts'
import type { BotMind, RandomNumbers } from './BotMind'

export const STRONG_SUSPICION = 0.85

export const livingOthers = (mind: BotMind, view: PlayerMatchView): string[] =>
  view.players.filter((player) => player.alive && player.id !== mind.memberId).map((player) => player.id)

const pickRandom = <T>(items: readonly T[], random: RandomNumbers): T | null =>
  items.length === 0 ? null : (items[Math.floor(random.next() * items.length)] as T)

export const mostSuspected = (mind: BotMind, candidates: readonly string[], random: RandomNumbers): string | null => {
  const best = Math.max(...candidates.map((candidate) => mind.scoreOf(candidate)))
  return pickRandom(
    candidates.filter((candidate) => mind.scoreOf(candidate) === best),
    random
  )
}

export const leastSuspected = (mind: BotMind, candidates: readonly string[], random: RandomNumbers): string | null => {
  const best = Math.min(...candidates.map((candidate) => mind.scoreOf(candidate)))
  return pickRandom(
    candidates.filter((candidate) => mind.scoreOf(candidate) === best),
    random
  )
}

export const mostAccused = (mind: BotMind, candidates: readonly string[]): string | null => {
  const ranked = candidates
    .map((candidate) => ({ candidate, count: mind.accusedToday.get(candidate) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((first, second) => second.count - first.count)
  return ranked[0]?.candidate ?? null
}

const nonAllies = (mind: BotMind, view: PlayerMatchView): string[] =>
  livingOthers(mind, view).filter((candidate) => !mind.allies.includes(candidate))

const claimedAmong = (mind: BotMind, candidates: readonly string[]): string[] =>
  candidates.filter((candidate) => {
    const role = mind.claims.get(candidate)
    return role !== undefined && role !== 'villager'
  })

const mostPicked = (picks: Readonly<Record<string, string>>, selfId: string): string | null => {
  const counts = new Map<string, number>()
  for (const [wolfId, targetId] of Object.entries(picks)) {
    if (wolfId !== selfId) counts.set(targetId, (counts.get(targetId) ?? 0) + 1)
  }
  return [...counts].sort((first, second) => second[1] - first[1])[0]?.[0] ?? null
}

const huntTargetOf = (
  mind: BotMind,
  view: PlayerMatchView,
  botIds: ReadonlySet<string>,
  random: RandomNumbers
): string | null => {
  const night = view.you.night
  if (night?.action !== 'hunt') return null
  const everyone = nonAllies(mind, view)
  const botPrey = everyone.filter((candidate) => botIds.has(candidate))
  const prey = view.round === 1 && botPrey.length > 0 ? botPrey : everyone
  const packChoice = mostPicked(night.packPicks, mind.memberId) ?? night.packVictimId
  if (packChoice !== null && prey.includes(packChoice)) return packChoice
  const claimed = claimedAmong(mind, prey)
  if (claimed.length > 0) return pickRandom(claimed, random)
  return pickRandom(prey, random)
}

const inspectTargetOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): string | null => {
  const seen = view.you.visions.map((vision) => vision.targetId)
  const unknown = livingOthers(mind, view).filter((candidate) => !seen.includes(candidate))
  return mostSuspected(mind, unknown.length > 0 ? unknown : livingOthers(mind, view), random)
}

const protectTargetOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): string | null => {
  const night = view.you.night
  const blocked = night?.action === 'protect' ? night.blockedTargetId : null
  const living = view.players.filter((player) => player.alive).map((player) => player.id)
  const allowed = living.filter((candidate) => candidate !== blocked)
  const claimed = claimedAmong(mind, allowed.filter((candidate) => candidate !== mind.memberId))
  if (claimed.length > 0) return pickRandom(claimed, random)
  if (allowed.includes(mind.memberId) && random.next() < 0.4) return mind.memberId
  return leastSuspected(mind, allowed.filter((candidate) => candidate !== mind.memberId), random)
}

const potionsOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): NightActionInput | null => {
  const night = view.you.night
  if (night?.action !== 'potions') return null
  const victim = night.victimId
  const heal =
    night.healAvailable &&
    victim !== null &&
    (view.round === 1 || victim === mind.memberId || mind.claims.has(victim))
  const suspect = mostSuspected(mind, livingOthers(mind, view), random)
  const poison =
    night.poisonAvailable && suspect !== null && suspect !== victim && mind.scoreOf(suspect) >= STRONG_SUSPICION
      ? suspect
      : null
  return { kind: 'potions', heal, poisonTargetId: poison }
}

export const nightActionOf = (
  mind: BotMind,
  view: PlayerMatchView,
  botIds: ReadonlySet<string>,
  random: RandomNumbers
): NightActionInput | null => {
  const action = view.you.night?.action
  if (action === undefined) return null
  if (action === 'potions') return potionsOf(mind, view, random)
  const targetId =
    action === 'hunt'
      ? huntTargetOf(mind, view, botIds, random)
      : action === 'inspect'
        ? inspectTargetOf(mind, view, random)
        : action === 'protect'
          ? protectTargetOf(mind, view, random)
          : mostSuspected(mind, livingOthers(mind, view), random)
  return targetId === null ? null : { kind: action, targetId }
}

export const voteTargetOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): string | null => {
  const candidates = nonAllies(mind, view)
  if (mind.isWolf) return mostAccused(mind, candidates) ?? mostSuspected(mind, candidates, random)
  if (mind.profile.personality === 'follower') {
    const crowd = mostAccused(mind, candidates)
    if (crowd !== null) return crowd
  }
  return mostSuspected(mind, candidates, random)
}

export const revengeTargetOf = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): string | null =>
  mostSuspected(mind, nonAllies(mind, view), random)

const WHISPERS: Readonly<Record<BotLanguage, readonly string[]>> = {
  es: ['buuu', 'te veo', 'huele a lobo', 'mocos...'],
  en: ['boooo', 'i see you', 'smells wolfy', 'slime...']
}

export const hauntOf = (
  mind: BotMind,
  view: PlayerMatchView,
  language: BotLanguage,
  random: RandomNumbers
): HauntInput | null => {
  if (view.you.haunt?.available !== true) return null
  const target = mostSuspected(mind, livingOthers(mind, view), random)
  if (target === null || random.next() < 0.4) return { kind: 'flicker' }
  return { kind: 'whisper', targetId: target, word: pickRandom(WHISPERS[language], random) ?? 'boo' }
}
