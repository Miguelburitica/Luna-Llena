export type VoiceCallProvider = 'discord' | 'meet' | 'zoom' | 'whatsapp' | 'jitsi' | 'other'

const EXACT_HOSTS: Readonly<Record<string, VoiceCallProvider>> = {
  'discord.gg': 'discord',
  'discord.com': 'discord',
  'meet.google.com': 'meet',
  'chat.whatsapp.com': 'whatsapp',
  'call.whatsapp.com': 'whatsapp',
  'meet.jit.si': 'jitsi'
}

const ZOOM_DOMAIN = 'zoom.us'
const FREE_CALL_HOST = 'meet.jit.si'
const FREE_CALL_PREFIX = 'LunaLlena-'

const hostnameOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export const providerOf = (url: string): VoiceCallProvider => {
  const hostname = hostnameOf(url)
  if (hostname === null) return 'other'
  if (hostname === ZOOM_DOMAIN || hostname.endsWith(`.${ZOOM_DOMAIN}`)) return 'zoom'
  return EXACT_HOSTS[hostname] ?? 'other'
}

export const freeCallFor = (code: string): string => `https://${FREE_CALL_HOST}/${FREE_CALL_PREFIX}${code}`
