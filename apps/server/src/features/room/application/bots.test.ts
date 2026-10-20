import { BOT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { unwrap } from '../domain/Room.fixtures'
import { createRoomKit } from './roomUseCases.fixtures'

const lobbyWithPlayers = async (names: readonly string[], randomValue = 0) => {
  const kit = createRoomKit(['LUNA42', 'NUBE77'], randomValue)
  const { session, narrator } = await kit.createRoom()
  const players = []
  for (const name of names) players.push(await kit.join(session.code, name))
  return { ...kit, code: session.code, narrator, players }
}

describe('AddBot', () => {
  it('fills the table with ready, connected, labeled bots', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Ana', 'Juan', 'Marta'])
    for (let count = 0; count < 3; count += 1) unwrap(await useCases.addBot.execute(narrator, {}))
    const members = publisher.latest?.members ?? []
    const bots = members.filter((member) => member.bot !== null)
    expect(members.filter((member) => !member.isNarrator)).toHaveLength(6)
    expect(bots.map((bot) => bot.name)).toEqual(['Aureliano', 'José Arcadio', 'Úrsula'])
    expect(publisher.latest?.botCast).toBe('solitude')
    expect(bots.every((bot) => bot.ready && bot.connected && bot.avatar !== null)).toBe(true)
    expect(publisher.latest?.startReadiness.playerCount).toBe(6)
  })

  it('spreads surprise personalities across the table', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Ana'], 0.1)
    unwrap(await useCases.addBot.execute(narrator, {}))
    unwrap(await useCases.addBot.execute(narrator, {}))
    const bots = publisher.latest?.members.filter((member) => member.bot !== null) ?? []
    expect(bots.map((bot) => bot.bot?.personality)).toEqual(['paranoid', 'follower'])
  })

  it('keeps the picked personality and difficulty', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Ana'])
    unwrap(await useCases.addBot.execute(narrator, { personality: 'detective', difficulty: 'sharp' }))
    expect(publisher.latest?.members.find((member) => member.bot !== null)?.bot).toEqual({
      personality: 'detective',
      difficulty: 'sharp'
    })
  })

  it('gives a free avatar and skips taken ones', async () => {
    const { useCases, publisher, narrator, players } = await lobbyWithPlayers(['Ana'])
    unwrap(await useCases.chooseAvatar.execute((players[0] as (typeof players)[number]).actor, { avatar: 'ana' }))
    unwrap(await useCases.addBot.execute(narrator, {}))
    expect(publisher.latest?.members.find((member) => member.bot !== null)?.avatar).toBe('caro')
  })

  it('stops at the bot limit', async () => {
    const { useCases, narrator } = await lobbyWithPlayers([])
    for (let count = 0; count < BOT_LIMITS.maxBots; count += 1) unwrap(await useCases.addBot.execute(narrator, {}))
    expect(await useCases.addBot.execute(narrator, {})).toEqual({ ok: false, error: { code: 'bot-limit' } })
  })

  it('only lets the narrator add bots', async () => {
    const { useCases, players } = await lobbyWithPlayers(['Ana'])
    expect(await useCases.addBot.execute((players[0] as (typeof players)[number]).actor, {})).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
  })

  it('rejects an unknown personality', async () => {
    const { useCases, narrator } = await lobbyWithPlayers([])
    expect(await useCases.addBot.execute(narrator, { personality: 'grumpy' })).toEqual({
      ok: false,
      error: { code: 'settings-invalid' }
    })
  })
})

describe('Bot names', () => {
  it('takes every bot of a room from one classic book, in the bots language', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Ana'], 0.5)
    unwrap(await useCases.updateSettings.execute(narrator, { settings: { botLanguage: 'en' } }))
    for (let count = 0; count < 3; count += 1) unwrap(await useCases.addBot.execute(narrator, {}))
    const names = publisher.latest?.members.filter((member) => member.bot !== null).map((member) => member.name)
    expect(publisher.latest?.botCast).toBe('alice')
    expect(names).toEqual(['Alice', 'Mad Hatter', 'March Hare'])
  })

  it('skips a name a human already took', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Aureliano'])
    unwrap(await useCases.addBot.execute(narrator, {}))
    expect(publisher.latest?.members.find((member) => member.bot !== null)?.name).toBe('José Arcadio')
  })

  it('draws a new book once every bot has left', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers([])
    unwrap(await useCases.addBot.execute(narrator, {}))
    const bot = publisher.latest?.members.find((member) => member.bot !== null)
    unwrap(await useCases.removeBot.execute(narrator, { memberId: bot?.id }))
    expect(publisher.latest?.botCast).toBeNull()
  })
})

describe('RemoveBot', () => {
  it('removes a bot from the lobby', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers(['Ana'])
    unwrap(await useCases.addBot.execute(narrator, {}))
    const bot = publisher.latest?.members.find((member) => member.bot !== null)
    unwrap(await useCases.removeBot.execute(narrator, { memberId: bot?.id }))
    expect(publisher.latest?.members.some((member) => member.bot !== null)).toBe(false)
  })

  it('refuses to remove a human as a bot', async () => {
    const { useCases, narrator, players } = await lobbyWithPlayers(['Caro'])
    const caro = players[0] as (typeof players)[number]
    expect(await useCases.removeBot.execute(narrator, { memberId: caro.actor.memberId })).toEqual({
      ok: false,
      error: { code: 'not-a-bot' }
    })
  })
})

describe('Bots in the room', () => {
  it('keeps bots ready and connected when the game starts and when the room reopens', async () => {
    const { useCases, publisher, narrator, starter } = await lobbyWithPlayers([])
    unwrap(await useCases.updateSettings.execute(narrator, { settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 5 } } }))
    for (let count = 0; count < 6; count += 1) unwrap(await useCases.addBot.execute(narrator, {}))
    unwrap(await useCases.startGame.execute(narrator))
    starter.over = true
    unwrap(await useCases.playAgain.execute(narrator))
    const bots = publisher.latest?.members.filter((member) => member.bot !== null) ?? []
    expect(bots).toHaveLength(6)
    expect(bots.every((bot) => bot.ready && bot.connected)).toBe(true)
  })

  it('lets the narrator switch the bots to English and rejects unknown languages', async () => {
    const { useCases, publisher, narrator } = await lobbyWithPlayers([])
    expect(publisher.latest?.settings.botLanguage ?? 'es').toBe('es')
    unwrap(await useCases.updateSettings.execute(narrator, { settings: { botLanguage: 'en' } }))
    expect(publisher.latest?.settings.botLanguage).toBe('en')
    expect(await useCases.updateSettings.execute(narrator, { settings: { botLanguage: 'fr' } })).toEqual({
      ok: false,
      error: { code: 'settings-invalid' }
    })
  })
})
