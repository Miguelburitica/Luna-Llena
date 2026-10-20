import { describe, expect, it } from 'vitest'
import { createBotKit, HUMAN_ID } from './botsUseCases.fixtures'

describe('Seat takeover', () => {
  it('lets the bot that took a kicked seat play on with that role', async () => {
    const kit = createBotKit()
    await kit.start({ timers: { night: 45, day: 0, vote: 30 } })
    await kit.handOverHuman()
    for (let step = 0; step < 12 && kit.narratorView().phase !== 'vote'; step += 1) {
      await kit.scheduler.advance(60_000)
      await kit.matches.advancePhase.execute(kit.narrator)
    }
    const alive = kit.narratorView().players.find((player) => player.id === HUMAN_ID)?.alive
    await kit.scheduler.advance(30_000)
    const actedAsBot = kit.commands.filter((command) => command.actor.memberId === HUMAN_ID)
    expect(alive).toBe(true)
    expect(actedAsBot.some((command) => command.kind === 'vote')).toBe(true)
    expect(kit.rejected()).toEqual([])
  })
})
