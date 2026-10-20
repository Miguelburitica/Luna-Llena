import type { AvatarId, BotProfile } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { DisplayName } from './DisplayName'

export interface MemberIdentity {
  readonly id: string
  readonly token: string
  readonly name: DisplayName
  readonly client?: ClientIdentity
}

export class Member {
  avatar: AvatarId | null = null
  ready = false
  connected = true
  muted = false
  private currentIdentity: MemberIdentity
  private currentBot: BotProfile | null

  constructor(
    identity: MemberIdentity,
    readonly isNarrator: boolean,
    bot: BotProfile | null = null
  ) {
    this.currentIdentity = identity
    this.currentBot = bot
    if (bot !== null) this.ready = true
  }

  get identity(): MemberIdentity {
    return this.currentIdentity
  }

  get bot(): BotProfile | null {
    return this.currentBot
  }

  get isBot(): boolean {
    return this.currentBot !== null
  }

  get id(): string {
    return this.currentIdentity.id
  }

  get name(): DisplayName {
    return this.currentIdentity.name
  }

  get client(): ClientIdentity | undefined {
    return this.currentIdentity.client
  }

  holdsToken(token: unknown): boolean {
    return this.currentIdentity.token === token
  }

  get isReadyToPlay(): boolean {
    return this.ready && this.connected
  }

  becomeBot(name: DisplayName, token: string, profile: BotProfile): void {
    this.currentIdentity = { id: this.currentIdentity.id, token, name }
    this.currentBot = profile
    this.ready = true
    this.connected = true
    this.muted = false
  }
}
