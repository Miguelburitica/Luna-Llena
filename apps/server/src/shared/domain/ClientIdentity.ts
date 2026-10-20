export interface ClientIdentity {
  readonly address: string
  readonly device: string
}

export const UNKNOWN_CLIENT: ClientIdentity = { address: 'unknown', device: 'unknown' }
