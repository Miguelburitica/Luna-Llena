import { err, roomError, type Result, type RoomError, type RoomSession } from '@luna/contracts'
import { answer, type Payload } from '../../../shared/infrastructure/socketRequests'
import type { LunaServer, LunaSocket } from '../../../shared/infrastructure/socketTypes'
import type { Actor } from '../application/ports'
import type { RoomUseCases } from '../application/roomUseCases'
import { memberChannel, roomChannel } from './roomChannels'

const unbindSession = (socket: LunaSocket): void => {
  const previous = socket.data.session
  if (previous === undefined) return
  void socket.leave(roomChannel(previous.code))
  void socket.leave(memberChannel(previous.memberId))
  socket.data.session = undefined
}

const bindSession = (socket: LunaSocket, result: Result<RoomSession, RoomError>) => {
  if (!result.ok) return result
  unbindSession(socket)
  socket.data.session = { code: result.value.code, memberId: result.value.memberId }
  void socket.join([roomChannel(result.value.code), memberChannel(result.value.memberId)])
  return result
}

const asActor = (
  socket: LunaSocket,
  command: (actor: Actor, payload: Payload) => Promise<Result<void, RoomError>>
) => async (payload: Payload) => {
  const session = socket.data.session
  return session === undefined ? err(roomError('session-invalid')) : command(session, payload)
}

export const registerRoomHandlers = (io: LunaServer, useCases: RoomUseCases): void => {
  io.on('connection', (socket) => {
    answer(socket, 'room:create', async (payload) => bindSession(socket, await useCases.createRoom.execute(payload)))
    answer(socket, 'room:lookUp', (payload) => useCases.lookUpRoom.execute(payload))
    answer(socket, 'room:join', async (payload) => bindSession(socket, await useCases.joinRoom.execute(payload)))
    answer(socket, 'room:resume', async (payload) => bindSession(socket, await useCases.resumeSession.execute(payload)))
    answer(socket, 'room:chooseAvatar', asActor(socket, (actor, payload) => useCases.chooseAvatar.execute(actor, payload)))
    answer(socket, 'room:setReady', asActor(socket, (actor, payload) => useCases.setReady.execute(actor, payload)))
    answer(socket, 'room:updateSettings', asActor(socket, (actor, payload) => useCases.updateSettings.execute(actor, payload)))
    answer(socket, 'room:kick', asActor(socket, (actor, payload) => useCases.kickPlayer.execute(actor, payload)))
    answer(socket, 'room:start', asActor(socket, (actor) => useCases.startGame.execute(actor)))
    answer(
      socket,
      'room:leave',
      asActor(socket, async (actor) => {
        const result = await useCases.leaveRoom.execute(actor)
        if (result.ok) unbindSession(socket)
        return result
      })
    )

    socket.on('disconnect', async () => {
      const session = socket.data.session
      if (session === undefined) return
      const sameMemberSockets = await io.in(memberChannel(session.memberId)).fetchSockets()
      if (sameMemberSockets.length === 0) await useCases.markDisconnected.execute(session)
    })
  })
}
