import type { NarratorMatchView, RoleId } from '@luna/contracts'

export const NIGHT_POWERS = ['hunt', 'seer', 'drunk', 'protect', 'potions'] as const
export type NightPower = (typeof NIGHT_POWERS)[number]

export type StepStatus = 'pending' | 'logged' | 'pretend'

export interface ScriptStep {
  readonly power: NightPower
  readonly playerIds: readonly string[]
  readonly status: StepStatus
}

export const PRETEND_SECONDS = 8

const POWER_ROLES: Readonly<Record<NightPower, RoleId>> = {
  hunt: 'werewolf',
  seer: 'seer',
  drunk: 'drunk',
  protect: 'doctor',
  potions: 'witch'
}

const isAlive = (view: NarratorMatchView, id: string): boolean => view.players.some((player) => player.id === id && player.alive)

const statusOf = (view: NarratorMatchView, holders: readonly string[]): StepStatus => {
  const living = holders.filter((id) => isAlive(view, id))
  if (living.length === 0) return 'pretend'
  return living.some((id) => view.night?.actions[id]?.acted === true) ? 'logged' : 'pending'
}

export const nightScriptOf = (view: NarratorMatchView): ScriptStep[] => {
  if (view.night === null) return []
  return NIGHT_POWERS.flatMap((power) => {
    const holders = view.players.filter((player) => view.roles[player.id] === POWER_ROLES[power]).map((player) => player.id)
    if (holders.length === 0) return []
    const living = holders.filter((id) => isAlive(view, id))
    return [{ power, playerIds: living.length > 0 ? living : holders, status: statusOf(view, holders) }]
  })
}

export const unloggedSteps = (script: readonly ScriptStep[]): ScriptStep[] => script.filter((step) => step.status === 'pending')
