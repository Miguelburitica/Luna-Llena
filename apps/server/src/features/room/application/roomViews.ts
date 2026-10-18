import { ROOM_LIMITS, type MemberView, type RoomSession, type RoomSnapshot, type RoomSummary } from '@luna/contracts'
import type { Member } from '../domain/Member'
import type { Room } from '../domain/Room'

const toMemberView = (member: Member): MemberView => ({
  id: member.id,
  name: member.name.value,
  avatar: member.avatar,
  isNarrator: member.isNarrator,
  ready: member.ready,
  connected: member.connected
})

export const toRoomSnapshot = (room: Room): RoomSnapshot => ({
  code: room.code.value,
  name: room.name.value,
  status: room.status,
  settings: {
    theme: room.settings.theme,
    timers: room.settings.timers,
    houseRules: room.settings.houseRules,
    deck: room.settings.deck
  },
  members: room.members.map(toMemberView),
  startReadiness: room.startReadiness,
  voiceCallUrl: room.voiceCall?.value ?? null
})

export const toRoomSummary = (room: Room): RoomSummary => ({
  code: room.code.value,
  name: room.name.value,
  narratorName: room.narrator.name.value,
  theme: room.settings.theme,
  playerCount: room.players.length,
  capacity: ROOM_LIMITS.maxPlayers,
  avatarsInUse: room.avatarsInUse,
  acceptingPlayers: room.isAcceptingPlayers,
  voiceCallUrl: room.voiceCall?.value ?? null
})

export const toRoomSession = (room: Room, member: Member): RoomSession => ({
  code: room.code.value,
  memberId: member.id,
  token: member.identity.token,
  snapshot: toRoomSnapshot(room)
})
