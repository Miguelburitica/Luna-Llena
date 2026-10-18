export const ROLE_IDS = ['werewolf', 'villager', 'seer', 'doctor', 'witch', 'hunter', 'fool', 'drunk'] as const
export type RoleId = (typeof ROLE_IDS)[number]

export const TEAM_IDS = ['wolves', 'village', 'solo'] as const
export type TeamId = (typeof TEAM_IDS)[number]

export const NIGHT_ACTIONS = ['hunt', 'inspect', 'protect', 'potions', 'suspect'] as const
export type NightAction = (typeof NIGHT_ACTIONS)[number]

export interface RoleDefinition {
  readonly team: TeamId
  readonly maxCopies: number
  readonly appearsAs: RoleId
  readonly nightAction: NightAction
}

export const ROLE_CATALOG: Readonly<Record<RoleId, RoleDefinition>> = {
  werewolf: { team: 'wolves', maxCopies: 4, appearsAs: 'werewolf', nightAction: 'hunt' },
  villager: { team: 'village', maxCopies: 15, appearsAs: 'villager', nightAction: 'suspect' },
  seer: { team: 'village', maxCopies: 1, appearsAs: 'seer', nightAction: 'inspect' },
  doctor: { team: 'village', maxCopies: 1, appearsAs: 'doctor', nightAction: 'protect' },
  witch: { team: 'village', maxCopies: 1, appearsAs: 'witch', nightAction: 'potions' },
  hunter: { team: 'village', maxCopies: 1, appearsAs: 'hunter', nightAction: 'suspect' },
  fool: { team: 'solo', maxCopies: 1, appearsAs: 'fool', nightAction: 'suspect' },
  drunk: { team: 'village', maxCopies: 1, appearsAs: 'seer', nightAction: 'inspect' }
}

export const ROLE_TEAMS: Readonly<Record<RoleId, TeamId>> = Object.fromEntries(
  ROLE_IDS.map((role) => [role, ROLE_CATALOG[role].team])
) as Record<RoleId, TeamId>

export const SPECIAL_ROLE_ORDER: readonly RoleId[] = ['seer', 'doctor', 'witch', 'hunter', 'fool', 'drunk']
