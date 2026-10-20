import type { AdminRoomView, ReportView, ReviewedTextKind, ReviewLabel, StrikeView } from '@luna/contracts'
import type { BanList } from '../domain/BanList'
import type { ReviewBudget } from '../domain/ReviewBudget'
import type { SignInLockout } from '../domain/SignInLockout'
import type { StrikeLedger } from '../domain/StrikeLedger'

export interface ContentClassifier {
  classify(text: string, kind: ReviewedTextKind, timeoutMs: number): Promise<ReviewLabel | null>
}

export interface ModerationRecords {
  readonly ledger: StrikeLedger
  readonly bans: BanList
  readonly lockout: SignInLockout
  budgetOf(roomCode: string): ReviewBudget
  noteStrike(strike: StrikeView): void
  noteReport(report: ReportView): void
  strikes(): readonly StrikeView[]
  reports(): readonly ReportView[]
}

export interface AdminSession {
  readonly id: string
  readonly expiresAt: number
}

export interface AdminSessions {
  start(now: number): AdminSession
  find(id: string, now: number): AdminSession | undefined
  end(id: string): void
}

export interface AdminSecret {
  readonly configured: boolean
  matches(token: unknown): boolean
}

export interface RoomDirectory {
  rooms(): Promise<readonly AdminRoomView[]>
  close(code: string): Promise<boolean>
}
