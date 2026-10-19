import { describe, expect, it } from 'vitest'
import { suggestedDeckFor } from '@/features/room/domain/deckAdvice'
import { defaultTableSetup } from '../domain/tableSetup'
import { ANA, CARO, JUAN, journalWith, LUIS, MARTA, PIPE, SOFI, TATO } from '../domain/tableJournal.fixtures'
import { createTableTestApp } from './Table.fixtures'

const inGame = () => createTableTestApp(journalWith())

const advanceTimes = (store: ReturnType<typeof inGame>['store'], times: number) => {
  for (let step = 0; step < times; step += 1) store.advance()
}

describe('useTableStore', () => {
  it('Offline table: deals and plays with only the device adapters', () => {
    const { store } = createTableTestApp()

    expect(store.deal({ ...defaultTableSetup(), deck: suggestedDeckFor(8) })).toBe(true)
    expect(store.progress).toEqual({ stage: 'dealing', seatIndex: 0 })
  })

  it('refuses to deal a setup with unmet conditions', () => {
    const { store } = createTableTestApp()

    expect(store.deal({ ...defaultTableSetup(), deck: suggestedDeckFor(9) })).toBe(false)
    expect(store.journal).toBeNull()
  })

  it('Privacy between players and No peeking back: seeing moves forward only', () => {
    const { store } = createTableTestApp()
    store.deal(defaultTableSetup())

    store.markSeen()

    expect(store.progress).toEqual({ stage: 'dealing', seatIndex: 1 })
  })

  it('opens the logbook only once every seat has seen their card', () => {
    const { store } = createTableTestApp()
    store.deal(defaultTableSetup())
    store.openLogbook()
    expect(store.progress?.stage).toBe('dealing')

    for (let seat = 0; seat < 8; seat += 1) store.markSeen()
    store.openLogbook()

    expect(store.progress).toEqual({ stage: 'logbook' })
    expect(store.view?.phase).toBe('night')
  })

  it('A full day passes: five Nexts from Night 1 reach Night 2', () => {
    const { store } = inGame()
    advanceTimes(store, 5)

    expect(store.view).toMatchObject({ phase: 'night', round: 2 })
  })

  it('The narrator sees everything, the Drunk as Drunk', () => {
    expect(inGame().store.view?.roles[CARO]).toBe('drunk')
  })

  it('Same patient twice is rejected with protected-last-night', () => {
    const { store } = inGame()
    store.logProtect(JUAN, ANA)
    advanceTimes(store, 5)

    expect(store.logProtect(JUAN, ANA)).toEqual({ ok: false, error: { code: 'protected-last-night' } })
    expect(store.failure).toEqual({ code: 'protected-last-night' })
    expect(store.match?.blockedPatientOf(JUAN)).toBe(ANA)
  })

  it('Heal already used is rejected with potion-used', () => {
    const { store } = inGame()
    store.logHunt(ANA)
    store.logPotions(SOFI, true, null)
    advanceTimes(store, 5)

    expect(store.logPotions(SOFI, true, null)).toEqual({ ok: false, error: { code: 'potion-used' } })
  })

  it('Saved by the Doctor: nobody dies', () => {
    const { store } = inGame()
    store.logHunt(ANA)
    store.logProtect(JUAN, ANA)
    store.advance()

    expect(store.view?.dawn?.deaths).toEqual([])
  })

  it('Poison and claws: both die at dawn', () => {
    const { store } = inGame()
    store.logHunt(JUAN)
    store.logPotions(SOFI, false, LUIS)
    store.advance()

    expect(store.view?.dawn?.deaths).toEqual(expect.arrayContaining([JUAN, LUIS]))
  })

  it('One last shot and Waiting for the shot', () => {
    const { store } = inGame()
    store.logHunt(PIPE)
    store.advance()

    expect(store.view?.revenge).toEqual({ hunterId: PIPE, targetId: null, pending: true })
    expect(store.advance()).toEqual({ ok: false, error: { code: 'revenge-pending' } })
    store.logRevenge(TATO)
    expect(store.view?.players.find((player) => player.id === TATO)?.alive).toBe(false)
  })

  it('A tie executes nobody', () => {
    const { store } = inGame()
    advanceTimes(store, 3)
    store.logVote(ANA, LUIS)
    store.logVote(CARO, TATO)
    store.advance()

    expect(store.view?.verdict).toMatchObject({ tie: true, executedId: null })
  })

  it('Fooled you: the Fool is a solo winner and the game goes on', () => {
    const { store } = createTableTestApp(journalWith(['werewolf', 'werewolf', 'fool', 'seer', 'villager', 'villager', 'villager', 'villager']))
    advanceTimes(store, 3)
    store.logVote(ANA, MARTA)
    store.advance()

    expect(store.view?.verdict?.foolWins).toBe(true)
    expect(store.view?.soloWinnerIds).toEqual([MARTA])
    expect(store.view?.outcome).toBeNull()
  })

  it('Last wolf falls: the village is the pending winner', () => {
    const { store } = createTableTestApp(journalWith(['werewolf', 'seer', 'doctor', 'villager', 'villager', 'villager']))
    advanceTimes(store, 3)
    store.logVote(TATO, LUIS)
    store.advance()

    expect(store.view?.pendingWinner).toBe('village')
  })

  it('Wolves take over after dawn', () => {
    const { store } = createTableTestApp(journalWith(['werewolf', 'werewolf', 'seer', 'villager', 'villager']))
    store.logHunt(MARTA)
    store.advance()

    expect(store.view?.pendingWinner).toBe('wolves')
    store.keepPlaying()
    expect(store.view?.pendingWinner).toBeNull()
  })

  it('A player goes home: the narrator change is in the story', () => {
    const { store } = inGame()
    advanceTimes(store, 2)
    store.setAlive(PIPE, false)
    store.setAlive(PIPE, true)
    advanceTimes(store, 1)
    store.logVote(ANA, LUIS)
    store.advance()
    store.endGame()

    expect(store.match?.timeline.filter((entry) => entry.kind === 'narrator')).toHaveLength(2)
  })

  it('Votes remembered: Most Suspicious counts every vote received', () => {
    const { store } = createTableTestApp(journalWith(['werewolf', 'seer', 'doctor', 'villager', 'villager', 'villager']))
    advanceTimes(store, 3)
    for (const voter of [TATO, MARTA, CARO]) store.logVote(voter, LUIS)
    store.advance()
    store.endGame()

    expect(store.view?.outcome?.awards).toContainEqual({ award: 'most-suspicious', memberId: LUIS, count: 3 })
  })

  it('Rematch at the table: a new deal with the same names', () => {
    const { store, kit } = inGame()
    store.playAgain()

    expect(store.progress).toEqual({ stage: 'dealing', seatIndex: 0 })
    expect(store.journal?.setup.names).toEqual(journalWith().setup.names)
    expect(kit.journals.saved?.entries).toEqual([])
  })

  it('The phone locks mid-game: a new store resumes the same state', () => {
    const first = inGame()
    first.store.logHunt(JUAN)
    first.store.logPotions(SOFI, true, null)
    advanceTimes(first.store, 2)

    const resumed = createTableTestApp(first.kit.journals.saved)

    expect(resumed.store.view).toMatchObject({ phase: 'day', round: 1 })
    expect(resumed.store.match?.potionsSpentBy(SOFI).heal).toBe(true)
  })

  it('Starting over: abandon discards the saved game', () => {
    const { store, kit } = inGame()
    store.abandon()

    expect(store.hasSaved).toBe(false)
    expect(kit.journals.saved).toBeNull()
  })

  it('undoes the last action and reports nothing-to-undo at the start', () => {
    const { store } = inGame()
    expect(store.undo()).toEqual({ ok: false, error: { code: 'nothing-to-undo' } })
    store.logHunt(ANA)
    store.undo()
    expect(store.match?.packVictim()).toBeNull()
  })
})
