import type { CueEffect, CueInput } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { CueGateway } from '../application/ports'

export class SocketCueGateway implements CueGateway {
  constructor(private readonly socket: LunaSocket) {}

  cue(input: CueInput) {
    return reachOrFail(() => this.socket.emitWithAck('match:cue', input))
  }

  onCue(listener: (effect: CueEffect) => void): void {
    this.socket.on('match:cued', listener)
  }
}
