import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { ChooseAvatar } from './ChooseAvatar'
import { CreateRoom } from './CreateRoom'
import { JoinRoom } from './JoinRoom'
import { KickPlayer } from './KickPlayer'
import { LeaveRoom } from './LeaveRoom'
import { LookUpRoom } from './LookUpRoom'
import { MarkDisconnected } from './MarkDisconnected'
import type { GameStarter, RoomCodeGenerator, RoomPublisher, RoomRepository } from './ports'
import { PlayAgain } from './PlayAgain'
import { ResumeSession } from './ResumeSession'
import { SetReady } from './SetReady'
import { StartGame } from './StartGame'
import { UpdateSettings } from './UpdateSettings'

export interface RoomDependencies {
  readonly rooms: RoomRepository
  readonly codes: RoomCodeGenerator
  readonly ids: IdGenerator
  readonly publisher: RoomPublisher
  readonly starter: GameStarter
}

export const createRoomUseCases = ({ rooms, codes, ids, publisher, starter }: RoomDependencies) => {
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
    startGame: new StartGame(access, starter),
    playAgain: new PlayAgain(access, starter)
  }
}

export type RoomUseCases = ReturnType<typeof createRoomUseCases>
