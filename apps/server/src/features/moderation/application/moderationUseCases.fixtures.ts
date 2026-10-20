import type { AdminRoomView, ReviewedTextKind, ReviewLabel } from '@luna/contracts'
import { FixedClock } from '../../../shared/application/clockAndRandom.fixtures'
import { EnvironmentAdminSecret } from '../infrastructure/EnvironmentAdminSecret'
import { InMemoryAdminSessions } from '../infrastructure/InMemoryAdminSessions'
import { InMemoryModeration } from '../infrastructure/InMemoryModeration'
import { createModerationUseCases } from './moderationUseCases'
import type { ContentClassifier, RoomDirectory } from './ports'

export const ADMIN_TOKEN = 'luna-operator-secret'
export const MODERATION_START = 1_000_000
export const HOUR = 3_600_000

export const TATO = { address: '10.0.0.7', device: 'device-tato' }

export class FakeClassifier implements ContentClassifier {
  label: ReviewLabel | null = 'ok'
  failing = false
  readonly calls: Array<{ text: string; kind: ReviewedTextKind; timeoutMs: number }> = []

  async classify(text: string, kind: ReviewedTextKind, timeoutMs: number): Promise<ReviewLabel | null> {
    this.calls.push({ text, kind, timeoutMs })
    if (this.failing) throw new Error('model down')
    return this.label
  }
}

export class FakeRoomDirectory implements RoomDirectory {
  readonly closed: string[] = []
  listed: AdminRoomView[] = [
    {
      code: 'SPAM42',
      name: 'Sala de spam',
      narratorName: 'Tato',
      visibility: 'public',
      status: 'lobby',
      playerCount: 2,
      reports: 3,
      hidden: true
    }
  ]

  async rooms(): Promise<readonly AdminRoomView[]> {
    return this.listed
  }

  async close(code: string): Promise<boolean> {
    if (!this.listed.some((room) => room.code === code)) return false
    this.closed.push(code)
    return true
  }
}

export const createModerationKit = ({ token = ADMIN_TOKEN }: { readonly token?: string } = {}) => {
  let sessionSequence = 0
  const clock = new FixedClock(MODERATION_START)
  const records = new InMemoryModeration()
  const classifier = new FakeClassifier()
  const directory = new FakeRoomDirectory()
  const sessions = new InMemoryAdminSessions(() => `session-${(sessionSequence += 1)}`)
  const useCases = createModerationUseCases({
    records,
    classifier,
    sessions,
    secret: new EnvironmentAdminSecret(token),
    directory,
    clock
  })
  const signIn = () => {
    const session = useCases.signInAdmin.execute(ADMIN_TOKEN, '127.0.0.1')
    if (!session.ok) throw new Error(`Sign-in failed: ${session.error.code}`)
    return session.value.id
  }
  return { useCases, records, classifier, directory, clock, signIn }
}
