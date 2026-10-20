import { PUBLIC_LOBBY_LIMITS, ROOM_LIMITS, type PublicRoomCard, type PublicRoomStatus } from '@luna/contracts'
import type { Room } from './Room'

const statusOf = (room: Room): PublicRoomStatus => {
  if (room.status === 'in-game') return 'in-progress'
  return room.players.length >= ROOM_LIMITS.maxPlayers ? 'full' : 'waiting'
}

export const publicRoomCardOf = (room: Room): PublicRoomCard => ({
  code: room.code.value,
  name: room.name.value,
  narratorName: room.narrator.name.value,
  playerCount: room.players.length,
  capacity: ROOM_LIMITS.maxPlayers,
  botCount: room.bots.length,
  deckSize: room.startReadiness.deckSize,
  status: statusOf(room),
  joinable: room.isAcceptingPlayers
})

export const publicListingOf = (roomsOldestFirst: readonly Room[]): PublicRoomCard[] =>
  roomsOldestFirst
    .map((room, age) => ({ room, age }))
    .filter(({ room }) => room.isListed)
    .sort(
      (first, second) =>
        Number(second.room.isAcceptingPlayers) - Number(first.room.isAcceptingPlayers) ||
        second.room.players.length - first.room.players.length ||
        second.age - first.age
    )
    .slice(0, PUBLIC_LOBBY_LIMITS.maxListedRooms)
    .map(({ room }) => publicRoomCardOf(room))
