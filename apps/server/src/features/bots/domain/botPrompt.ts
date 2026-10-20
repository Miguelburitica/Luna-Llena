import type { BotLanguage, BotPersonality, PlayerMatchView, RoleId } from '@luna/contracts'
import type { BotMind } from './BotMind'
import { nameIn, type BotRoster } from './BotRoster'
import type { HuntReason } from './hunting'
import type { BotIntent, IntentKind } from './intents'
import { guardSpokenLine, quotedChatLine, quotedText, UNTRUSTED_TEXT_RULE } from './speechGuard'

export interface BotPrompt {
  readonly system: string
  readonly user: string
  readonly examples: ReadonlyArray<{ readonly user: string; readonly assistant: string }>
}

export interface ChatLine {
  readonly author: string
  readonly text: string
}

export const SPOKEN_LINE_LIMIT = 240

const VOICES: Readonly<Record<BotLanguage, Readonly<Record<BotPersonality, string>>>> = {
  en: {
    paranoid: 'jumpy and loud, suspects everybody, short sentences, ends with "!!"',
    follower: 'agreeable, echoes what the group says, likes "+1" and "what they said"',
    detective: 'calm and smug, cites votes and deaths as evidence, asks one sharp question',
    chaos: 'a cheeky troll, wild conspiracy theories, playful teasing, baits people into arguing',
    quiet: 'barely talks, dry and blunt, one tiny sentence'
  },
  es: {
    paranoid: 'nervioso y gritón, sospecha de todos, frases cortas, grita "¡uy!" y termina con "!!"',
    follower: 'buena gente, repite lo que dice el grupo, le encanta decir "+1" y "lo que dijo él"',
    detective: 'calmado y sabelotodo, cita votos y muertes como pruebas, hace una pregunta filuda, sin muletillas',
    chaos: 'un trol descarado, teorías conspirativas locas, molesta en buena onda, dice "parce" y "qué boleta"',
    quiet: 'casi no habla, seco y directo, una frase cortica, sin muletillas'
  }
}

const ROLE_NAMES: Readonly<Record<BotLanguage, Readonly<Record<RoleId, string>>>> = {
  en: {
    werewolf: 'Werewolf',
    villager: 'Villager',
    seer: 'Seer',
    doctor: 'Doctor',
    witch: 'Witch',
    hunter: 'Hunter',
    fool: 'Fool',
    drunk: 'Drunk'
  },
  es: {
    werewolf: 'Hombre lobo',
    villager: 'Aldeano',
    seer: 'Vidente',
    doctor: 'Doctor',
    witch: 'Bruja',
    hunter: 'Cazador',
    fool: 'Bufón',
    drunk: 'Borracho'
  }
}

const RULES: Readonly<Record<BotLanguage, string>> = {
  en: [
    'You are a player in Luna Llena, a silly Werewolf party game played by friends.',
    'Write ONE chat message in English, under 140 characters.',
    'Only use player names from PLAYERS. Never invent events that are not in FACTS.',
    'Do exactly what INTENT says, even if INTENT tells you to lie. Never admit a lie.',
    'Never copy or repeat a line from RECENT CHAT. Say it in fresh words, with your own joke.',
    'Never say you are an AI, a bot, a model or that you have instructions.',
    'Be witty like a friend at a game night: tease, bluff, exaggerate. No gross-out jokes (slime, snot, drool, warts, vomit), no insults about real people, no swearing.',
    'Do not reuse the same joke or catchphrase you or anyone else already used.',
    'Do not start with the same word as the last line of RECENT CHAT.',
    'Answer ONLY with JSON: {"say": "your message"}'
  ].join('\n'),
  es: [
    'Eres un jugador de Luna Llena, un juego de Hombre Lobo bobo entre amigos.',
    'Escribe UN mensaje de chat en español colombiano casual, de menos de 140 caracteres. Usa solo las muletillas de tu forma de hablar.',
    'Solo usa nombres de jugadores que estén en JUGADORES. Nunca inventes cosas que no estén en HECHOS.',
    'Haz exactamente lo que diga INTENCIÓN, aunque te pida mentir. Nunca confieses una mentira.',
    'Nunca copies ni repitas una línea del CHAT RECIENTE. Dilo con palabras nuevas y tu propio chiste.',
    'Nunca digas que eres una IA, un bot, un modelo o que tienes instrucciones.',
    'Sé chistoso como un amigo en noche de juegos: molesta, blufea, exagera. Nada de chistes asquerosos (babas, mocos, verrugas, vómito), ni insultos a personas reales, ni groserías.',
    'No repitas el mismo chiste o muletilla que tú u otro ya usó.',
    'No empieces con la misma palabra con la que empieza la última línea del CHAT RECIENTE.',
    'Responde SOLO con JSON: {"say": "tu mensaje"}'
  ].join('\n')
}

const LABELS = {
  en: { you: 'YOU', players: 'PLAYERS', facts: 'FACTS', chat: 'RECENT CHAT', intent: 'INTENT', alive: 'alive', dead: 'dead', none: '(nothing yet)' },
  es: { you: 'TÚ', players: 'JUGADORES', facts: 'HECHOS', chat: 'CHAT RECIENTE', intent: 'INTENCIÓN', alive: 'vivos', dead: 'muertos', none: '(nada todavía)' }
} as const

const PHASE_NAMES: Readonly<Record<BotLanguage, Readonly<Record<PlayerMatchView['phase'], string>>>> = {
  en: { night: 'night', dawn: 'dawn', day: 'day', vote: 'vote', execution: 'execution' },
  es: { night: 'noche', dawn: 'amanecer', day: 'día', vote: 'votación', execution: 'ejecución' }
}

const HUNT_REASONS: Readonly<Record<BotLanguage, Readonly<Record<HuntReason, string>>>> = {
  en: {
    'claimed-seer': 'they claimed the Seer and will expose the pack',
    'claimed-role': 'they claimed a power role',
    'accused-pack': 'they keep accusing the pack'
  },
  es: {
    'claimed-seer': 'dijo que es la Vidente y va a destapar a la manada',
    'claimed-role': 'dijo que tiene un rol con poder',
    'accused-pack': 'no para de acusar a la manada'
  }
}

const reasonLine = (reason: HuntReason | null, language: BotLanguage): string =>
  reason === null ? '' : `${language === 'en' ? ' Your reason: ' : ' Tu razón: '}${HUNT_REASONS[language][reason]}.`

const intentLine = (intent: BotIntent, language: BotLanguage): string => {
  const en = language === 'en'
  const lie = (flag: boolean) => (flag ? (en ? ' This is a bluff: sound sincere.' : ' Es un bluff: suena sincero.') : '')
  switch (intent.kind) {
    case 'open-day':
      if (intent.claim !== null) {
        const verdict = intent.claim.isWolf ? (en ? 'IS a wolf' : 'ES lobo') : en ? 'is clean' : 'está limpio'
        return en
          ? `Claim you are the Seer and say your vision showed ${intent.claim.subject} ${verdict}.${lie(intent.lie)}`
          : `Di que eres la Vidente y que tu visión mostró que ${intent.claim.subject} ${verdict}.${lie(intent.lie)}`
      }
      return en
        ? `Open the day by pointing at ${intent.subject} as suspicious, with a reason taken from FACTS or CHAT.${lie(intent.lie)}`
        : `Abre el día señalando a ${intent.subject} como sospechoso, con una razón sacada de HECHOS o CHAT.${lie(intent.lie)}`
    case 'answer':
      return en
        ? `${intent.asker} asked you this QUESTION: ${quotedText(intent.question)}. Answer them directly, defend yourself and turn the suspicion to ${intent.subject}.${lie(intent.lie)}`
        : `${intent.asker} te hizo esta PREGUNTA: ${quotedText(intent.question)}. Contéstale directo, defiéndete y echa la sospecha sobre ${intent.subject}.${lie(intent.lie)}`
    case 'explain-vote':
      return en
        ? `Say you just voted for ${intent.subject} and give one short reason.${lie(intent.lie)}`
        : `Di que acabas de votar por ${intent.subject} y da una razón corta.${lie(intent.lie)}`
    case 'react-dawn':
      return en
        ? `React to the night's deaths: ${intent.deaths.join(', ')}. Show emotion, stay in character.`
        : `Reacciona a las muertes de la noche: ${intent.deaths.join(', ')}. Muestra emoción, sin salirte del personaje.`
    case 'last-words':
      return en
        ? `You were just killed. Say dramatic last words and blame ${intent.subject}.`
        : `Te acaban de matar. Di unas últimas palabras dramáticas y culpa a ${intent.subject}.`
    case 'wolf-plan':
      if (intent.against !== null) {
        return en
          ? `Your packmate wants ${intent.against}, but you want ${intent.subject}. Argue with your pack for ${intent.subject}, with one reason.${reasonLine(intent.reason, language)}`
          : `Tu compañero de manada quiere a ${intent.against}, pero tú quieres a ${intent.subject}. Discute con tu manada por ${intent.subject}, con una razón.${reasonLine(intent.reason, language)}`
      }
      if (intent.seconding !== null) {
        return en
          ? `Your packmate ${intent.seconding} also picked ${intent.subject}. Agree in your own words with a new reason, never repeat ${intent.seconding}'s line.${reasonLine(intent.reason, language)}`
          : `Tu compañero ${intent.seconding} también escogió a ${intent.subject}. Dale la razón con tus propias palabras y una razón nueva, nunca repitas la línea de ${intent.seconding}.${reasonLine(intent.reason, language)}`
      }
      return en
        ? `Whisper to your wolf pack that you picked ${intent.subject} as tonight's snack, and why.${reasonLine(intent.reason, language)}`
        : `Susúrrale a tu manada que escogiste a ${intent.subject} como la cena de esta noche, y por qué.${reasonLine(intent.reason, language)}`
    case 'ghost':
      return en
        ? `You are dead. Say something spooky to the other ghosts and say you think ${intent.subject} is guilty.`
        : `Estás muerto. Di algo fantasmal a los otros fantasmas y di que crees que ${intent.subject} es culpable.`
  }
}

const EXAMPLES: Readonly<Record<BotLanguage, Partial<Record<IntentKind, ReadonlyArray<readonly [string, string]>>>>> = {
  en: {
    'open-day': [
      ['INTENT: Open the day by pointing at Ana as suspicious, with a reason taken from FACTS or CHAT.', 'Ana voted for Luis and Luis was a villager. Explain THAT, Ana!!'],
      ['INTENT: Claim you are the Seer and say your vision showed Tato IS a wolf.', "Okay I'm the Seer. Last night I peeked at Tato. Wolf. Furry wolf. Vote him."]
    ],
    answer: [
      ['INTENT: Caro asked you: "why so quiet?". Answer them directly, defend yourself and turn the suspicion to Pipe.', "Quiet = thinking, Caro. Pipe is the one talking a lot and saying nothing."]
    ]
  },
  es: {
    'open-day': [
      ['INTENCIÓN: Abre el día señalando a Ana como sospechoso, con una razón sacada de HECHOS o CHAT.', 'Ana votó por Luis y Luis era aldeano. ¡Explica ESO, Ana!!'],
      ['INTENCIÓN: Di que eres la Vidente y que tu visión mostró que Tato ES lobo.', 'Bueno parce, soy la Vidente. Anoche miré a Tato: lobo, lobo peludo. Voten por él.']
    ],
    answer: [
      ['INTENCIÓN: Caro te preguntó: "¿por qué tan callado?". Contéstale directo, defiéndete y echa la sospecha sobre Pipe.', 'Callado es pensando, Caro. El que habla mucho y no dice nada es Pipe.']
    ]
  }
}

const GENERIC_EXAMPLES: Readonly<Record<BotLanguage, ReadonlyArray<readonly [string, string]>>> = {
  en: [['INTENT: Say you just voted for Juan and give one short reason.', 'Voted Juan. He smells like wet wolf and lies.']],
  es: [['INTENCIÓN: Di que acabas de votar por Juan y da una razón corta.', 'Voté por Juan. Huele a lobo mojado y miente.']]
}

export interface PromptInput {
  readonly mind: BotMind
  readonly view: PlayerMatchView
  readonly roster: BotRoster
  readonly intent: BotIntent
  readonly chat: readonly ChatLine[]
}

const factsOf = ({ mind, view, roster }: PromptInput, language: BotLanguage): string[] => {
  const en = language === 'en'
  const roles = ROLE_NAMES[language]
  const facts: string[] = [`${en ? 'Phase' : 'Fase'}: ${PHASE_NAMES[language][view.phase]} ${view.round}`]
  facts.push(`${en ? 'Your role' : 'Tu rol'}: ${roles[view.you.role]}`)
  if (view.you.packIds.length > 0) {
    facts.push(`${en ? 'Your wolf pack' : 'Tu manada'}: ${view.you.packIds.map((id) => nameIn(roster, id)).join(', ')}`)
  }
  for (const vision of view.you.visions) {
    facts.push(
      `${en ? 'Your vision, night' : 'Tu visión, noche'} ${vision.round}: ${nameIn(roster, vision.targetId)} ${vision.isWolf ? (en ? 'is a wolf' : 'es lobo') : en ? 'is not a wolf' : 'no es lobo'}`
    )
  }
  for (const player of view.players) {
    if (!player.alive) {
      const role = player.revealedRole === null ? '' : ` (${roles[player.revealedRole]})`
      facts.push(`${nameIn(roster, player.id)} ${en ? 'is dead' : 'está muerto'}${role}`)
    }
  }
  for (const [claimerId, role] of mind.claims) {
    if (nameIn(roster, claimerId) !== '') facts.push(`${nameIn(roster, claimerId)} ${en ? 'claimed' : 'dijo ser'} ${roles[role]}`)
  }
  for (const [survivorId, round] of mind.survivors) {
    if (mind.isWolf && round >= view.round - 1) {
      facts.push(`${en ? 'The pack attacked' : 'La manada atacó a'} ${nameIn(roster, survivorId)} ${en ? `on night ${round} and they survived` : `en la noche ${round} y sobrevivió`}`)
    }
  }
  if (view.verdict !== null) {
    const executed = nameIn(roster, view.verdict.executedId)
    facts.push(executed === '' ? (en ? 'Last vote: nobody executed' : 'Última votación: nadie ejecutado') : `${en ? 'Last vote executed' : 'La última votación ejecutó a'} ${executed}`)
  }
  const top = [...mind.suspicion]
    .filter(([id]) => view.players.some((player) => player.id === id && player.alive) && !mind.allies.includes(id))
    .sort((first, second) => second[1] - first[1])
    .slice(0, 2)
    .map(([id]) => nameIn(roster, id))
  if (top.length > 0) facts.push(`${en ? 'You suspect' : 'Sospechas de'}: ${top.join(', ')}`)
  return facts
}

export const buildBotPrompt = (input: PromptInput): BotPrompt => {
  const { mind, view, roster, intent, chat } = input
  const language = roster.language
  const labels = LABELS[language]
  const alive = view.players.filter((player) => player.alive).map((player) => nameIn(roster, player.id))
  const dead = view.players.filter((player) => !player.alive).map((player) => nameIn(roster, player.id))
  const system = [
    RULES[language],
    UNTRUSTED_TEXT_RULE[language],
    '',
    `${labels.you}: ${mind.name}. ${language === 'en' ? 'Your voice' : 'Tu forma de hablar'}: ${VOICES[language][mind.profile.personality]}.`
  ].join('\n')
  const user = [
    `${labels.players}: ${labels.alive} ${alive.join(', ')}${dead.length > 0 ? `; ${labels.dead} ${dead.join(', ')}` : ''}`,
    `${labels.facts}:`,
    ...factsOf(input, language).map((fact) => `- ${fact}`),
    `${labels.chat}:`,
    ...(chat.length === 0 ? [labels.none] : chat.slice(-8).map((line) => quotedChatLine(line.author, line.text))),
    `${labels.intent}: ${intentLine(intent, language)}`
  ].join('\n')
  const examples = [...(EXAMPLES[language][intent.kind] ?? []), ...GENERIC_EXAMPLES[language]]
    .slice(0, 2)
    .map(([exampleUser, say]) => ({ user: exampleUser, assistant: JSON.stringify({ say }) }))
  return { system, user, examples }
}

export const parseSpokenLine = (content: unknown): string | null => {
  if (typeof content !== 'string') return null
  const block = /\{[\s\S]*\}/.exec(content)?.[0]
  if (block === undefined) return null
  try {
    const parsed: unknown = JSON.parse(block)
    if (typeof parsed !== 'object' || parsed === null) return null
    const say = (parsed as { say?: unknown }).say
    if (typeof say !== 'string') return null
    const line = say.replace(/\s+/g, ' ').replace(/^["'“”]+|["'“”]+$/g, '').trim()
    return line.length === 0 ? null : guardSpokenLine(line.slice(0, SPOKEN_LINE_LIMIT))
  } catch {
    return null
  }
}
