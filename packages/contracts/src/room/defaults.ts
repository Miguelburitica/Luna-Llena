import type { RoomSettingsView } from './views'

export const DEFAULT_ROOM_SETTINGS: RoomSettingsView = {
  theme: 'classic',
  timers: { night: 60, day: 180, vote: 60 },
  houseRules: { ghostPowers: true, lastWords: true, revealRoleOnDeath: true, anonymousVotes: false },
  deck: { werewolf: 2, villager: 0, seer: 1, doctor: 1, witch: 1, hunter: 1, fool: 1, drunk: 1 },
  botLanguage: 'es'
}
