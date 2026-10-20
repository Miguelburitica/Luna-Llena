import { answer } from '../../../shared/infrastructure/socketRequests'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { ModerationUseCases } from '../application/moderationUseCases'

export const registerAdminHandlers = (io: LunaServer, useCases: ModerationUseCases): void => {
  io.on('connection', (socket) => {
    const session = () => socket.data.adminSession
    answer(socket, 'admin:overview', () => useCases.moderationOverview.execute(session()))
    answer(socket, 'admin:ban', async (payload) => useCases.banClient.execute(session(), payload))
    answer(socket, 'admin:unban', async (payload) => useCases.liftBan.execute(session(), payload))
    answer(socket, 'admin:closeRoom', (payload) => useCases.closeRoomAsAdmin.execute(session(), payload))
  })
}
