import type { PublicRoomCard } from '@luna/contracts'
import { publicListingOf } from '../domain/publicListing'
import type { RoomRepository } from './ports'

export class ListPublicRooms {
  constructor(private readonly rooms: RoomRepository) {}

  async execute(): Promise<PublicRoomCard[]> {
    return publicListingOf(await this.rooms.all())
  }
}
