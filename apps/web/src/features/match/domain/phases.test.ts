import { PHASES } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { clockText, isTimerWarning, nextPhaseOf, sceneBackgroundOf, timerProgress, phaseLook, secondsLeft, seatPositions } from './phases'

describe('phase look', () => {
  it('gives every phase a class and an icon, execution sharing the vote look', () => {
    expect(PHASES.map((phase) => phaseLook(phase))).toEqual([
      { phaseClass: 'ph-night', icon: 'moon' },
      { phaseClass: 'ph-dawn', icon: 'sunrise' },
      { phaseClass: 'ph-day', icon: 'sun' },
      { phaseClass: 'ph-vote', icon: 'vote' },
      { phaseClass: 'ph-vote', icon: 'pitchfork' }
    ])
  })
})

describe('next phase', () => {
  it('follows the cycle and wraps from execution to night', () => {
    expect(nextPhaseOf('night')).toBe('dawn')
    expect(nextPhaseOf('vote')).toBe('execution')
    expect(nextPhaseOf('execution')).toBe('night')
  })
})

describe('seconds left', () => {
  it('is null when the phase has no end', () => {
    expect(secondsLeft(null, 1000, 5000, 6000)).toBeNull()
  })

  it('corrects for the offset between the server and this device', () => {
    expect(secondsLeft(61_000, 1000, 500_000, 500_000)).toBe(60)
  })

  it('counts down with the time since the view arrived', () => {
    expect(secondsLeft(61_000, 1000, 500_000, 520_000)).toBe(40)
  })

  it('never goes below zero', () => {
    expect(secondsLeft(61_000, 1000, 500_000, 900_000)).toBe(0)
  })
})

describe('clock text', () => {
  it('shows minutes and padded seconds', () => {
    expect(clockText(0)).toBe('0:00')
    expect(clockText(65)).toBe('1:05')
    expect(clockText(180)).toBe('3:00')
  })
})

describe('seat positions', () => {
  it('starts at the top and goes clockwise', () => {
    const seats = seatPositions(4)
    expect(seats[0]).toEqual({ left: 50, top: 14 })
    expect(seats[1]?.left).toBeGreaterThan(50)
    expect(seats[1]?.top).toBe(50)
    expect(seats[2]?.left).toBe(50)
    expect(seats[2]?.top).toBe(86)
    expect(seats[3]?.left).toBeLessThan(50)
  })

  it('places one distinct seat per player', () => {
    const seats = seatPositions(15)
    expect(seats).toHaveLength(15)
    expect(new Set(seats.map((seat) => `${seat.left},${seat.top}`)).size).toBe(15)
  })

  it('has no seats for nobody', () => {
    expect(seatPositions(0)).toEqual([])
  })
})

describe('timer ring', () => {
  it('warns from ten seconds down', () => {
    expect(isTimerWarning(11)).toBe(false)
    expect(isTimerWarning(10)).toBe(true)
    expect(isTimerWarning(0)).toBe(true)
  })

  it('fills in proportion to the time left, never beyond full', () => {
    expect(timerProgress(30, 60)).toBe(0.5)
    expect(timerProgress(90, 60)).toBe(1)
    expect(timerProgress(0, 0)).toBe(0)
  })
})

describe('scene background', () => {
  it('uses the dawn and day scenes and the night scene otherwise', () => {
    expect(sceneBackgroundOf('dawn')).toBe('bg-dawn')
    expect(sceneBackgroundOf('day')).toBe('bg-day')
    expect(['night', 'vote', 'execution'].map((phase) => sceneBackgroundOf(phase as 'night'))).toEqual(Array(3).fill('bg-night'))
  })
})
