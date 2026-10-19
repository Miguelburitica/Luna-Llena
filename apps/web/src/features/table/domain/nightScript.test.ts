import { narratorViewOf } from '@luna/rules'
import { describe, expect, it } from 'vitest'
import { replayJournal, type TableJournal } from './tableJournal'
import { advance, CARO, journalWith, logged, LUIS, MARTA, JUAN, SOFI, START, TATO } from './tableJournal.fixtures'
import { nightScriptOf, unloggedSteps } from './nightScript'

const NO_CHAT = { read: [], write: [], lastWordsUntil: null, villagePaused: false }

const scriptOf = (journal: TableJournal) => {
  const match = replayJournal(journal)
  if (!match.ok) throw new Error(match.error.code)
  return nightScriptOf(narratorViewOf(match.value, START, NO_CHAT))
}

describe('night script', () => {
  it('Script for the default deck: wolves, Seer, Drunk, Doctor and Witch by name', () => {
    expect(scriptOf(journalWith())).toEqual([
      { power: 'hunt', playerIds: [LUIS, TATO], status: 'pending' },
      { power: 'seer', playerIds: [MARTA], status: 'pending' },
      { power: 'drunk', playerIds: [CARO], status: 'pending' },
      { power: 'protect', playerIds: [JUAN], status: 'pending' },
      { power: 'potions', playerIds: [SOFI], status: 'pending' }
    ])
  })

  it('A dead Seer becomes a pretend step', () => {
    const journal = logged(journalWith(), { kind: 'set-alive', seatId: MARTA, alive: false, at: START }, ...advance(5))

    expect(scriptOf(journal).find((step) => step.power === 'seer')).toEqual({
      power: 'seer',
      playerIds: [MARTA],
      status: 'pretend'
    })
  })

  it('No Witch in the deck: there is no Witch step', () => {
    const journal = journalWith(['werewolf', 'seer', 'doctor', 'villager', 'villager', 'villager'])

    expect(scriptOf(journal).map((step) => step.power)).toEqual(['hunt', 'seer', 'protect'])
  })

  it('Forgot the Doctor: the Doctor step is still pending', () => {
    const journal = logged(
      journalWith(),
      { kind: 'hunt', targetId: JUAN, at: START },
      { kind: 'inspect', seerId: MARTA, targetId: LUIS, draw: 0, at: START },
      { kind: 'inspect', seerId: CARO, targetId: LUIS, draw: 0, at: START },
      { kind: 'potions', witchId: SOFI, heal: false, poisonTargetId: null, at: START }
    )

    expect(unloggedSteps(scriptOf(journal)).map((step) => step.power)).toEqual(['protect'])
  })

  it('is empty outside the night', () => {
    expect(scriptOf(logged(journalWith(), ...advance()))).toEqual([])
  })
})
