import { MODERATION_LIMITS } from '@luna/contracts'

const MINUTE = 60_000

export class ReviewBudget {
  private spent = 0
  private recent: number[] = []

  take(now: number): boolean {
    this.recent = this.recent.filter((at) => at > now - MINUTE)
    if (this.spent >= MODERATION_LIMITS.reviewsPerRoom || this.recent.length >= MODERATION_LIMITS.reviewsPerMinute) {
      return false
    }
    this.spent += 1
    this.recent.push(now)
    return true
  }
}
