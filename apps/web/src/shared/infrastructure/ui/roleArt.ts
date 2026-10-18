import type { RoleId } from '@luna/contracts'

const ROLE_ART_CLASSES: Readonly<Record<RoleId, string>> = {
  werewolf: 'r-wolf',
  villager: 'r-villager',
  seer: 'r-seer',
  doctor: 'r-doctor',
  witch: 'r-witch',
  hunter: 'r-hunter',
  fool: 'r-fool',
  drunk: 'r-drunk'
}

export const roleArtClassOf = (role: RoleId): string => ROLE_ART_CLASSES[role]
