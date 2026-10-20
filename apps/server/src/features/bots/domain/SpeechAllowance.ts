import { BOT_LIMITS } from '@luna/contracts'

const MINUTE = 60_000

export class SpeechAllowance {
  private gameCalls = 0
  private lifetimeCalls = 0
  private recentCalls: number[] = []
  private readonly lastAnswers = new Map<string, number>()

  takeCall(now: number): boolean {
    this.recentCalls = this.recentCalls.filter((at) => at > now - MINUTE)
    const allowed =
      this.gameCalls < BOT_LIMITS.maxSpeechCallsPerGame &&
      this.lifetimeCalls < BOT_LIMITS.maxSpeechCallsPerRoom &&
      this.recentCalls.length < BOT_LIMITS.maxSpeechCallsPerMinute
    if (!allowed) return false
    this.gameCalls += 1
    this.lifetimeCalls += 1
    this.recentCalls.push(now)
    return true
  }

  mayAnswer(botId: string, askerId: string, now: number): boolean {
    const key = `${botId}:${askerId}`
    const last = this.lastAnswers.get(key)
    if (last !== undefined && now - last < BOT_LIMITS.answerCooldownSeconds * 1000) return false
    this.lastAnswers.set(key, now)
    return true
  }

  newGame(): void {
    this.gameCalls = 0
    this.lastAnswers.clear()
  }

  get callsThisGame(): number {
    return this.gameCalls
  }
}
