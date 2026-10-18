import type { RoomSnapshot } from '@luna/contracts'
import { FRIENDS, unwrap } from '../domain/Room.fixtures'
import { RoomCode } from '../domain/RoomCode'
import { InMemoryRoomRepository } from '../infrastructure/InMemoryRoomRepository'
import type { Actor, GameOpening, GameStarter, RoomPublisher } from './ports'
import { createRoomUseCases } from './roomUseCases'

export class RecordingPublisher implements RoomPublisher {
  readonly snapshots: RoomSnapshot[] = []
  readonly kicked: Array<{ code: string; memberId: string }> = []
  readonly closed: string[] = []

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
  over = false

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

export const createRoomKit = (codes: readonly string[] = ['LUNA42', 'NUBE77']) => {
  let idSequence = 0
  let codeSequence = 0
  const rooms = new InMemoryRoomRepository()
  const publisher = new RecordingPublisher()
  const starter = new RecordingGameStarter()
  const useCases = createRoomUseCases({
    rooms,
    publisher,
    starter,
    ids: { next: () => `id-${(idSequence += 1)}` },
    codes: { next: () => unwrap(RoomCode.parse(codes[codeSequence++ % codes.length])) }
  })

  const createRoom = async (voiceCallUrl?: unknown) => {
    const session = unwrap(
      await useCases.createRoom.execute({ roomName: 'Los Primos', narratorName: 'Nico', voiceCallUrl })
    )
    const narrator: Actor = { code: session.code, memberId: session.memberId }
    return { session, narrator }
  }

  const join = async (code: string, name: string) => {
    const session = unwrap(await useCases.joinRoom.execute({ code, name }))
    return { session, actor: { code: session.code, memberId: session.memberId } satisfies Actor }
  }

  const roomReadyToStart = async (playerCount: number) => {
    const { session, narrator } = await createRoom()
    unwrap(await useCases.updateSettings.execute(narrator, { settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: playerCount - 1 } } }))
    const players = []
    for (const name of FRIENDS.slice(0, playerCount)) {
      const player = await join(session.code, name)
      unwrap(await useCases.setReady.execute(player.actor, { ready: true }))
      players.push(player)
    }
    return { code: session.code, narrator, players, firstPlayer: players[0] as (typeof players)[number] }
  }

  return { useCases, rooms, publisher, starter, createRoom, join, roomReadyToStart }
}
