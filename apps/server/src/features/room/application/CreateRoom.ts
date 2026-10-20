import {
  err,
  ok,
  PUBLIC_LOBBY_LIMITS,
  roomError,
  ROOM_VISIBILITIES,
  type CreateRoomInput,
  type Result,
  type RoomError,
  type RoomSession,
  type RoomVisibility
} from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { UNKNOWN_CLIENT, type ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { DisplayName } from '../domain/DisplayName'
import { Room } from '../domain/Room'
import type { RoomCode } from '../domain/RoomCode'
import { RoomName } from '../domain/RoomName'
import { RoomSettings } from '../domain/RoomSettings'
import { VoiceCallUrl } from '../domain/VoiceCallUrl'
import type { RoomCodeGenerator } from './ports'
import { requireNotBanned, reviewPublicName, saveAndPublish, type RoomAccess } from './roomAccess'
import { toRoomSession } from './roomViews'

const MAX_CODE_ATTEMPTS = 50

const visibilityOf = (raw: unknown): Result<RoomVisibility, RoomError> => {
  if (raw === undefined) return ok('private')
  const visibility = ROOM_VISIBILITIES.find((candidate) => candidate === raw)
  return visibility === undefined ? err(roomError('settings-invalid')) : ok(visibility)
}

export class CreateRoom {
  constructor(
    private readonly access: RoomAccess,
    private readonly codes: RoomCodeGenerator,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    input: Partial<Record<keyof CreateRoomInput, unknown>>,
    client: ClientIdentity = UNKNOWN_CLIENT
  ): Promise<Result<RoomSession, RoomError>> {
    const banned = await requireNotBanned(this.access.gate, client)
    if (!banned.ok) return banned
    const visibility = visibilityOf(input.visibility)
    if (!visibility.ok) return visibility
    const name = RoomName.create(input.roomName, visibility.value)
    if (!name.ok) return name
    const narratorName = DisplayName.create(input.narratorName)
    if (!narratorName.ok) return narratorName
    const settings = RoomSettings.fromInput(input.settings)
    if (!settings.ok) return settings
    const voiceCall = VoiceCallUrl.parse(input.voiceCallUrl)
    if (!voiceCall.ok) return voiceCall
    if (visibility.value === 'public' && (await this.publicRoomsOpenedFrom(client)) >= PUBLIC_LOBBY_LIMITS.maxPublicRoomsPerAddress) {
      return err(roomError('public-room-limit'))
    }
    const code = await this.freeCode()
    if (visibility.value === 'public') {
      const gate = this.access.gate
      const roomName = await reviewPublicName(gate, { roomCode: code.value, text: name.value.value, kind: 'room-name', client })
      if (!roomName.ok) return roomName
      const narrator = await reviewPublicName(gate, { roomCode: code.value, text: narratorName.value.value, kind: 'name', client })
      if (!narrator.ok) return narrator
    }
    const room = Room.open({
      code,
      name: name.value,
      settings: settings.value,
      voiceCall: voiceCall.value,
      visibility: visibility.value,
      openedBy: client,
      now: this.access.clock.now(),
      narrator: { id: this.ids.next(), token: this.ids.next(), name: narratorName.value, client }
    })
    await saveAndPublish(this.access, room)
    return ok(toRoomSession(room, room.narrator))
  }

  private async publicRoomsOpenedFrom(client: ClientIdentity): Promise<number> {
    const rooms = await this.access.rooms.all()
    return rooms.filter((room) => room.isPublic && room.openedBy?.address === client.address).length
  }

  private async freeCode(): Promise<RoomCode> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = this.codes.next()
      if ((await this.access.rooms.find(code)) === undefined) return code
    }
    throw new Error('No free room code found')
  }
}
