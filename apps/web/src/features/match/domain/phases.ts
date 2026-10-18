import { PHASES, type Phase } from '@luna/contracts'

export interface PhaseLook {
  readonly phaseClass: string
  readonly icon: string
}

export interface SeatPosition {
  readonly left: number
  readonly top: number
}

const PHASE_LOOKS: Readonly<Record<Phase, PhaseLook>> = {
  night: { phaseClass: 'ph-night', icon: 'moon' },
  dawn: { phaseClass: 'ph-dawn', icon: 'sunrise' },
  day: { phaseClass: 'ph-day', icon: 'sun' },
  vote: { phaseClass: 'ph-vote', icon: 'vote' },
  execution: { phaseClass: 'ph-vote', icon: 'pitchfork' }
}

const SEAT_CENTER = 50
const SEAT_RADIUS_X = 38
const SEAT_RADIUS_Y = 36
const FULL_TURN = Math.PI * 2
const MILLISECONDS_PER_SECOND = 1000
const WARNING_SECONDS = 10

const hundredth = (value: number): number => Math.round(value * 100) / 100

export const phaseLook = (phase: Phase): PhaseLook => PHASE_LOOKS[phase]

export const nextPhaseOf = (phase: Phase): Phase => PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length] ?? PHASES[0]

export const secondsLeft = (
  phaseEndsAt: number | null,
  serverNow: number,
  receivedAt: number,
  clientNow: number
): number | null => {
  if (phaseEndsAt === null) return null
  const remainingAtReceipt = phaseEndsAt - serverNow
  const elapsedSinceReceipt = clientNow - receivedAt
  return Math.max(0, Math.ceil((remainingAtReceipt - elapsedSinceReceipt) / MILLISECONDS_PER_SECOND))
}

export const seatPositions = (count: number): SeatPosition[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (FULL_TURN * index) / count
    return {
      left: hundredth(SEAT_CENTER + SEAT_RADIUS_X * Math.cos(angle)),
      top: hundredth(SEAT_CENTER + SEAT_RADIUS_Y * Math.sin(angle))
    }
  })

export const clockText = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export const sceneBackgroundOf = (phase: Phase): string => {
  if (phase === 'dawn') return 'bg-dawn'
  if (phase === 'day') return 'bg-day'
  return 'bg-night'
}

export const isTimerWarning = (seconds: number): boolean => seconds <= WARNING_SECONDS

export const timerProgress = (seconds: number, totalSeconds: number): number => {
  const total = Math.max(totalSeconds, seconds)
  return total === 0 ? 0 : Math.min(1, seconds / total)
}
