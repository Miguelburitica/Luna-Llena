import { MODERATION_LIMITS, type ReviewedTextKind, type ReviewLabel } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import { blockedByWordList } from '../domain/wordList'
import type { ContentClassifier, ModerationRecords } from './ports'

export type ReviewOutcome = 'blocked' | ReviewLabel | null

const TIMEOUTS: Readonly<Record<ReviewedTextKind, number>> = {
  name: MODERATION_LIMITS.nameReviewTimeoutMs,
  'room-name': MODERATION_LIMITS.nameReviewTimeoutMs,
  message: MODERATION_LIMITS.messageReviewTimeoutMs
}

export class ReviewText {
  constructor(
    private readonly records: ModerationRecords,
    private readonly classifier: ContentClassifier,
    private readonly clock: Clock
  ) {}

  async execute(input: { readonly roomCode: string; readonly text: string; readonly kind: ReviewedTextKind }): Promise<ReviewOutcome> {
    if (blockedByWordList(input.text)) return 'blocked'
    if (!this.records.budgetOf(input.roomCode).take(this.clock.now())) return null
    return this.classifier.classify(input.text, input.kind, TIMEOUTS[input.kind]).catch(() => null)
  }
}
