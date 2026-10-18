import { CHAT_CHANNELS, CHAT_LIMITS, type ChatChannel, type ChatMessage } from '@luna/contracts'

export type MessageLog = Readonly<Record<ChatChannel, readonly ChatMessage[]>>

export type LastSeen = Readonly<Record<ChatChannel, string | null>>

const byTime = (first: ChatMessage, second: ChatMessage): number =>
  first.sentAt - second.sentAt || first.id.localeCompare(second.id)

export const emptyLog = (): MessageLog => ({ village: [], wolves: [], ghosts: [] })

export const nothingSeen = (): LastSeen => ({ village: null, wolves: null, ghosts: null })

export const mergeMessages = (current: readonly ChatMessage[], incoming: readonly ChatMessage[]): ChatMessage[] => {
  const known = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) known.set(message.id, message)
  return [...known.values()].sort(byTime).slice(-CHAT_LIMITS.historyPerChannel)
}

export const chronological = (log: MessageLog, channels: readonly ChatChannel[] = CHAT_CHANNELS): ChatMessage[] =>
  channels.flatMap((channel) => log[channel]).sort(byTime)

export const latestIdOf = (messages: readonly ChatMessage[]): string | null => messages.at(-1)?.id ?? null

export const unreadCounts = (
  log: MessageLog,
  lastSeen: LastSeen,
  myId: string | undefined
): Readonly<Record<ChatChannel, number>> => {
  const countFor = (channel: ChatChannel): number => {
    const messages = log[channel]
    const seenIndex = messages.findIndex((message) => message.id === lastSeen[channel])
    return messages.slice(seenIndex + 1).filter((message) => message.authorId !== myId).length
  }
  return { village: countFor('village'), wolves: countFor('wolves'), ghosts: countFor('ghosts') }
}
