import type { ChatMessage } from '@luna/contracts'

export type MessageStyle = 'msg-own' | 'msg-narr' | 'msg-last' | 'msg-ghost' | 'msg-wolf'

export const messageStyle = (message: ChatMessage, myId: string | undefined): MessageStyle | null => {
  if (message.kind === 'narrator') return 'msg-narr'
  if (message.authorId === myId) return 'msg-own'
  if (message.kind === 'last-words') return 'msg-last'
  if (message.channel === 'ghosts') return 'msg-ghost'
  if (message.channel === 'wolves') return 'msg-wolf'
  return null
}
