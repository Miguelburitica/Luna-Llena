import { ROLE_TEAMS, type RoleId, type TeamId } from '@luna/contracts'

const TEAM_CLASSES: Readonly<Record<TeamId, string>> = {
  wolves: 'team-wolf',
  village: 'team-village',
  solo: 'team-solo'
}

export const teamClassOf = (role: RoleId): string => TEAM_CLASSES[ROLE_TEAMS[role]]

export const teamClassFor = (team: TeamId): string => TEAM_CLASSES[team]

const TEAM_ICONS: Readonly<Record<TeamId, string>> = {
  wolves: 'paw',
  village: 'home',
  solo: 'sparkles'
}

export const teamIconFor = (team: TeamId): string => TEAM_ICONS[team]
