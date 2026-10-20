import type { ChatMessage, PlayerMatchView, RoleId } from '@luna/contracts'
import type { BotMind, RandomNumbers } from './BotMind'
import type { BotRoster } from './BotRoster'

const PERSONALITY_NOISE = { paranoid: 0.25, follower: 0.1, detective: 0.1, chaos: 0.35, quiet: 0.1 } as const
const DIFFICULTY_SCALE = { easy: 1.6, normal: 1, sharp: 0.5 } as const
const CHAT_WEIGHT = { paranoid: 1.3, follower: 1.6, detective: 0.6, chaos: 1, quiet: 0.8 } as const

export const VOTE_EVIDENCE = 0.15
export const ACCUSATION_WEIGHT = 0.06
export const DEFENSE_WEIGHT = 0.03

const ACCUSATION = /(lobo|wolf|\bsus\b|suspect|sospech|mient|liar|lying|culpable|guilty|vot|kill|matar|fue (él|ella|el)|it was)/
const DEFENSE = /(inocente|innocent|conf[ií]o|trust|limpi|clean|no es (lobo|él|ella)|not (a |the )?wolf)/
const CLAIM =
  /(soy|i am|i'm|im)\s+(el |la |the |a )?(vidente|seer|doctora?|doctor|bruja|witch|cazador|hunter|aldeano|villager)/

const CLAIMED_ROLES: Readonly<Record<string, RoleId>> = {
  vidente: 'seer',
  seer: 'seer',
  doctor: 'doctor',
  doctora: 'doctor',
  bruja: 'witch',
  witch: 'witch',
  cazador: 'hunter',
  hunter: 'hunter',
  aldeano: 'villager',
  villager: 'villager'
}

export const noiseOf = (mind: BotMind): number =>
  PERSONALITY_NOISE[mind.profile.personality] * DIFFICULTY_SCALE[mind.profile.difficulty]

const seedScores = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): void => {
  for (const player of view.players) {
    if (player.id === mind.memberId || mind.suspicion.has(player.id)) continue
    mind.suspicion.set(player.id, Math.min(1, Math.max(0, 0.5 + (random.next() * 2 - 1) * noiseOf(mind))))
  }
}

const applyKnowledge = (mind: BotMind, view: PlayerMatchView): void => {
  for (const ally of view.you.packIds) mind.suspicion.set(ally, 0)
  for (const vision of view.you.visions) mind.suspicion.set(vision.targetId, vision.isWolf ? 1 : 0.05)
  for (const player of view.players) {
    if (player.revealedRole === null || player.id === mind.memberId) continue
    if (!view.you.packIds.includes(player.id)) mind.suspicion.set(player.id, player.revealedRole === 'werewolf' ? 1 : 0)
  }
}

const applyVerdict = (mind: BotMind, view: PlayerMatchView): void => {
  const verdict = view.verdict
  if (verdict === null || verdict.round <= mind.lastVerdictRound) return
  mind.lastVerdictRound = verdict.round
  const executed = view.players.find((player) => player.id === verdict.executedId)
  if (executed === undefined || executed.revealedRole === null) return
  const voters = verdict.tally.find((entry) => entry.targetId === executed.id)?.voterIds ?? []
  const delta = executed.revealedRole === 'werewolf' ? -VOTE_EVIDENCE : VOTE_EVIDENCE
  for (const voter of voters) mind.nudge(voter, delta)
}

const applyAttack = (mind: BotMind, view: PlayerMatchView): void => {
  const night = view.you.night
  if (view.phase === 'night' && night?.action === 'hunt' && night.packVictimId !== null) {
    mind.attack = { round: view.round, targetId: night.packVictimId }
  }
  const attack = mind.attack
  if (attack === null || view.dawn === null || view.dawn.round !== attack.round) return
  mind.attack = null
  const target = view.players.find((player) => player.id === attack.targetId)
  if (target?.alive === true) mind.survivors.set(attack.targetId, attack.round)
}

export const observeView = (mind: BotMind, view: PlayerMatchView, random: RandomNumbers): void => {
  const isNewDay = view.phase === 'day' && mind.view?.phase !== 'day'
  mind.view = view
  if (isNewDay) mind.accusedToday.clear()
  seedScores(mind, view, random)
  applyVerdict(mind, view)
  applyKnowledge(mind, view)
  applyAttack(mind, view)
}

const lower = (text: string): string => text.toLocaleLowerCase()

export const mentionsName = (text: string, name: string): boolean => {
  const normalized = lower(text)
  const full = lower(name)
  const head = full.split(/[\s-]+/)[0] ?? full
  return normalized.includes(full) || (head.length >= 4 && normalized.includes(head))
}

export const mentionedIds = (text: string, roster: BotRoster, exceptId: string): string[] =>
  [...roster.names].filter(([id, name]) => id !== exceptId && mentionsName(text, name)).map(([id]) => id)

export const accuses = (text: string): boolean => {
  const normalized = lower(text)
  return !DEFENSE.test(normalized) && ACCUSATION.test(normalized)
}

const targetsPack = (mind: BotMind, targetId: string): boolean =>
  mind.isWolf && (targetId === mind.memberId || mind.allies.includes(targetId))

export const observeChat = (mind: BotMind, message: ChatMessage, roster: BotRoster): void => {
  if (message.channel !== 'village' || message.authorId === mind.memberId) return
  const text = lower(message.text)
  const claim = CLAIM.exec(text)
  const claimedRole = claim?.[3] === undefined ? undefined : CLAIMED_ROLES[claim[3]]
  if (claimedRole !== undefined) mind.claims.set(message.authorId, claimedRole)
  const weight = CHAT_WEIGHT[mind.profile.personality]
  for (const targetId of mentionedIds(text, roster, message.authorId)) {
    if (DEFENSE.test(text)) mind.nudge(targetId, -DEFENSE_WEIGHT * weight)
    else if (ACCUSATION.test(text)) {
      mind.nudge(targetId, ACCUSATION_WEIGHT * weight)
      mind.accusedToday.set(targetId, (mind.accusedToday.get(targetId) ?? 0) + 1)
      if (targetsPack(mind, targetId)) mind.threats.set(message.authorId, (mind.threats.get(message.authorId) ?? 0) + 1)
    }
  }
}
