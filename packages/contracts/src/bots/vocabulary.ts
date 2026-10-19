export const BOT_PERSONALITIES = ['paranoid', 'follower', 'detective', 'chaos', 'quiet'] as const
export type BotPersonality = (typeof BOT_PERSONALITIES)[number]

export const BOT_DIFFICULTIES = ['easy', 'normal', 'sharp'] as const
export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number]

export const BOT_LANGUAGES = ['es', 'en'] as const
export type BotLanguage = (typeof BOT_LANGUAGES)[number]

export const BOT_CAST_IDS = ['solitude', 'musketeers', 'quixote', 'alice', 'odyssey', 'oz'] as const
export type BotCastId = (typeof BOT_CAST_IDS)[number]

export const BOT_CASTS: Readonly<Record<BotCastId, Readonly<Record<BotLanguage, readonly string[]>>>> = {
  solitude: {
    es: ['Aureliano', 'José Arcadio', 'Úrsula', 'Amaranta', 'Remedios', 'Rebeca', 'Melquíades', 'Pilar Ternera', 'Fernanda', 'Meme', 'Pietro Crespi', 'Petra Cotes'],
    en: ['Aureliano', 'José Arcadio', 'Úrsula', 'Amaranta', 'Remedios', 'Rebeca', 'Melquíades', 'Pilar Ternera', 'Fernanda', 'Meme', 'Pietro Crespi', 'Petra Cotes']
  },
  musketeers: {
    es: ["D'Artagnan", 'Athos', 'Porthos', 'Aramis', 'Milady', 'Richelieu', 'Rochefort', 'Constance', 'Planchet', 'Tréville', 'Buckingham', 'Mousqueton'],
    en: ["D'Artagnan", 'Athos', 'Porthos', 'Aramis', 'Milady', 'Richelieu', 'Rochefort', 'Constance', 'Planchet', 'Tréville', 'Buckingham', 'Mousqueton']
  },
  quixote: {
    es: ['Don Quijote', 'Sancho Panza', 'Dulcinea', 'Rocinante', 'Sansón Carrasco', 'Teresa Panza', 'Maritornes', 'Maese Nicolás', 'Altisidora', 'Ginés', 'Cide Hamete', 'Dorotea'],
    en: ['Don Quixote', 'Sancho Panza', 'Dulcinea', 'Rocinante', 'Sansón Carrasco', 'Teresa Panza', 'Maritornes', 'Master Nicholas', 'Altisidora', 'Ginés', 'Cide Hamete', 'Dorotea']
  },
  alice: {
    es: ['Alicia', 'Sombrerero Loco', 'Liebre de Marzo', 'Gato de Cheshire', 'Reina de Corazones', 'Conejo Blanco', 'Oruga Azul', 'Lirón', 'Tweedledum', 'Tweedledee', 'Duquesa', 'Grifo'],
    en: ['Alice', 'Mad Hatter', 'March Hare', 'Cheshire Cat', 'Queen of Hearts', 'White Rabbit', 'Caterpillar', 'Dormouse', 'Tweedledum', 'Tweedledee', 'Duchess', 'Gryphon']
  },
  odyssey: {
    es: ['Ulises', 'Penélope', 'Telémaco', 'Circe', 'Calipso', 'Polifemo', 'Nausícaa', 'Eumeo', 'Argos', 'Atenea', 'Antínoo', 'Euriclea'],
    en: ['Odysseus', 'Penelope', 'Telemachus', 'Circe', 'Calypso', 'Polyphemus', 'Nausicaa', 'Eumaeus', 'Argos', 'Athena', 'Antinous', 'Eurycleia']
  },
  oz: {
    es: ['Dorothy', 'Espantapájaros', 'Hombre de Hojalata', 'León Cobarde', 'Toto', 'Glinda', 'Bruja del Oeste', 'Mago de Oz', 'Tía Em', 'Tío Henry', 'Bruja del Norte', 'Mono Alado'],
    en: ['Dorothy', 'Scarecrow', 'Tin Man', 'Cowardly Lion', 'Toto', 'Glinda', 'Wicked Witch', 'Wizard of Oz', 'Aunt Em', 'Uncle Henry', 'Good Witch', 'Winged Monkey']
  }
}

export const BOT_LIMITS = { maxBots: 10, maxSpeechCallsPerGame: 150 } as const

export interface BotProfile {
  readonly personality: BotPersonality
  readonly difficulty: BotDifficulty
}
