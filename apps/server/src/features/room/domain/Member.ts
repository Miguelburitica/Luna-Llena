import type { AvatarId, BotProfile } from '@luna/contracts'
import type { DisplayName } from './DisplayName'

export interface MemberIdentity {
  readonly id: string
  readonly token: string
  readonly name: DisplayName
}

export class Member {
  avatar: AvatarId | null = null
  ready = false
  connected = true

  constructor(
    readonly identity: MemberIdentity,
    readonly isNarrator: boolean,
    readonly bot: BotProfile | null = null
  ) {
    if (bot !== null) this.ready = true
  }

  get isBot(): boolean {
    return this.bot !== null
  }

  get id(): string {
    return this.identity.id
  }

  get name(): DisplayName {
    return this.identity.name
  }

  holdsToken(token: unknown): boolean {
    return this.identity.token === token
  }

  get isReadyToPlay(): boolean {
    return this.ready && this.connected
  }
}
