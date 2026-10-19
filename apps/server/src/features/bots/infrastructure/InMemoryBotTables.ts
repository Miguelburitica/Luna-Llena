import type { BotTables } from '../application/ports'
import type { BotTable } from '../domain/BotTable'

export class InMemoryBotTables implements BotTables {
  private readonly tables = new Map<string, BotTable>()

  find(code: string): BotTable | undefined {
    return this.tables.get(code)
  }

  findByMember(memberId: string): BotTable | undefined {
    return [...this.tables.values()].find((table) => table.minds.has(memberId))
  }

  save(table: BotTable): void {
    this.tables.set(table.code, table)
  }

  forget(code: string): void {
    this.tables.delete(code)
  }
}
