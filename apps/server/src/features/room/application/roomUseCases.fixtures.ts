import type { ReviewLabel, RoomSnapshot, SeatTakeover } from '@luna/contracts'
import { FixedClock } from '../../../shared/application/clockAndRandom.fixtures'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { FRIENDS, unwrap } from '../domain/Room.fixtures'
import { RoomCode } from '../domain/RoomCode'
import { InMemoryRoomRepository } from '../infrastructure/InMemoryRoomRepository'
import type { Actor, ContentGate, GameOpening, GameStarter, LobbyNotifier, ReviewedName, RoomPublisher, RoomStrike } from './ports'
import { createRoomUseCases } from './roomUseCases'

export class RecordingPublisher implements RoomPublisher {
  readonly snapshots: RoomSnapshot[] = []
  readonly kicked: Array<{ code: string; memberId: string }> = []
  readonly closed: string[] = []
  readonly takeovers: Array<{ code: string; takeover: SeatTakeover }> = []

  notifySeatTakenOver(code: string, takeover: SeatTakeover): void {
    this.takeovers.push({ code, takeover })
  }

  publish(snapshot: RoomSnapshot): void {
    this.snapshots.push(snapshot)
  }

  notifyKicked(code: string, memberId: string): void {
    this.kicked.push({ code, memberId })
  }

  notifyClosed(code: string): void {
    this.closed.push(code)
  }

  get latest(): RoomSnapshot | undefined {
    return this.snapshots.at(-1)
  }
}

export class RecordingGameStarter implements GameStarter {
  readonly openings: GameOpening[] = []
  readonly discarded: string[] = []
  readonly handedOver: string[] = []
  over = false

  async handOver(code: string): Promise<void> {
    this.handedOver.push(code)
  }

  async start(opening: GameOpening): Promise<void> {
    this.openings.push(opening)
  }

  async isOver(): Promise<boolean> {
    return this.over
  }

  async discard(code: string): Promise<void> {
    this.discarded.push(code)
  }
}

export class CountingLobby implements LobbyNotifier {
  changes = 0

  changed(): void {
    this.changes += 1
  }
}

export class FakeGate implements ContentGate {
  readonly banned = new Map<string, number>()
  readonly labels = new Map<string, ReviewLabel | 'blocked'>()
  readonly strikes: RoomStrike[] = []
  readonly reports: Array<{ roomCode: string; roomName: string; address: string }> = []
  readonly reviewed: Array<{ text: string; kind: ReviewedName }> = []

  async bannedUntil(client: ClientIdentity): Promise<number | null> {
    return this.banned.get(client.device) ?? null
  }

  async review(_roomCode: string, text: string, kind: ReviewedName): Promise<ReviewLabel | 'blocked' | null> {
    this.reviewed.push({ text, kind })
    return this.labels.get(text) ?? 'ok'
  }

  async strike(strike: RoomStrike): Promise<void> {
    this.strikes.push(strike)
  }

  async noteReport(report: { roomCode: string; roomName: string; address: string }): Promise<void> {
    this.reports.push(report)
  }
}

export const clientOf = (name: string, address = '10.0.0.1'): ClientIdentity => ({ address, device: `device-${name}` })

export const createRoomKit = (codes: readonly string[] = ['LUNA42', 'NUBE77'], randomValue = 0) => {
  let idSequence = 0
  let codeSequence = 0
  const rooms = new InMemoryRoomRepository()
  const publisher = new RecordingPublisher()
  const starter = new RecordingGameStarter()
  const lobby = new CountingLobby()
  const gate = new FakeGate()
  const clock = new FixedClock(1_000_000)
  const useCases = createRoomUseCases({
    lobby,
    gate,
    clock,
    rooms,
    publisher,
    starter,
    ids: { next: () => `id-${(idSequence += 1)}` },
    random: { next: () => randomValue },
    codes: { next: () => unwrap(RoomCode.parse(codes[codeSequence++ % codes.length])) }
  })

  const createRoom = async (voiceCallUrl?: unknown, visibility?: 'private' | 'public', client?: ClientIdentity) => {
    const session = unwrap(
      await useCases.createRoom.execute(
        { roomName: 'Los Primos', narratorName: 'Nico', voiceCallUrl, ...(visibility === undefined ? {} : { visibility }) },
        client
      )
    )
    const narrator: Actor = { code: session.code, memberId: session.memberId }
    return { session, narrator }
  }

  const join = async (code: string, name: string, client?: ClientIdentity) => {
    const session = unwrap(await useCases.joinRoom.execute({ code, name }, client))
    return { session, actor: { code: session.code, memberId: session.memberId } satisfies Actor }
  }

  const roomReadyToStart = async (playerCount: number, visibility?: 'private' | 'public') => {
    const { session, narrator } = await createRoom(undefined, visibility)
    unwrap(await useCases.updateSettings.execute(narrator, { settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: playerCount - 1 } } }))
    const players = []
    for (const name of FRIENDS.slice(0, playerCount)) {
      const player = await join(session.code, name, clientOf(name))
      unwrap(await useCases.setReady.execute(player.actor, { ready: true }))
      players.push(player)
    }
    return { code: session.code, narrator, players, firstPlayer: players[0] as (typeof players)[number] }
  }

  return { useCases, rooms, publisher, starter, lobby, gate, clock, createRoom, join, roomReadyToStart }
}
