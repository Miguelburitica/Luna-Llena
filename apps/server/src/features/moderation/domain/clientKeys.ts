import type { ClientKey, ClientKeyKind } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'

export const keysOf = (client: ClientIdentity): readonly ClientKey[] => [
  { kind: 'device', value: client.device },
  { kind: 'address', value: client.address }
]

export const keyId = (key: ClientKey): string => `${key.kind}:${key.value}`

export const keyOfId = (id: string): ClientKey => {
  const separator = id.indexOf(':')
  return { kind: id.slice(0, separator) as ClientKeyKind, value: id.slice(separator + 1) }
}
