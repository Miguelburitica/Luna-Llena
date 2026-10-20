const LETTER_SWAPS: Readonly<Record<string, string>> = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', $: 's', '@': 'a', '5': 's', '7': 't' }

const BLOCKED_WORDS = {
  es: [
    'puta',
    'putas',
    'puto',
    'putos',
    'hijueputa',
    'hijoputa',
    'hijodeputa',
    'malparido',
    'malparida',
    'gonorrea',
    'pendejo',
    'pendeja',
    'maricon',
    'maricones',
    'verga',
    'culero',
    'culera',
    'zorra',
    'sudaca'
  ],
  en: [
    'fuck',
    'fucker',
    'fucking',
    'motherfucker',
    'bitch',
    'bitches',
    'cunt',
    'whore',
    'slut',
    'nigger',
    'nigga',
    'faggot',
    'fag',
    'retard',
    'asshole'
  ]
} as const

export const normalizeForMatch = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[0-9$@]/g, (character) => LETTER_SWAPS[character] ?? character)
    .replace(/(\p{L})\1+/gu, '$1')

const BLOCKED = new Set(Object.values(BLOCKED_WORDS).flat().map(normalizeForMatch))

export const blockedByWordList = (text: string): boolean =>
  normalizeForMatch(text)
    .split(/[^\p{L}]+/u)
    .some((word) => word.length > 0 && BLOCKED.has(word))
