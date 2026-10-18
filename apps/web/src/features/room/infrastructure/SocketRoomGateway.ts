import type { AvatarId, CreateRoomInput, RoomSettingsInput, RoomSnapshot } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { RoomGateway } from '../application/ports'

export class SocketRoomGateway implements RoomGateway {
  constructor(private readonly socket: LunaSocket) {}

  createRoom(input: CreateRoomInput) {
    return reachOrFail(() => this.socket.emitWithAck('room:create', input))
  }

  lookUp(code: string) {
    return reachOrFail(() => this.socket.emitWithAck('room:lookUp', { code }))
  }

  join(code: string, name: string) {
    return reachOrFail(() => this.socket.emitWithAck('room:join', { code, name }))
  }

  resume(code: string, token: string) {
    return reachOrFail(() => this.socket.emitWithAck('room:resume', { code, token }))
  }

  chooseAvatar(avatar: AvatarId | null) {
    return reachOrFail(() => this.socket.emitWithAck('room:chooseAvatar', { avatar }))
  }

  setReady(ready: boolean) {
    return reachOrFail(() => this.socket.emitWithAck('room:setReady', { ready }))
  }

  updateSettings(settings: RoomSettingsInput) {
    return reachOrFail(() => this.socket.emitWithAck('room:updateSettings', { settings }))
  }

  kick(memberId: string) {
    return reachOrFail(() => this.socket.emitWithAck('room:kick', { memberId }))
  }

  leave() {
    return reachOrFail(() => this.socket.emitWithAck('room:leave', {}))
  }

  start() {
    return reachOrFail(() => this.socket.emitWithAck('room:start', {}))
  }

  onSnapshot(listener: (snapshot: RoomSnapshot) => void): void {
    this.socket.on('room:snapshot', listener)
  }

  onKicked(listener: () => void): void {
    this.socket.on('room:kicked', listener)
  }

  onClosed(listener: () => void): void {
    this.socket.on('room:closed', listener)
  }

  onReconnected(listener: () => void): void {
    this.socket.io.on('reconnect', listener)
  }
}
