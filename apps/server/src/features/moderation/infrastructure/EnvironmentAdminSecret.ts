import { createHash, timingSafeEqual } from 'node:crypto'
import type { AdminSecret } from '../application/ports'

const digestOf = (text: string): Buffer => createHash('sha256').update(text, 'utf8').digest()

export class EnvironmentAdminSecret implements AdminSecret {
  private readonly digest: Buffer | null

  constructor(token: string | undefined) {
    const trimmed = token?.trim() ?? ''
    this.digest = trimmed.length === 0 ? null : digestOf(trimmed)
  }

  get configured(): boolean {
    return this.digest !== null
  }

  matches(token: unknown): boolean {
    if (this.digest === null || typeof token !== 'string' || token.length > 512) return false
    return timingSafeEqual(digestOf(token.trim()), this.digest)
  }
}
