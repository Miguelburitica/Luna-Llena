import { err, ok, roomError, ROOM_LIMITS, type Result, type RoomError } from '@luna/contracts'

export class VoiceCallUrl {
  private constructor(readonly value: string) {}

  static parse(raw: unknown): Result<VoiceCallUrl | null, RoomError> {
    if (raw === null || raw === undefined) return ok(null)
    if (typeof raw !== 'string') return err(roomError('voice-call-invalid'))
    const text = raw.trim()
    if (text.length === 0) return ok(null)
    if (text.length > ROOM_LIMITS.maxVoiceCallUrlLength) return err(roomError('voice-call-invalid'))
    const url = URL.parse(text)
    const secure = url !== null && url.protocol === 'https:' && url.hostname !== ''
    const anonymous = url !== null && url.username === '' && url.password === ''
    return secure && anonymous ? ok(new VoiceCallUrl(url.href)) : err(roomError('voice-call-invalid'))
  }
}
