import { done, roomError, type Result, type RoomError, type RoomSession } from '@luna/contracts'
import { UNKNOWN_CLIENT } from '../../../shared/domain/ClientIdentity'
import { LOBBY_CHANNEL, memberChannel, roomChannel } from '../../../shared/infrastructure/socketChannels'
import { answer, withSession, type Payload } from '../../../shared/infrastructure/socketRequests'
import type { LunaServer, LunaSocket, SessionBinding } from '../../../shared/infrastructure/socketTypes'
import type { RoomUseCases } from '../application/roomUseCases'

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

const asActor = <T>(
  socket: LunaSocket,
  command: (session: SessionBinding, payload: Payload) => Promise<Result<T, RoomError>>
) => withSession(socket, roomError('session-invalid'), command)

export const registerRoomHandlers = (io: LunaServer, useCases: RoomUseCases): void => {
  io.on('connection', (socket) => {
    const client = socket.data.client ?? UNKNOWN_CLIENT
    answer(socket, 'room:create', async (payload) => bindSession(socket, await useCases.createRoom.execute(payload, client)))
    answer(socket, 'room:lookUp', (payload) => useCases.lookUpRoom.execute(payload))
    answer(socket, 'room:join', async (payload) => bindSession(socket, await useCases.joinRoom.execute(payload, client)))
    answer(socket, 'room:resume', async (payload) => bindSession(socket, await useCases.resumeSession.execute(payload)))
    answer(socket, 'room:chooseAvatar', asActor(socket, (actor, payload) => useCases.chooseAvatar.execute(actor, payload)))
    answer(socket, 'room:setReady', asActor(socket, (actor, payload) => useCases.setReady.execute(actor, payload)))
    answer(socket, 'room:updateSettings', asActor(socket, (actor, payload) => useCases.updateSettings.execute(actor, payload)))
    answer(socket, 'room:setVoiceCall', asActor(socket, (actor, payload) => useCases.setVoiceCall.execute(actor, payload)))
    answer(socket, 'room:kick', asActor(socket, (actor, payload) => useCases.kickPlayer.execute(actor, payload)))
    answer(socket, 'room:mute', asActor(socket, (actor, payload) => useCases.muteMember.execute(actor, payload)))
    answer(socket, 'lobby:watch', async () => {
      await socket.join(LOBBY_CHANNEL)
      return { ok: true, value: await useCases.listPublicRooms.execute() }
    })
    answer(socket, 'lobby:unwatch', async () => {
      await socket.leave(LOBBY_CHANNEL)
      return done
    })
    answer(socket, 'lobby:report', (payload) => useCases.reportRoom.execute(payload, client))
    answer(socket, 'room:addBot', asActor(socket, (actor, payload) => useCases.addBot.execute(actor, payload)))
    answer(socket, 'room:removeBot', asActor(socket, (actor, payload) => useCases.removeBot.execute(actor, payload)))
    answer(socket, 'room:start', asActor(socket, (actor) => useCases.startGame.execute(actor)))
    answer(socket, 'room:playAgain', asActor(socket, (actor) => useCases.playAgain.execute(actor)))
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
