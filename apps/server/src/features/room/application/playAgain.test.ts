import { describe, expect, it } from 'vitest'
import { unwrap } from '../domain/Room.fixtures'
import { createRoomKit } from './roomUseCases.fixtures'

const startedGame = async (playerCount = 6) => {
  const kit = createRoomKit()
  const game = await kit.roomReadyToStart(playerCount)
  unwrap(await kit.useCases.startGame.execute(game.narrator))
  return { ...kit, ...game }
}

describe('PlayAgain', () => {
  it('returns the room to the lobby with the same seats and everyone not ready', async () => {
    const { useCases, publisher, starter, narrator, code } = await startedGame()
    const seated = publisher.latest?.members.map((member) => ({ ...member, ready: false }))
    starter.over = true
    unwrap(await useCases.playAgain.execute(narrator))
    expect(publisher.latest).toMatchObject({ code, status: 'lobby' })
    expect(publisher.latest?.members).toEqual(seated)
  })

  it('keeps names, avatars and settings', async () => {
    const kit = createRoomKit()
    const { narrator, players } = await kit.roomReadyToStart(6)
    const [ana] = players as [(typeof players)[number]]
    unwrap(await kit.useCases.chooseAvatar.execute(ana.actor, { avatar: 'ana' }))
    unwrap(await kit.useCases.startGame.execute(narrator))
    const settings = kit.publisher.latest?.settings
    kit.starter.over = true
    unwrap(await kit.useCases.playAgain.execute(narrator))
    expect(kit.publisher.latest?.settings).toEqual(settings)
    expect(kit.publisher.latest?.members.find((member) => member.id === ana.actor.memberId)).toMatchObject({
      name: 'Ana',
      avatar: 'ana',
      ready: false
    })
  })

  it('accepts new players and readiness again', async () => {
    const { useCases, starter, narrator, players, join, code } = await startedGame()
    starter.over = true
    unwrap(await useCases.playAgain.execute(narrator))
    await join(code, 'Newcomer')
    unwrap(await useCases.setReady.execute((players[0] as (typeof players)[number]).actor, { ready: true }))
  })

  it('discards the old game after the room is saved and published', async () => {
    const { useCases, starter, narrator, publisher } = await startedGame()
    starter.over = true
    unwrap(await useCases.playAgain.execute(narrator))
    expect(starter.discarded).toEqual(['LUNA42'])
    expect(publisher.latest?.status).toBe('lobby')
  })

  it('rejects playing again during a running game', async () => {
    const { useCases, starter, narrator, publisher } = await startedGame()
    expect(await useCases.playAgain.execute(narrator)).toEqual({ ok: false, error: { code: 'game-not-over' } })
    expect(starter.discarded).toEqual([])
    expect(publisher.latest?.status).toBe('in-game')
  })

  it('rejects playing again from the lobby', async () => {
    const { useCases, starter, createRoom } = createRoomKit()
    starter.over = true
    const { narrator } = await createRoom()
    expect(await useCases.playAgain.execute(narrator)).toEqual({ ok: false, error: { code: 'game-not-over' } })
  })

  it('rejects a player with not-narrator even when the game is over', async () => {
    const { useCases, starter, players } = await startedGame()
    starter.over = true
    expect(await useCases.playAgain.execute((players[0] as (typeof players)[number]).actor)).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
    expect(starter.discarded).toEqual([])
  })

  it('rejects a stranger', async () => {
    const { useCases } = await startedGame()
    expect(await useCases.playAgain.execute({ code: 'LUNA42', memberId: 'ghost' })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
  })
})
