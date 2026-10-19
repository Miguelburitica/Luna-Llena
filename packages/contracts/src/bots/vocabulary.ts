export const BOT_PERSONALITIES = ['paranoid', 'follower', 'detective', 'chaos', 'quiet'] as const
export type BotPersonality = (typeof BOT_PERSONALITIES)[number]

export const BOT_DIFFICULTIES = ['easy', 'normal', 'sharp'] as const
export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number]

export const BOT_LANGUAGES = ['es', 'en'] as const
export type BotLanguage = (typeof BOT_LANGUAGES)[number]

export const BOT_NAMES = [
  'Moco-Bot',
  'Verruga 3000',
  'Baba-Tron',
  'Lagaña-Matic',
  'Mosca-Droid',
  'Chicle-X',
  'Slime-O',
  'Burbuja-9',
  'Pecueca-Bot',
  'Grumo-Tron',
  'Robo-Rancio',
  'Gusano-1'
] as const

export const BOT_LIMITS = { maxBots: 10, maxSpeechCallsPerGame: 150 } as const

export interface BotProfile {
  readonly personality: BotPersonality
  readonly difficulty: BotDifficulty
}
