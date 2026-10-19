import type { IdGenerator } from '../../../shared/application/IdGenerator'
import type { RandomSource } from '../../../shared/application/RandomSource'
import { AddBot } from './AddBot'
import { ChooseAvatar } from './ChooseAvatar'
import { CreateRoom } from './CreateRoom'
import { JoinRoom } from './JoinRoom'
import { KickPlayer } from './KickPlayer'
import { LeaveRoom } from './LeaveRoom'
import { LookUpRoom } from './LookUpRoom'
import { MarkDisconnected } from './MarkDisconnected'
import type { GameStarter, RoomCodeGenerator, RoomPublisher, RoomRepository } from './ports'
import { PlayAgain } from './PlayAgain'
import { RemoveBot } from './RemoveBot'
import { ResumeSession } from './ResumeSession'
import { SetReady } from './SetReady'
import { SetVoiceCall } from './SetVoiceCall'
import { StartGame } from './StartGame'
import { UpdateSettings } from './UpdateSettings'

export interface RoomDependencies {
  readonly rooms: RoomRepository
  readonly codes: RoomCodeGenerator
  readonly ids: IdGenerator
  readonly publisher: RoomPublisher
  readonly starter: GameStarter
  readonly random: RandomSource
}

export const createRoomUseCases = ({ rooms, codes, ids, publisher, starter, random }: RoomDependencies) => {
  const access = { rooms, publisher }
  return {
    createRoom: new CreateRoom(rooms, codes, ids),
    lookUpRoom: new LookUpRoom(rooms),
    joinRoom: new JoinRoom(access, ids),
    resumeSession: new ResumeSession(access),
    chooseAvatar: new ChooseAvatar(access),
    setReady: new SetReady(access),
    updateSettings: new UpdateSettings(access),
    setVoiceCall: new SetVoiceCall(access),
    kickPlayer: new KickPlayer(access),
    addBot: new AddBot(access, ids, random),
    removeBot: new RemoveBot(access),
    leaveRoom: new LeaveRoom(access),
    markDisconnected: new MarkDisconnected(access),
    startGame: new StartGame(access, starter),
    playAgain: new PlayAgain(access, starter)
  }
}

export type RoomUseCases = ReturnType<typeof createRoomUseCases>
