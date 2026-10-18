import { matchError, type MatchError, type Result } from '@luna/contracts'
import { answer, withSession, type Payload } from '../../../shared/infrastructure/socketRequests'
import type { LunaServer, LunaSocket, SessionBinding } from '../../../shared/infrastructure/socketTypes'
import type { MatchUseCases } from '../application/matchUseCases'

const asActor = <T>(
  socket: LunaSocket,
  command: (session: SessionBinding, payload: Payload) => Promise<Result<T, MatchError>>
) => withSession(socket, matchError('session-invalid'), command)

export const registerMatchHandlers = (io: LunaServer, useCases: MatchUseCases): void => {
  io.on('connection', (socket) => {
    answer(socket, 'match:sync', asActor(socket, (actor) => useCases.syncMatch.execute(actor)))
    answer(socket, 'match:advance', asActor(socket, (actor) => useCases.advancePhase.execute(actor)))
    answer(socket, 'match:extendTimer', asActor(socket, (actor) => useCases.extendTimer.execute(actor)))
    answer(socket, 'match:setAlive', asActor(socket, (actor, payload) => useCases.setAlive.execute(actor, payload)))
    answer(socket, 'match:endGame', asActor(socket, (actor) => useCases.endGame.execute(actor)))
    answer(socket, 'match:act', asActor(socket, (actor, payload) => useCases.actAtNight.execute(actor, payload)))
    answer(socket, 'match:vote', asActor(socket, (actor, payload) => useCases.castVote.execute(actor, payload.targetId)))
    answer(socket, 'match:lockVote', asActor(socket, (actor) => useCases.lockVote.execute(actor)))
    answer(socket, 'match:avenge', asActor(socket, (actor, payload) => useCases.takeRevenge.execute(actor, payload.targetId)))
    answer(socket, 'match:skipRevenge', asActor(socket, (actor) => useCases.skipRevenge.execute(actor)))
    answer(socket, 'match:haunt', asActor(socket, (actor, payload) => useCases.haunt.execute(actor, payload)))
    answer(socket, 'match:cue', asActor(socket, (actor, payload) => useCases.playCue.execute(actor, payload)))
    answer(socket, 'match:keepPlaying', asActor(socket, (actor) => useCases.keepPlaying.execute(actor)))
  })
}
