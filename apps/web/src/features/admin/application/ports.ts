import type { AdminError, AdminSessionStatus, ClientKey, ModerationOverview, Result } from '@luna/contracts'
import type { InjectionKey } from 'vue'

export type AdminFailure = AdminError | { readonly code: 'unreachable' }

export type AdminResult<T> = Promise<Result<T, AdminFailure>>

export interface AdminGateway {
  status(): AdminResult<AdminSessionStatus>
  signIn(token: string): AdminResult<AdminSessionStatus>
  signOut(): AdminResult<AdminSessionStatus>
  overview(): AdminResult<ModerationOverview>
  ban(key: ClientKey, hours: number): AdminResult<void>
  unban(key: ClientKey): AdminResult<void>
  closeRoom(code: string): AdminResult<void>
}

export const ADMIN_GATEWAY: InjectionKey<AdminGateway> = Symbol('AdminGateway')
