import type { BotSpeech } from '../application/ports'

export class NoBotSpeech implements BotSpeech {
  async say(): Promise<string | null> {
    return null
  }
}
