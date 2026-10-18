import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { ChooseAvatar } from './ChooseAvatar'
import { CreateRoom } from './CreateRoom'
import { JoinRoom } from './JoinRoom'
import { KickPlayer } from './KickPlayer'
import { LeaveRoom } from './LeaveRoom'
import { LookUpRoom } from './LookUpRoom'
import { MarkDisconnected } from './MarkDisconnected'
import type { RoomCodeGenerator, RoomPublisher, RoomRepository } from './ports'
import { ResumeSession } from './ResumeSession'
import { SetReady } from './SetReady'
import { StartGame } from './StartGame'
import { UpdateSettings } from './UpdateSettings'

export interface RoomDependencies {
  readonly rooms: RoomRepository
  readonly codes: RoomCodeGenerator
  readonly ids: IdGenerator
  readonly publisher: RoomPublisher
}

export const createRoomUseCases = ({ rooms, codes, ids, publisher }: RoomDependencies) => {
  const access = { rooms, publisher }
  return {
    createRoom: new CreateRoom(rooms, codes, ids),
    lookUpRoom: new LookUpRoom(rooms),
    joinRoom: new JoinRoom(access, ids),
    resumeSession: new ResumeSession(access),
    chooseAvatar: new ChooseAvatar(access),
    setReady: new SetReady(access),
    updateSettings: new UpdateSettings(access),
    kickPlayer: new KickPlayer(access),
    leaveRoom: new LeaveRoom(access),
    markDisconnected: new MarkDisconnected(access),
    startGame: new StartGame(access)
  }
}

export type RoomUseCases = ReturnType<typeof createRoomUseCases>
