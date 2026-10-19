import type { MatchView } from '@luna/contracts'
import { observeView } from '../domain/suspicion'
import { planPhase, reactWithinPhase } from './botTurns'
import type { BotContext } from './ports'

export class ObserveMatchView {
  constructor(private readonly context: BotContext) {}

  execute(code: string, memberId: string, view: MatchView): void {
    if (view.perspective !== 'player') return
    const table = this.context.tables.find(code)
    const mind = table?.minds.get(memberId)
    if (table === undefined || mind === undefined) return
    observeView(mind, view, this.context.random)
    if (view.outcome !== null) {
      this.context.scheduler.cancelAll(code)
      return
    }
    const phaseKey = `${view.round}:${view.phase}`
    if (phaseKey !== mind.phaseKey) {
      mind.phaseKey = phaseKey
      planPhase(this.context, table, mind, view)
    }
    reactWithinPhase(this.context, table, mind, view)
  }
}
