import { chatError, type ChatError, type Result } from '@luna/contracts'
import { UNKNOWN_CLIENT } from '../../../shared/domain/ClientIdentity'
import { answer, withSession, type Payload } from '../../../shared/infrastructure/socketRequests'
import type { LunaServer, LunaSocket, SessionBinding } from '../../../shared/infrastructure/socketTypes'
import type { ChatUseCases } from '../application/chatUseCases'

const asActor = <T>(
  socket: LunaSocket,
  command: (session: SessionBinding, payload: Payload) => Promise<Result<T, ChatError>>
) => withSession(socket, chatError('session-invalid'), command)

export const registerChatHandlers = (io: LunaServer, useCases: ChatUseCases): void => {
  io.on('connection', (socket) => {
    answer(
      socket,
      'chat:send',
      asActor(socket, (actor, payload) => useCases.sendMessage.execute(actor, payload, socket.data.client ?? UNKNOWN_CLIENT))
    )
    answer(socket, 'chat:history', asActor(socket, (actor) => useCases.chatHistory.execute(actor)))
  })
}
