import { CHAT_CHANNELS, type ChatAccess, type ChatChannel } from '@luna/contracts'

export const MONITOR_TABS = ['all', ...CHAT_CHANNELS] as const
export type MonitorTab = (typeof MONITOR_TABS)[number]

const CHANNEL_ICONS: Readonly<Record<ChatChannel, string>> = {
  village: 'home',
  wolves: 'paw',
  ghosts: 'ghost'
}

export const channelIconOf = (channel: ChatChannel): string => CHANNEL_ICONS[channel]

export const visibleTabs = (access: ChatAccess): ChatChannel[] =>
  CHAT_CHANNELS.filter((channel) => access.read.includes(channel))

export const isDead = (access: ChatAccess): boolean => access.read.includes('ghosts')

export const defaultTab = (access: ChatAccess): ChatChannel => {
  if (isDead(access)) return 'ghosts'
  return visibleTabs(access)[0] ?? 'village'
}

export const monitorChannels = (tab: MonitorTab): readonly ChatChannel[] => (tab === 'all' ? CHAT_CHANNELS : [tab])
