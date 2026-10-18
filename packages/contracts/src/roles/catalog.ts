export const ROLE_IDS = ['werewolf', 'villager', 'seer', 'doctor', 'witch', 'hunter', 'fool', 'drunk'] as const
export type RoleId = (typeof ROLE_IDS)[number]

export const TEAM_IDS = ['wolves', 'village', 'solo'] as const
export type TeamId = (typeof TEAM_IDS)[number]

export interface RoleDefinition {
  readonly team: TeamId
  readonly maxCopies: number
  readonly appearsAs: RoleId
}

export const ROLE_CATALOG: Readonly<Record<RoleId, RoleDefinition>> = {
  werewolf: { team: 'wolves', maxCopies: 4, appearsAs: 'werewolf' },
  villager: { team: 'village', maxCopies: 15, appearsAs: 'villager' },
  seer: { team: 'village', maxCopies: 1, appearsAs: 'seer' },
  doctor: { team: 'village', maxCopies: 1, appearsAs: 'doctor' },
  witch: { team: 'village', maxCopies: 1, appearsAs: 'witch' },
  hunter: { team: 'village', maxCopies: 1, appearsAs: 'hunter' },
  fool: { team: 'solo', maxCopies: 1, appearsAs: 'fool' },
  drunk: { team: 'village', maxCopies: 1, appearsAs: 'seer' }
}

export const ROLE_TEAMS: Readonly<Record<RoleId, TeamId>> = Object.fromEntries(
  ROLE_IDS.map((role) => [role, ROLE_CATALOG[role].team])
) as Record<RoleId, TeamId>

export const SPECIAL_ROLE_ORDER: readonly RoleId[] = ['seer', 'doctor', 'witch', 'hunter', 'fool', 'drunk']
