import { MODERATION_LIMITS, type ReportView, type StrikeView } from '@luna/contracts'
import type { ModerationRecords } from '../application/ports'
import { BanList } from '../domain/BanList'
import { ReviewBudget } from '../domain/ReviewBudget'
import { SignInLockout } from '../domain/SignInLockout'
import { StrikeLedger } from '../domain/StrikeLedger'

const keepRecent = <T>(entries: T[], entry: T): void => {
  entries.unshift(entry)
  if (entries.length > MODERATION_LIMITS.journalSize) entries.length = MODERATION_LIMITS.journalSize
}

export class InMemoryModeration implements ModerationRecords {
  readonly ledger = new StrikeLedger()
  readonly bans = new BanList()
  readonly lockout = new SignInLockout()
  private readonly budgets = new Map<string, ReviewBudget>()
  private readonly strikeLog: StrikeView[] = []
  private readonly reportLog: ReportView[] = []

  budgetOf(roomCode: string): ReviewBudget {
    const existing = this.budgets.get(roomCode)
    if (existing !== undefined) return existing
    const budget = new ReviewBudget()
    this.budgets.set(roomCode, budget)
    return budget
  }

  noteStrike(strike: StrikeView): void {
    keepRecent(this.strikeLog, strike)
  }

  noteReport(report: ReportView): void {
    keepRecent(this.reportLog, report)
  }

  strikes(): readonly StrikeView[] {
    return this.strikeLog
  }

  reports(): readonly ReportView[] {
    return this.reportLog
  }
}
