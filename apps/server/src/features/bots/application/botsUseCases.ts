import { ForgetRoom } from './ForgetRoom'
import { ObserveChatMessage } from './ObserveChatMessage'
import { ObserveMatchView } from './ObserveMatchView'
import { ObserveRoomSnapshot } from './ObserveRoomSnapshot'
import type { BotContext } from './ports'

export const createBotsUseCases = (context: BotContext) => ({
  observeRoomSnapshot: new ObserveRoomSnapshot(context),
  observeMatchView: new ObserveMatchView(context),
  observeChatMessage: new ObserveChatMessage(context),
  forgetRoom: new ForgetRoom(context)
})

export type BotsUseCases = ReturnType<typeof createBotsUseCases>
