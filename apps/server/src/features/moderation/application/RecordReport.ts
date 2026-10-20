import type { Clock } from '../../../shared/application/Clock'
import type { ModerationRecords } from './ports'

export class RecordReport {
  constructor(
    private readonly records: ModerationRecords,
    private readonly clock: Clock
  ) {}

  execute(input: { readonly roomCode: string; readonly roomName: string; readonly address: string }): void {
    this.records.noteReport({ ...input, at: this.clock.now() })
  }
}
