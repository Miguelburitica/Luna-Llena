import type { CreateRoomInput, Result, RoomError, RoomSession } from '@luna/contracts'
import { ok } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { DisplayName } from '../domain/DisplayName'
import { Room } from '../domain/Room'
import type { RoomCode } from '../domain/RoomCode'
import { RoomName } from '../domain/RoomName'
import { RoomSettings } from '../domain/RoomSettings'
import type { RoomCodeGenerator, RoomRepository } from './ports'
import { toRoomSession } from './roomViews'

const MAX_CODE_ATTEMPTS = 50

export class CreateRoom {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly codes: RoomCodeGenerator,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: Partial<Record<keyof CreateRoomInput, unknown>>): Promise<Result<RoomSession, RoomError>> {
    const name = RoomName.create(input.roomName)
    if (!name.ok) return name
    const narratorName = DisplayName.create(input.narratorName)
    if (!narratorName.ok) return narratorName
    const settings = RoomSettings.fromInput(input.settings)
    if (!settings.ok) return settings
    const room = Room.open({
      code: await this.freeCode(),
      name: name.value,
      settings: settings.value,
      narrator: { id: this.ids.next(), token: this.ids.next(), name: narratorName.value }
    })
    await this.rooms.save(room)
    return ok(toRoomSession(room, room.narrator))
  }

  private async freeCode(): Promise<RoomCode> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = this.codes.next()
      if ((await this.rooms.find(code)) === undefined) return code
    }
    throw new Error('No free room code found')
  }
}
