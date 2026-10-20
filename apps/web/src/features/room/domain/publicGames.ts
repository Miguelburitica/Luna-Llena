import type { PublicRoomCard, PublicRoomStatus } from '@luna/contracts'

export interface PublicGameFilters {
  readonly waitingOnly: boolean
  readonly freeSeatsOnly: boolean
}

export const DEFAULT_PUBLIC_GAME_FILTERS: PublicGameFilters = { waitingOnly: true, freeSeatsOnly: true }

export const filterPublicRooms = (rooms: readonly PublicRoomCard[], filters: PublicGameFilters): PublicRoomCard[] =>
  rooms.filter(
    (room) =>
      (!filters.waitingOnly || room.status !== 'in-progress') && (!filters.freeSeatsOnly || room.status !== 'full')
  )

const BADGE_CLASSES: Readonly<Record<PublicRoomStatus, string>> = {
  waiting: 'is-ok',
  'in-progress': '',
  full: 'is-warn'
}

export const statusBadgeClassOf = (status: PublicRoomStatus): string => BADGE_CLASSES[status]
