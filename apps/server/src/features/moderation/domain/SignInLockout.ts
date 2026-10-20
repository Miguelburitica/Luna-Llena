import { MODERATION_LIMITS } from '@luna/contracts'

const MINUTE = 60_000
const { failuresToLock, failureWindowMinutes, lockMinutes } = MODERATION_LIMITS.admin

export class SignInLockout {
  private readonly failures = new Map<string, number[]>()
  private readonly lockedUntil = new Map<string, number>()

  isLocked(address: string, now: number): boolean {
    return (this.lockedUntil.get(address) ?? 0) > now
  }

  fail(address: string, now: number): void {
    const recent = [...(this.failures.get(address) ?? []).filter((at) => at > now - failureWindowMinutes * MINUTE), now]
    this.failures.set(address, recent)
    if (recent.length >= failuresToLock) this.lockedUntil.set(address, now + lockMinutes * MINUTE)
  }
}
