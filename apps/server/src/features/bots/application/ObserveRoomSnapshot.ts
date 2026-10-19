import type { RoomSnapshot } from '@luna/contracts'
import { rosterOf } from '../domain/BotRoster'
import { BotTable } from '../domain/BotTable'
import type { BotContext } from './ports'

export class ObserveRoomSnapshot {
  constructor(private readonly context: BotContext) {}

  execute(snapshot: RoomSnapshot): void {
    const roster = rosterOf(snapshot)
    const table = this.context.tables.find(snapshot.code)
    if (table === undefined) {
      if (roster.bots.size > 0) this.context.tables.save(new BotTable(roster))
      return
    }
    const backToLobby = roster.status === 'lobby' && table.roster.status === 'in-game'
    table.sync(roster)
    if (backToLobby) {
      this.context.scheduler.cancelAll(snapshot.code)
      table.reset()
    }
  }
}
