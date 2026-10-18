import type { RoleId } from '@luna/contracts'

export interface Seat {
  readonly memberId: string
  readonly role: RoleId
  alive: boolean
}
