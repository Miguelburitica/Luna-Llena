import type { BotProfile, PlayerMatchView, RoleId } from '@luna/contracts'

export interface RandomNumbers {
  next(): number
}

export class BotMind {
  readonly suspicion = new Map<string, number>()
  readonly accusedToday = new Map<string, number>()
  readonly claims = new Map<string, RoleId>()
  readonly threats = new Map<string, number>()
  readonly survivors = new Map<string, number>()
  attack: { readonly round: number; readonly targetId: string } | null = null
  readonly done = new Set<string>()
  view: PlayerMatchView | null = null
  phaseKey = ''
  lastVerdictRound = 0
  lastDawnRound = 0

  constructor(
    readonly memberId: string,
    readonly name: string,
    readonly profile: BotProfile
  ) {}

  get allies(): readonly string[] {
    return this.view?.you.packIds ?? []
  }

  get isWolf(): boolean {
    return this.view?.you.team === 'wolves'
  }

  get isAlive(): boolean {
    return this.view?.players.find((player) => player.id === this.memberId)?.alive ?? false
  }

  scoreOf(memberId: string): number {
    return this.suspicion.get(memberId) ?? 0.5
  }

  nudge(memberId: string, delta: number): void {
    if (memberId === this.memberId || this.allies.includes(memberId)) return
    this.suspicion.set(memberId, Math.min(1, Math.max(0, this.scoreOf(memberId) + delta)))
  }

  markOnce(key: string): boolean {
    if (this.done.has(key)) return false
    this.done.add(key)
    return true
  }
}
