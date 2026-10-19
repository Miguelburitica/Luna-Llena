import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { journalWith, START } from '../domain/tableJournal.fixtures'
import { createTableTestApp } from './Table.fixtures'
import { useTableCountdown } from './useTableCountdown'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})
afterEach(() => vi.useRealTimers())

const countdownFor = (phaseSteps: number) => {
  const test = createTableTestApp(journalWith())
  for (let step = 0; step < phaseSteps; step += 1) test.store.advance()
  const onTimeUp = vi.fn()
  const scope = effectScope()
  const countdown = test.app.runWithContext(() => scope.run(() => useTableCountdown(onTimeUp)))
  if (countdown === undefined) throw new Error('countdown did not start')
  return { ...test, countdown, onTimeUp, scope }
}

describe('useTableCountdown', () => {
  it('Day countdown: the day starts at 3:00', () => {
    const { countdown } = countdownFor(2)

    expect(countdown.seconds.value).toBe(180)
    expect(countdown.totalSeconds.value).toBe(180)
  })

  it("Time's up: fires once at zero and does not advance the phase", async () => {
    const { countdown, onTimeUp, store } = countdownFor(3)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(countdown.timeUp.value).toBe(true)
    expect(onTimeUp).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(onTimeUp).toHaveBeenCalledTimes(1)
    expect(store.view?.phase).toBe('vote')
  })

  it('has no countdown at dawn', () => {
    expect(countdownFor(1).countdown.seconds.value).toBeNull()
  })
})
