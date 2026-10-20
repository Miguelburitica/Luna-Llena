import type { ChatChannel, HauntInput, NightActionInput, Result } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { RandomSource } from '../../../shared/application/RandomSource'
import type { BotPrompt } from '../domain/botPrompt'
import type { BotTable } from '../domain/BotTable'

export interface BotTables {
  find(code: string): BotTable | undefined
  findByMember(memberId: string): BotTable | undefined
  save(table: BotTable): void
  forget(code: string): void
}

export interface BotScheduler {
  after(code: string, delayMs: number, task: () => Promise<void>): void
  cancelAll(code: string): void
}

export interface BotSpeech {
  say(prompt: BotPrompt): Promise<string | null>
}

export interface Actor {
  readonly code: string
  readonly memberId: string
}

export type CommandResult = Result<unknown, { readonly code: string }>

export interface BotActions {
  act(actor: Actor, input: NightActionInput): Promise<CommandResult>
  vote(actor: Actor, targetId: string): Promise<CommandResult>
  lockVote(actor: Actor): Promise<CommandResult>
  avenge(actor: Actor, targetId: string): Promise<CommandResult>
  haunt(actor: Actor, input: HauntInput): Promise<CommandResult>
  say(actor: Actor, channel: ChatChannel, text: string): Promise<CommandResult>
}

export interface BotContext {
  readonly tables: BotTables
  readonly scheduler: BotScheduler
  readonly speech: BotSpeech
  readonly actions: BotActions
  readonly random: RandomSource
  readonly clock: Clock
}
