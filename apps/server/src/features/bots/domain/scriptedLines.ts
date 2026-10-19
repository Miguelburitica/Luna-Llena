import type { BotLanguage, BotPersonality } from '@luna/contracts'
import type { RandomNumbers } from './BotMind'
import type { BotIntent } from './intents'

type Template = (intent: BotIntent) => string

const subjectOf = (intent: BotIntent): string => ('subject' in intent ? intent.subject : '')

const TEMPLATES: Readonly<Record<BotLanguage, Readonly<Record<BotIntent['kind'], readonly Template[]>>>> = {
  en: {
    'open-day': [
      (intent) => `Morning, slime balls. ${subjectOf(intent)} is acting weird. Just saying.`,
      (intent) => `I don't trust ${subjectOf(intent)}. Too calm for a night like that.`,
      (intent) => `Anyone else smell wolf on ${subjectOf(intent)}?`
    ],
    answer: [
      (intent) => `Me?? Nah. Look at ${subjectOf(intent)} instead.`,
      (intent) => `I'm clean as a fresh booger. ${subjectOf(intent)} is the shady one.`,
      (intent) => `Good question, wrong slimeball. Ask ${subjectOf(intent)}.`
    ],
    'explain-vote': [
      (intent) => `Voted ${subjectOf(intent)}. Gut feeling, slimy gut.`,
      (intent) => `${subjectOf(intent)} gets my vote. Too many excuses.`
    ],
    'react-dawn': [
      (intent) => `Nooo, ${'deaths' in intent ? intent.deaths.join(' and ') : ''}! Who did this?!`,
      () => 'Ugh. Another one. The wolves are hungry.'
    ],
    'last-words': [
      (intent) => `Remember this: it was ${subjectOf(intent)}. Bleh.`,
      (intent) => `I'm out... keep an eye on ${subjectOf(intent)}!`
    ],
    'wolf-plan': [
      (intent) => `I'm going for ${subjectOf(intent)} tonight. Yum.`,
      (intent) => `${subjectOf(intent)} looks tasty. Join me?`
    ],
    ghost: [
      (intent) => `Booo. From up here ${subjectOf(intent)} looks guilty.`,
      () => 'Being dead is sticky. Anyway.'
    ]
  },
  es: {
    'open-day': [
      (intent) => `Buenos días, babosos. ${subjectOf(intent)} anda muy raro. Solo digo.`,
      (intent) => `Yo no le creo a ${subjectOf(intent)}. Muy tranquilo para semejante noche.`,
      (intent) => `¿A nadie más le huele a lobo ${subjectOf(intent)}?`
    ],
    answer: [
      (intent) => `¿Yo?? Nada que ver, parce. Miren a ${subjectOf(intent)}.`,
      (intent) => `Estoy más limpio que moco nuevo. El raro es ${subjectOf(intent)}.`,
      (intent) => `Buena pregunta, baboso equivocado. Pregúntenle a ${subjectOf(intent)}.`
    ],
    'explain-vote': [
      (intent) => `Voté por ${subjectOf(intent)}. Corazonada, una corazonada babosa.`,
      (intent) => `Mi voto va para ${subjectOf(intent)}. Mucha excusa.`
    ],
    'react-dawn': [
      (intent) => `Nooo, ${'deaths' in intent ? intent.deaths.join(' y ') : ''}! ¿Quién hizo esto?!`,
      () => 'Uy no. Otro más. Los lobos tienen hambre.'
    ],
    'last-words': [
      (intent) => `Acuérdense: fue ${subjectOf(intent)}. Bleh.`,
      (intent) => `Me voy... ¡píllense a ${subjectOf(intent)}!`
    ],
    'wolf-plan': [
      (intent) => `Esta noche voy por ${subjectOf(intent)}. Ñam.`,
      (intent) => `${subjectOf(intent)} se ve sabroso. ¿Me acompañan?`
    ],
    ghost: [
      (intent) => `Buuu. Desde acá arriba ${subjectOf(intent)} se ve culpable.`,
      () => 'Estar muerto es pegajoso. En fin.'
    ]
  }
}

const FLAVOR: Readonly<Record<BotPersonality, (line: string) => string>> = {
  paranoid: (line) => `${line.replace(/[.!?]*$/, '')}!!`,
  follower: (line) => `+1. ${line}`,
  detective: (line) => line,
  chaos: (line) => `${line} jeje`,
  quiet: (line) => (line.length <= 60 ? line : (line.split(/(?<=[.!?])\s/)[0] ?? line))
}

export const scriptedLineOf = (
  intent: BotIntent,
  language: BotLanguage,
  personality: BotPersonality,
  random: RandomNumbers
): string => {
  const options = TEMPLATES[language][intent.kind]
  const template = options[Math.floor(random.next() * options.length)] ?? options[0]
  const line = template === undefined ? '...' : template(intent)
  return FLAVOR[personality](line).slice(0, 240)
}
