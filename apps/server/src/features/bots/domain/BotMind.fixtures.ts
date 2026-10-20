import type { BotProfile, MatchPlayerView, PlayerMatchView, RoleId, TeamId } from '@luna/contracts'
import { BotMind } from './BotMind'
import type { BotRoster } from './BotRoster'

export const SELF = 'bot'
export const PLAYER_NAMES: Readonly<Record<string, string>> = {
  bot: 'Moco-Bot',
  ana: 'Ana',
  luis: 'Luis',
  tato: 'Tato',
  caro: 'Caro',
  pipe: 'Pipe',
  baba: 'Baba-Tron'
}

export const rosterFor = (language: 'en' | 'es' = 'en', bots: readonly string[] = [SELF, 'baba']): BotRoster => ({
  code: 'LUNA42',
  language,
  status: 'in-game',
  names: new Map(Object.entries(PLAYER_NAMES)),
  bots: new Map(bots.map((id) => [id, { personality: 'detective', difficulty: 'normal' } satisfies BotProfile])),
  mutedIds: new Set()
})

export const fixedRandom = (value = 0) => ({ next: () => value })

const players = (dead: readonly string[] = []): MatchPlayerView[] =>
  Object.keys(PLAYER_NAMES).map((id) => ({ id, alive: !dead.includes(id), revealedRole: null }))

export interface ViewSetup {
  readonly role?: RoleId
  readonly team?: TeamId
  readonly phase?: PlayerMatchView['phase']
  readonly round?: number
  readonly packIds?: readonly string[]
  readonly night?: PlayerMatchView['you']['night']
  readonly visions?: PlayerMatchView['you']['visions']
  readonly dead?: readonly string[]
  readonly players?: readonly MatchPlayerView[]
  readonly verdict?: PlayerMatchView['verdict']
}

export const playerView = (setup: ViewSetup = {}): PlayerMatchView => ({
  perspective: 'player',
  code: 'LUNA42',
  phase: setup.phase ?? 'night',
  round: setup.round ?? 1,
  phaseEndsAt: null,
  serverNow: 0,
  players: setup.players ?? players(setup.dead),
  outcome: null,
  dawn: null,
  voting: null,
  verdict: setup.verdict ?? null,
  revenge: null,
  soloWinnerIds: [],
  chat: { read: ['village'], write: ['village'], lastWordsUntil: null, villagePaused: false },
  you: {
    role: setup.role ?? 'villager',
    team: setup.team ?? 'village',
    packIds: setup.packIds ?? [],
    night: setup.night ?? null,
    visions: setup.visions ?? [],
    vote: null,
    haunt: null
  }
})

export const mindOf = (profile: Partial<BotProfile> = {}): BotMind =>
  new BotMind(SELF, 'Moco-Bot', { personality: 'detective', difficulty: 'normal', ...profile })
