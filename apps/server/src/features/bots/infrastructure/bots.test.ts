import type { MatchView, RoomSnapshot } from '@luna/contracts'
import { afterEach, describe, expect, it } from 'vitest'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import type { BotScheduler } from '../application/ports'
import type { BotPrompt } from '../domain/botPrompt'
import { OpenRouterBotSpeech, OPENROUTER_URL } from './OpenRouterBotSpeech'

const PROMPT: BotPrompt = { system: 'rules', user: 'INTENT: accuse Tato', examples: [{ user: 'example', assistant: '{"say":"x"}' }] }

const answering = (status: number, body: unknown) => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fetch = async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }
  return { calls, fetch }
}

describe('OpenRouterBotSpeech', () => {
  it('sends the prompt to the configured model and returns the line', async () => {
    const stub = answering(200, { choices: [{ message: { content: '{"say": "Tato smells wolfy"}' } }] })
    const speech = new OpenRouterBotSpeech({ apiKey: 'test-key', model: 'openai/gpt-6-luna-pro', fetch: stub.fetch })
    expect(await speech.say(PROMPT)).toBe('Tato smells wolfy')
    const call = stub.calls[0]
    const body = JSON.parse(String(call?.init.body)) as {
      model: string
      reasoning: unknown
      messages: Array<{ role: string; content: string }>
    }
    expect(call?.url).toBe(OPENROUTER_URL)
    expect(body.model).toBe('openai/gpt-6-luna-pro')
    expect(body.reasoning).toEqual({ effort: 'none', exclude: true })
    expect(body.messages.map((message) => message.role)).toEqual(['system', 'user', 'assistant', 'user'])
    expect(body.messages.at(-1)?.content).toBe('INTENT: accuse Tato')
  })

  it('uses GPT-6 Luna when no model is configured', async () => {
    const stub = answering(200, { choices: [{ message: { content: '{"say": "hi"}' } }] })
    await new OpenRouterBotSpeech({ apiKey: 'test-key', fetch: stub.fetch }).say(PROMPT)
    expect((JSON.parse(String(stub.calls[0]?.init.body)) as { model: string }).model).toBe('openai/gpt-6-luna')
  })

  it('returns nothing on a bad answer, an error status or a timeout', async () => {
    expect(await new OpenRouterBotSpeech({ apiKey: 'k', fetch: answering(200, { choices: [{ message: { content: 'no json' } }] }).fetch }).say(PROMPT)).toBeNull()
    expect(await new OpenRouterBotSpeech({ apiKey: 'k', fetch: answering(500, {}).fetch }).say(PROMPT)).toBeNull()
    const hanging = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
    expect(await new OpenRouterBotSpeech({ apiKey: 'k', timeoutMs: 10, fetch: hanging }).say(PROMPT)).toBeNull()
  })
})

const quickScheduler: BotScheduler = {
  after: (_code, _delay, task) => {
    setTimeout(() => void task(), 5)
  },
  cancelAll: () => undefined
}

const kit = createSocketKit()

afterEach(async () => {
  await kit.stop()
})

const waitFor = <T>(client: Client, event: 'room:snapshot' | 'match:view', matches: (payload: T) => boolean): Promise<T> =>
  new Promise((resolve) => {
    const listener = (payload: T) => {
      if (!matches(payload)) return
      client.off(event, listener as never)
      resolve(payload)
    }
    client.on(event, listener as never)
  })

describe('bots over sockets', () => {
  it('lets the narrator add bots, start, and see every bot act at night', async () => {
    await kit.start({ botScheduler: quickScheduler })
    const narrator = await kit.newClient()
    const created = await narrator.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' })
    if (!created.ok) throw new Error('room not created')
    await narrator.emitWithAck('room:updateSettings', {
      settings: { deck: { werewolf: 1, villager: 3, seer: 1, doctor: 1, witch: 0, hunter: 0, fool: 0, drunk: 0 } }
    })
    const ready = waitFor<RoomSnapshot>(narrator, 'room:snapshot', (snapshot) => snapshot.startReadiness.canStart)
    for (let count = 0; count < 6; count += 1) expect((await narrator.emitWithAck('room:addBot', {})).ok).toBe(true)
    const lobby = await ready
    expect(lobby.members.filter((member) => member.bot !== null)).toHaveLength(6)
    const everyoneActed = waitFor<MatchView>(
      narrator,
      'match:view',
      (view) => view.perspective === 'narrator' && view.night !== null && view.night.waitingOn.length === 0
    )
    expect((await narrator.emitWithAck('room:start', {})).ok).toBe(true)
    expect((await everyoneActed).phase).toBe('night')
  })
})
