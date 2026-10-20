import type { ReviewLabel } from '@luna/contracts'
import type { ContentClassifier } from '../application/ports'

export class NoContentClassifier implements ContentClassifier {
  async classify(): Promise<ReviewLabel | null> {
    return null
  }
}
