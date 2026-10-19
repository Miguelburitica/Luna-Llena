import type { BotSpeech } from '../application/ports'
import { parseSpokenLine, type BotPrompt } from '../domain/botPrompt'

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
export const DEFAULT_BOT_MODEL = 'z-ai/glm-5.3-flash'

type Fetch = (url: string, init: RequestInit) => Promise<Response>

export interface OpenRouterOptions {
  readonly apiKey: string
  readonly model?: string | undefined
  readonly timeoutMs?: number
  readonly fetch?: Fetch
}

export class OpenRouterBotSpeech implements BotSpeech {
  private readonly model: string
  private readonly timeoutMs: number
  private readonly send: Fetch

  constructor(private readonly options: OpenRouterOptions) {
    this.model = options.model ?? DEFAULT_BOT_MODEL
    this.timeoutMs = options.timeoutMs ?? 6000
    this.send = options.fetch ?? ((url, init) => fetch(url, init))
  }

  async say(prompt: BotPrompt): Promise<string | null> {
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), this.timeoutMs)
    try {
      const response = await this.send(OPENROUTER_URL, {
        method: 'POST',
        signal: abort.signal,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Luna Llena'
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.8,
          max_tokens: 400,
          reasoning: { max_tokens: 1, exclude: true },
          messages: [
            { role: 'system', content: prompt.system },
            ...prompt.examples.flatMap((example) => [
              { role: 'user', content: example.user },
              { role: 'assistant', content: example.assistant }
            ]),
            { role: 'user', content: prompt.user }
          ]
        })
      })
      if (!response.ok) return null
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> }
      return parseSpokenLine(body.choices?.[0]?.message?.content)
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }
}
