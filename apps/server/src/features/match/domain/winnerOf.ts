import { ROLE_CATALOG, type TeamId } from '@luna/contracts'
import type { Seat } from './Seat'

export const winnerOf = (seats: readonly Seat[]): TeamId | null => {
  const living = seats.filter((seat) => seat.alive)
  const wolves = living.filter((seat) => ROLE_CATALOG[seat.role].team === 'wolves').length
  if (wolves === 0) return 'village'
  return wolves >= living.length - wolves ? 'wolves' : null
}
