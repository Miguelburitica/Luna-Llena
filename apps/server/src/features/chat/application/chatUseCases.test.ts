import { CHAT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import {
  ANA,
  CARO,
  CHAT_START_TIME,
  CODE,
  createChatKit,
  EVERYONE,
  JUAN,
  LUIS,
  NARRATOR,
  NIGHT_ROSTER,
  PERMISSIONS,
  PIPE,
  TATO,
  unwrap
} from './chatUseCases.fixtures'

const rejected = (code: string) => ({ ok: false, error: { code } })
const sorted = (ids: readonly string[]) => [...ids].sort()

describe('Channels and readers', () => {
  it('keeps the den secret: only the other wolf and the narrator receive a wolf message', async () => {
    const { say, publisher } = createChatKit(NIGHT_ROSTER)
    unwrap(await say(LUIS, 'wolves', 'Take Caro tonight'))
    expect(sorted(publisher.latest.recipientIds)).toEqual(sorted([LUIS, TATO, NARRATOR]))
  })

  it('lets only the dead and the narrator hear the ghosts', async () => {
    const { say, publisher } = createChatKit()
    unwrap(await say(ANA, 'ghosts', 'Did you see that coming?'))
    expect(sorted(publisher.latest.recipientIds)).toEqual(sorted([ANA, JUAN, NARRATOR]))
  })
})

describe('Who may write and when', () => {
  it('closes the village at night', async () => {
    const { say, publisher } = createChatKit(NIGHT_ROSTER)
    expect(await say(CARO, 'village', 'Anyone awake?')).toEqual(rejected('chat-closed'))
    expect(publisher.deliveries).toEqual([])
  })

  it('closes the den for a wolf by day', async () => {
    const { say } = createChatKit()
    expect(await say(LUIS, 'wolves', 'Psst')).toEqual(rejected('chat-closed'))
  })

  it('forbids the dead from shouting in the village', async () => {
    const { say } = createChatKit()
    expect(await say(ANA, 'village', 'I am innocent')).toEqual(rejected('chat-forbidden'))
  })

  it('forbids a villager from knocking on the den', async () => {
    const { say } = createChatKit(NIGHT_ROSTER)
    expect(await say(CARO, 'wolves', 'Let me in')).toEqual(rejected('chat-forbidden'))
  })

  it('forbids a channel that does not exist', async () => {
    const { say } = createChatKit()
    expect(await say(CARO, 'tavern', 'Hello')).toEqual(rejected('chat-forbidden'))
    expect(await say(CARO, undefined, 'Hello')).toEqual(rejected('chat-forbidden'))
  })
})

describe('Messages', () => {
  it('rejects blank and non-text messages', async () => {
    const { say } = createChatKit()
    expect(await say(CARO, 'village', '    ')).toEqual(rejected('message-invalid'))
    expect(await say(CARO, 'village', 42)).toEqual(rejected('message-invalid'))
    expect(await say(CARO, 'village', undefined)).toEqual(rejected('message-invalid'))
  })

  it('accepts exactly 280 characters after trimming and rejects 281', async () => {
    const { say } = createChatKit()
    const limit = 'a'.repeat(CHAT_LIMITS.maxMessageLength)
    expect(unwrap(await say(CARO, 'village', `  ${limit}  `)).text).toBe(limit)
    expect(await say(CARO, 'village', `${limit}a`)).toEqual(rejected('message-invalid'))
  })

  it('delivers live to every member with the author and the server time', async () => {
    const { say, publisher } = createChatKit()
    const message = unwrap(await say(PIPE, 'village', 'Sofi is being weird on purpose'))
    expect(message).toEqual({
      id: 'message-001',
      channel: 'village',
      kind: 'player',
      authorId: PIPE,
      text: 'Sofi is being weird on purpose',
      sentAt: CHAT_START_TIME
    })
    expect(publisher.latest.message).toEqual(message)
    expect(sorted(publisher.latest.recipientIds)).toEqual(sorted(EVERYONE))
  })

  it('does not deliver a rejected message to anyone', async () => {
    const { say, publisher } = createChatKit()
    await say(CARO, 'village', '')
    await say(ANA, 'village', 'Boo')
    expect(publisher.deliveries).toEqual([])
  })
})

describe("The narrator's voice", () => {
  it('posts to the village in the dark as a narrator message everyone receives', async () => {
    const { say, publisher } = createChatKit(NIGHT_ROSTER)
    const message = unwrap(await say(NARRATOR, 'village', 'The fog is thick tonight. Lock your doors.'))
    expect(message).toMatchObject({ kind: 'narrator', channel: 'village', authorId: NARRATOR })
    expect(sorted(publisher.latest.recipientIds)).toEqual(sorted(EVERYONE))
  })

  it('does not let the narrator write the wolves or ghosts', async () => {
    const { say } = createChatKit()
    expect(await say(NARRATOR, 'wolves', 'Boo')).toEqual(rejected('chat-forbidden'))
  })
})

describe('Last words', () => {
  const dyingKit = () => {
    const kit = createChatKit()
    kit.audience.update(JUAN, PERMISSIONS.speaker(CHAT_START_TIME + 15_000))
    kit.audience.update(CARO, PERMISSIONS.villagerWhilePaused)
    kit.audience.update(PIPE, PERMISSIONS.villagerWhilePaused)
    return kit
  }

  it('gives Juan the floor and tells everyone', async () => {
    const { say, publisher, audience } = dyingKit()
    const message = unwrap(await say(JUAN, 'village', 'It was Tato. Avenge my hat.'))
    expect(message).toMatchObject({ kind: 'last-words', authorId: JUAN, channel: 'village' })
    expect(sorted(publisher.latest.recipientIds)).toEqual(sorted(EVERYONE))
    expect(audience.spoken).toEqual([{ code: CODE, memberId: JUAN, now: CHAT_START_TIME }])
  })

  it('allows one message only', async () => {
    const { say } = dyingKit()
    unwrap(await say(JUAN, 'village', 'Goodbye'))
    expect(await say(JUAN, 'village', 'One more thing')).toEqual(rejected('chat-forbidden'))
  })

  it('rejects words that come too late', async () => {
    const { say, audience, clock } = dyingKit()
    clock.advanceBy(20_000)
    audience.update(JUAN, PERMISSIONS.ghost)
    expect(await say(JUAN, 'village', 'Wait')).toEqual(rejected('chat-forbidden'))
    expect(audience.spoken).toEqual([])
  })

  it('holds the village breath for the living while the window is open', async () => {
    const { say } = dyingKit()
    expect(await say(CARO, 'village', 'What did he say?')).toEqual(rejected('chat-closed'))
  })

  it('keeps ghost messages from a dying player as plain player messages', async () => {
    const { say, audience } = dyingKit()
    const message = unwrap(await say(JUAN, 'ghosts', 'See you soon'))
    expect(message.kind).toBe('player')
    expect(audience.spoken).toEqual([])
  })

  it('does not close the window when the narrator speaks', async () => {
    const { say, audience } = dyingKit()
    unwrap(await say(NARRATOR, 'village', 'Silence for Juan'))
    expect(audience.spoken).toEqual([])
  })
})

describe('History', () => {
  it('returns the village history oldest first after a reload', async () => {
    const { say, useCases, actorOf, clock } = createChatKit()
    unwrap(await say(PIPE, 'village', 'first'))
    clock.advanceBy(1000)
    unwrap(await say(CARO, 'village', 'second'))
    clock.advanceBy(1000)
    unwrap(await say(NARRATOR, 'village', 'third'))
    const history = unwrap(await useCases.chatHistory.execute(actorOf(CARO)))
    expect(history.map((message) => message.text)).toEqual(['first', 'second', 'third'])
  })

  it('merges readable channels by time then id and hides the others', async () => {
    const { say, useCases, actorOf, audience } = createChatKit()
    unwrap(await say(PIPE, 'village', 'village one'))
    unwrap(await say(ANA, 'ghosts', 'ghost one'))
    unwrap(await say(CARO, 'village', 'village two'))
    audience.set(NIGHT_ROSTER)
    const ghost = unwrap(await useCases.chatHistory.execute(actorOf(ANA)))
    expect(ghost.map((message) => message.id)).toEqual(['message-001', 'message-002', 'message-003'])
    const luis = unwrap(await useCases.chatHistory.execute(actorOf(LUIS)))
    expect(luis.map((message) => message.text)).toEqual(['village one', 'village two'])
    const narrator = unwrap(await useCases.chatHistory.execute(actorOf(NARRATOR)))
    expect(narrator).toHaveLength(3)
  })

  it('welcomes a new ghost with the earlier ghost messages', async () => {
    const { say, useCases, actorOf, audience } = createChatKit()
    unwrap(await say(ANA, 'ghosts', 'Boo'))
    expect(unwrap(await useCases.chatHistory.execute(actorOf(CARO)))).toEqual([])
    audience.update(CARO, PERMISSIONS.ghost)
    const history = unwrap(await useCases.chatHistory.execute(actorOf(CARO)))
    expect(history.map((message) => message.text)).toEqual(['Boo'])
  })

  it('returns an empty history when nobody spoke', async () => {
    const { useCases, actorOf } = createChatKit()
    expect(unwrap(await useCases.chatHistory.execute(actorOf(CARO)))).toEqual([])
  })
})

describe('Without a game or a seat', () => {
  it('rejects every request with chat-not-open when no match exists', async () => {
    const { say, useCases, actorOf, audience } = createChatKit()
    audience.closeMatch()
    expect(await say(CARO, 'village', 'Hello')).toEqual(rejected('chat-not-open'))
    expect(await useCases.chatHistory.execute(actorOf(CARO))).toEqual(rejected('chat-not-open'))
  })

  it('rejects a stranger with session-invalid', async () => {
    const { say, useCases, actorOf } = createChatKit()
    expect(await say('stranger', 'village', 'Hello')).toEqual(rejected('session-invalid'))
    expect(await useCases.chatHistory.execute(actorOf('stranger'))).toEqual(rejected('session-invalid'))
  })
})
