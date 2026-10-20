import { DEFAULT_ROOM_SETTINGS, type MemberView, type RoomSnapshot } from '@luna/contracts'

export const memberView = (name: string, overrides: Partial<MemberView> = {}): MemberView => ({
  id: `id-${name}`,
  name,
  avatar: null,
  isNarrator: false,
  bot: null,
  ready: false,
  connected: true,
  muted: false,
  ...overrides
})

export const snapshotOf = (overrides: Partial<RoomSnapshot> = {}): RoomSnapshot => ({
  code: 'LUNA42',
  name: 'Los Primos · Viernes',
  status: 'lobby',
  visibility: 'private',
  voiceCallUrl: null,
  settings: DEFAULT_ROOM_SETTINGS,
  members: [memberView('Nico', { isNarrator: true }), memberView('Ana'), memberView('Caro')],
  botCast: null,
  startReadiness: {
    canStart: false,
    unmet: ['not-enough-players', 'deck-mismatch', 'players-not-ready'],
    notReadyMemberIds: ['id-Ana', 'id-Caro'],
    playerCount: 2,
    deckSize: 8
  },
  ...overrides
})
