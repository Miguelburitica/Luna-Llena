import type { BotLanguage, BotPersonality } from '@luna/contracts'
import type { RandomNumbers } from './BotMind'
import type { BotIntent } from './intents'

type Template = (intent: BotIntent) => string

const subjectOf = (intent: BotIntent): string => ('subject' in intent ? intent.subject : '')
const deathsOf = (intent: BotIntent, joiner: string): string => ('deaths' in intent ? intent.deaths.join(joiner) : '')
const askerOf = (intent: BotIntent): string => ('asker' in intent ? intent.asker : '')

const TEMPLATES: Readonly<Record<BotLanguage, Readonly<Record<BotIntent['kind'], readonly Template[]>>>> = {
  en: {
    'open-day': [
      (intent) => `Morning, slime balls. ${subjectOf(intent)} is acting weird. Just saying.`,
      (intent) => `I don't trust ${subjectOf(intent)}. Too calm for a night like that.`,
      (intent) => `Anyone else smell wolf on ${subjectOf(intent)}?`,
      (intent) => `My gut says ${subjectOf(intent)}, and my gut is never wrong. Mostly.`,
      (intent) => `${subjectOf(intent)} has been dodging every question. Funny, huh?`,
      (intent) => `Let's talk about ${subjectOf(intent)}. Where were you, exactly?`
    ],
    answer: [
      (intent) => `Me?? Nah, ${askerOf(intent)}. Look at ${subjectOf(intent)} instead.`,
      (intent) => `I'm clean as a fresh booger. ${subjectOf(intent)} is the shady one.`,
      (intent) => `Good question, wrong slimeball. Ask ${subjectOf(intent)}.`,
      (intent) => `I was home picking my nose, ${askerOf(intent)}. ${subjectOf(intent)} wasn't.`,
      (intent) => `Why ask me? ${subjectOf(intent)} went very quiet when the wolves showed up.`,
      (intent) => `Accusing me is exactly what ${subjectOf(intent)} would want, ${askerOf(intent)}.`
    ],
    'explain-vote': [
      (intent) => `Voted ${subjectOf(intent)}. Gut feeling, slimy gut.`,
      (intent) => `${subjectOf(intent)} gets my vote. Too many excuses.`,
      (intent) => `My vote goes to ${subjectOf(intent)}. Prove me wrong.`,
      (intent) => `${subjectOf(intent)}. Sorry, not sorry.`,
      (intent) => `Going with ${subjectOf(intent)}. Something smells off.`
    ],
    'react-dawn': [
      (intent) => `Nooo, ${deathsOf(intent, ' and ')}! Who did this?!`,
      () => 'Ugh. Another one. The wolves are hungry.',
      (intent) => `Rest in slime, ${deathsOf(intent, ' and ')}.`,
      (intent) => `${deathsOf(intent, ' and ')}... I didn't see that coming.`,
      () => 'Someone here is sleeping way too well at night.'
    ],
    'last-words': [
      (intent) => `Remember this: it was ${subjectOf(intent)}. Bleh.`,
      (intent) => `I'm out... keep an eye on ${subjectOf(intent)}!`,
      (intent) => `Avenge me! Start with ${subjectOf(intent)}.`,
      (intent) => `Tell my warts I loved them. And watch ${subjectOf(intent)}.`
    ],
    'wolf-plan': [
      (intent) => `I'm going for ${subjectOf(intent)} tonight. Yum.`,
      (intent) => `${subjectOf(intent)} looks tasty. Join me?`,
      (intent) => `${subjectOf(intent)} is getting too smart. Tonight.`,
      (intent) => `Same plate: ${subjectOf(intent)}.`,
      (intent) => `Let's eat ${subjectOf(intent)} before they talk.`
    ],
    ghost: [
      (intent) => `Booo. From up here ${subjectOf(intent)} looks guilty.`,
      () => 'Being dead is sticky. Anyway.',
      (intent) => `I'm haunting ${subjectOf(intent)} tonight.`,
      () => 'The afterlife smells like old cheese.'
    ]
  },
  es: {
    'open-day': [
      (intent) => `Buenos días, babosos. ${subjectOf(intent)} anda muy raro. Solo digo.`,
      (intent) => `Yo no le creo a ${subjectOf(intent)}. Muy tranquilo para semejante noche.`,
      (intent) => `¿A nadie más le huele a lobo ${subjectOf(intent)}?`,
      (intent) => `Mi intuición dice ${subjectOf(intent)}, y mi intuición casi nunca falla.`,
      (intent) => `${subjectOf(intent)} se ha escurrido de todas las preguntas. Curioso, ¿no?`,
      (intent) => `Hablemos de ${subjectOf(intent)}. ¿Dónde estabas exactamente, ah?`
    ],
    answer: [
      (intent) => `¿Yo?? Nada que ver, ${askerOf(intent)}. Mira a ${subjectOf(intent)}.`,
      (intent) => `Estoy más limpio que moco nuevo. El raro es ${subjectOf(intent)}.`,
      (intent) => `Buena pregunta, baboso equivocado. Pregúntenle a ${subjectOf(intent)}.`,
      (intent) => `Estaba en la casa sacándome los mocos, ${askerOf(intent)}. ${subjectOf(intent)} no.`,
      (intent) => `¿Por qué a mí? ${subjectOf(intent)} se quedó muy callado cuando llegaron los lobos.`,
      (intent) => `Culparme es justo lo que quiere ${subjectOf(intent)}, ${askerOf(intent)}.`
    ],
    'explain-vote': [
      (intent) => `Voté por ${subjectOf(intent)}. Corazonada, una corazonada babosa.`,
      (intent) => `Mi voto va para ${subjectOf(intent)}. Mucha excusa.`,
      (intent) => `${subjectOf(intent)}. Que me demuestren lo contrario.`,
      (intent) => `Me voy con ${subjectOf(intent)}. Algo huele mal ahí.`,
      (intent) => `${subjectOf(intent)}, parce. Lo siento, no lo siento.`
    ],
    'react-dawn': [
      (intent) => `Nooo, ${deathsOf(intent, ' y ')}! ¿Quién hizo esto?!`,
      () => 'Uy no. Otro más. Los lobos tienen hambre.',
      (intent) => `Descansa en baba, ${deathsOf(intent, ' y ')}.`,
      (intent) => `${deathsOf(intent, ' y ')}... no me lo esperaba, qué boleta.`,
      () => 'Aquí alguien está durmiendo demasiado tranquilo.'
    ],
    'last-words': [
      (intent) => `Acuérdense: fue ${subjectOf(intent)}. Bleh.`,
      (intent) => `Me voy... ¡píllense a ${subjectOf(intent)}!`,
      (intent) => `¡Vénguenme! Empiecen por ${subjectOf(intent)}.`,
      (intent) => `Díganle a mis verrugas que las quise. Y vigilen a ${subjectOf(intent)}.`
    ],
    'wolf-plan': [
      (intent) => `Esta noche voy por ${subjectOf(intent)}. Ñam.`,
      (intent) => `${subjectOf(intent)} se ve sabroso. ¿Me acompañan?`,
      (intent) => `${subjectOf(intent)} se está volviendo muy avispado. Hoy.`,
      (intent) => `Mismo plato: ${subjectOf(intent)}.`,
      (intent) => `Comámonos a ${subjectOf(intent)} antes de que hable.`
    ],
    ghost: [
      (intent) => `Buuu. Desde acá arriba ${subjectOf(intent)} se ve culpable.`,
      () => 'Estar muerto es pegajoso. En fin.',
      (intent) => `Esta noche espanto a ${subjectOf(intent)}.`,
      () => 'El más allá huele a queso viejo.'
    ]
  }
}

const FLAVOR: Readonly<Record<BotPersonality, (line: string, kind: BotIntent['kind'], random: RandomNumbers) => string>> = {
  paranoid: (line) => `${line.replace(/[.!?]*$/, '')}!!`,
  follower: (line, kind) => (kind === 'explain-vote' ? `+1. ${line}` : line),
  detective: (line) => line,
  chaos: (line, _kind, random) => (random.next() < 0.5 ? `${line} jeje` : line),
  quiet: (line) => (line.length <= 60 ? line : (line.split(/(?<=[.!?])\s/)[0] ?? line))
}

export const scriptedLineOf = (
  intent: BotIntent,
  language: BotLanguage,
  personality: BotPersonality,
  random: RandomNumbers,
  used: Set<string> = new Set()
): string => {
  const options = TEMPLATES[language][intent.kind]
  const keyOf = (index: number) => `${language}:${intent.kind}:${index}`
  let fresh = options.map((_template, index) => index).filter((index) => !used.has(keyOf(index)))
  if (fresh.length === 0) {
    options.forEach((_template, index) => used.delete(keyOf(index)))
    fresh = options.map((_template, index) => index)
  }
  const index = fresh[Math.floor(random.next() * fresh.length)] ?? 0
  used.add(keyOf(index))
  const template = options[index]
  const line = template === undefined ? '...' : template(intent)
  return FLAVOR[personality](line, intent.kind, random).slice(0, 240)
}
