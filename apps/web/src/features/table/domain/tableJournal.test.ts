import { ROLE_IDS } from '@luna/contracts'
import { SeededRandom } from '@luna/rules/fixtures'
import { describe, expect, it } from 'vitest'
import {
  appendEntry,
  dealJournal,
  dealProgressOf,
  markSeen,
  openLogbook,
  replayJournal,
  undoLast,
  type TableJournal
} from './tableJournal'
import {
  advance,
  ANA,
  CARO,
  JUAN,
  journalWith,
  logged,
  LUIS,
  MARTA,
  PIPE,
  setupFor,
  SOFI,
  START,
  TATO
} from './tableJournal.fixtures'

const matchOf = (journal: TableJournal) => {
  const result = replayJournal(journal)
  if (!result.ok) throw new Error(result.error.code)
  return result.value
}

const aliveOf = (journal: TableJournal, seatId: string) => matchOf(journal).seats.find((seat) => seat.memberId === seatId)?.alive

describe('dealing', () => {
  it('Seven seats, seven cards: every card goes to exactly one seat', () => {
    const roles = ['werewolf', 'werewolf', 'seer', 'doctor', 'witch', 'hunter', 'fool'] as const
    const journal = dealJournal(setupFor(roles), new SeededRandom(7), START)

    expect(journal.seats).toHaveLength(7)
    expect(journal.seats.map((seat) => seat.role).sort()).toEqual([...roles].sort())
    expect(new Set(journal.seats.map((seat) => seat.id)).size).toBe(7)
  })

  it('Reload mid-deal: progress resumes at the first seat that has not seen their card', () => {
    let journal = dealJournal(setupFor(ROLE_IDS.slice(0, 8)), new SeededRandom(3), START)
    for (let seat = 0; seat < 3; seat += 1) journal = markSeen(journal)
    const reloaded = JSON.parse(JSON.stringify(journal)) as TableJournal

    expect(dealProgressOf(reloaded)).toEqual({ stage: 'dealing', seatIndex: 3 })
    expect(reloaded.seats).toEqual(journal.seats)
  })

  it('needs every seat to have seen their card before the logbook opens', () => {
    let journal = journalWith(undefined, { opened: false })

    expect(openLogbook(journal, START).logbookOpen).toBe(false)
    for (let seat = 0; seat < 8; seat += 1) journal = markSeen(journal)
    expect(dealProgressOf(journal)).toEqual({ stage: 'hand-back' })
    expect(dealProgressOf(openLogbook(journal, START))).toEqual({ stage: 'logbook' })
  })

  it('starts the first night when the logbook opens', () => {
    let journal = journalWith(undefined, { opened: false })
    for (let seat = 0; seat < 8; seat += 1) journal = markSeen(journal)

    expect(openLogbook(journal, START + 90_000).startedAt).toBe(START + 90_000)
  })
})

describe('logging', () => {
  it('The pack points: the hunt counts for every living Werewolf', () => {
    const journal = logged(journalWith(), { kind: 'hunt', targetId: JUAN, at: START })
    const match = matchOf(journal)

    expect(match.packVictim()).toBe(JUAN)
    expect(match.night.huntPicks.map((pick) => pick.wolfId).sort()).toEqual([LUIS, TATO])
  })

  it('Wolves cannot eat wolves', () => {
    const result = appendEntry(journalWith(), { kind: 'hunt', targetId: TATO, at: START })

    expect(result).toEqual({ ok: false, error: { code: 'target-invalid' } })
  })

  it('keeps a Drunk vision stable on replay', () => {
    const journal = logged(journalWith(), { kind: 'inspect', seerId: CARO, targetId: ANA, draw: 0.2, at: START })

    expect(matchOf(journal).visionsOf(CARO)).toEqual([{ round: 1, targetId: ANA, isWolf: true }])
    expect(matchOf(journal).visionsOf(CARO)).toEqual([{ round: 1, targetId: ANA, isWolf: true }])
  })

  it('One peek per night: a second vision is rejected with already-inspected', () => {
    const journal = logged(journalWith(), { kind: 'inspect', seerId: MARTA, targetId: LUIS, draw: 0, at: START })

    expect(appendEntry(journal, { kind: 'inspect', seerId: MARTA, targetId: ANA, draw: 0, at: START })).toEqual({
      ok: false,
      error: { code: 'already-inspected' }
    })
  })

  it('Poison and claws: the victim and the poisoned die at dawn', () => {
    const journal = logged(
      journalWith(),
      { kind: 'hunt', targetId: JUAN, at: START },
      { kind: 'potions', witchId: SOFI, heal: false, poisonTargetId: LUIS, at: START },
      ...advance()
    )

    expect(aliveOf(journal, JUAN)).toBe(false)
    expect(aliveOf(journal, LUIS)).toBe(false)
  })

  it('logs votes per voter and executes the most voted at Next', () => {
    const journal = logged(
      journalWith(),
      ...advance(3),
      { kind: 'vote', voterId: ANA, targetId: LUIS, at: START },
      { kind: 'vote', voterId: CARO, targetId: LUIS, at: START },
      { kind: 'vote', voterId: PIPE, targetId: SOFI, at: START },
      ...advance()
    )

    expect(matchOf(journal).verdict?.executedId).toBe(LUIS)
  })

  it('takes the Hunter shot for the pending Hunter', () => {
    const journal = logged(journalWith(), { kind: 'hunt', targetId: PIPE, at: START }, ...advance(), {
      kind: 'avenge',
      targetId: TATO,
      at: START
    })

    expect(aliveOf(journal, TATO)).toBe(false)
  })
})

describe('undo', () => {
  it('Wrong victim: undo leaves the pack without a victim', () => {
    const journal = logged(journalWith(), { kind: 'hunt', targetId: ANA, at: START })
    const undone = undoLast(journal)

    expect(undone.ok && matchOf(undone.value).packVictim()).toBeNull()
  })

  it('Undo a dawn: the heal potion is available again', () => {
    const journal = logged(
      journalWith(),
      { kind: 'hunt', targetId: JUAN, at: START },
      { kind: 'potions', witchId: SOFI, heal: true, poisonTargetId: null, at: START },
      ...advance()
    )
    expect(matchOf(journal).potionsSpentBy(SOFI).heal).toBe(true)

    const undone = undoLast(journal)

    expect(undone.ok && matchOf(undone.value).phase).toBe('night')
    expect(undone.ok && matchOf(undone.value).potionsSpentBy(SOFI).heal).toBe(false)
  })

  it('Nothing to undo at the start of Night 1', () => {
    expect(undoLast(journalWith())).toEqual({ ok: false, error: { code: 'nothing-to-undo' } })
  })
})
