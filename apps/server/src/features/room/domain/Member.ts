import type { AvatarId } from '@luna/contracts'
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
    readonly isNarrator: boolean
  ) {}

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
