import { ROLE_IDS, type RoleId } from '@luna/contracts'
import type { Seat } from './Seat'

interface RandomNumbers {
  next(): number
}

const shuffled = <T>(items: readonly T[], random: RandomNumbers): T[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random.next() * (index + 1))
    ;[result[index], result[other]] = [result[other] as T, result[index] as T]
  }
  return result
}

export const dealRoles = (
  deck: Readonly<Record<RoleId, number>>,
  playerIds: readonly string[],
  random: RandomNumbers
): Seat[] => {
  const cards = ROLE_IDS.flatMap((role) => Array.from({ length: deck[role] }, () => role))
  return shuffled(cards, random).flatMap((role, position) => {
    const memberId = playerIds[position]
    return memberId === undefined ? [] : [{ memberId, role, alive: true }]
  })
}
