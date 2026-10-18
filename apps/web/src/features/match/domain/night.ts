import type {
  MatchView,
  NarratorActionView,
  NightAction,
  PlayerMatchView,
  PlayerNightView,
  RoleId
} from '@luna/contracts'
import type { Seat } from './seating'

export type TargetBlock = 'self' | 'dead' | 'wolf' | 'last-night'

export type NightViewOf<Action extends NightAction> = Extract<PlayerNightView, { action: Action }>

export interface Target {
  readonly seat: Seat
  readonly blocked: TargetBlock | null
}

export interface Death {
  readonly id: string
  readonly role: RoleId | null
}

export interface ActionLine {
  readonly key: string
  readonly icon: string
  readonly targetId: string | null
  readonly outcome: 'wolf' | 'notWolf' | null
  readonly waiting: boolean
}

const SELF_BLOCKED: Readonly<Record<NightAction, boolean>> = {
  hunt: true,
  inspect: true,
  protect: false,
  potions: true,
  suspect: true
}

const OFFERED_BLOCKS: readonly (TargetBlock | null)[] = [null, 'last-night']

const ACTION_ICONS: Readonly<Record<NightAction, string>> = {
  hunt: 'paw',
  inspect: 'eye',
  protect: 'shield',
  potions: 'flask',
  suspect: 'help'
}

const DRUNK_ICON = 'beer'
const WAITING_ICON = 'hourglass'

const blockOf = (seat: Seat, night: PlayerNightView): TargetBlock | null => {
  if (!seat.alive) return 'dead'
  if (seat.isYou && SELF_BLOCKED[night.action]) return 'self'
  if (night.action === 'hunt' && seat.isPack) return 'wolf'
  if (night.action === 'protect' && night.blockedTargetId === seat.id) return 'last-night'
  return null
}

export const targetsFor = (view: PlayerMatchView, seats: readonly Seat[]): Target[] => {
  const night = view.you.night
  if (night === null) return []
  return seats.map((seat) => ({ seat, blocked: blockOf(seat, night) }))
}

export const offeredTargetsFor = (view: PlayerMatchView, seats: readonly Seat[]): Target[] =>
  targetsFor(view, seats).filter((target) => OFFERED_BLOCKS.includes(target.blocked))

export const packAgreement = (packPicks: Readonly<Record<string, string>>, packSize?: number): string | null => {
  const picks = Object.values(packPicks)
  const first = picks[0]
  if (first === undefined) return null
  if (picks.length < (packSize ?? picks.length)) return null
  return picks.every((pick) => pick === first) ? first : null
}

export const deathsAnnouncement = (view: MatchView): Death[] | null => {
  if (view.dawn === null) return null
  return view.dawn.deaths.map((id) => ({
    id,
    role: view.players.find((player) => player.id === id)?.revealedRole ?? null
  }))
}

export const actionLineOf = (action: NarratorActionView): ActionLine => {
  const line = (key: string, targetId: string | null = null, outcome: ActionLine['outcome'] = null): ActionLine => ({
    key,
    icon: ACTION_ICONS[action.action],
    targetId,
    outcome,
    waiting: false
  })
  if (!action.acted) {
    return { key: action.action === 'potions' ? 'deciding' : 'idle', icon: WAITING_ICON, targetId: null, outcome: null, waiting: true }
  }
  if (action.action === 'inspect') {
    const outcome = action.visionIsWolf ? 'wolf' : 'notWolf'
    return { ...line(action.fromDrunk ? 'drunkInspected' : 'inspected', action.targetId, outcome), icon: action.fromDrunk ? DRUNK_ICON : ACTION_ICONS.inspect }
  }
  if (action.action === 'potions') {
    if (action.heal && action.poisonTargetId !== null) return line('healAndPoison', action.poisonTargetId)
    if (action.heal) return line('heal')
    if (action.poisonTargetId !== null) return line('poison', action.poisonTargetId)
    return line('nothing')
  }
  if (action.action === 'hunt') return line('picked', action.targetId)
  if (action.action === 'protect') return line('protecting', action.targetId)
  return line('suspects', action.targetId)
}
