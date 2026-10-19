import { describe, expect, it } from 'vitest'
import type { JournalEntry } from '../../domain/tableJournal'
import { advance, CARO, journalWith, logged, LUIS, MARTA, START, TATO } from '../../domain/tableJournal.fixtures'
import { mountTableView, press } from '../mountTableView.fixtures'
import TableOverView from './TableOverView.vue'

const ROLES = ['werewolf', 'seer', 'doctor', 'drunk', 'villager', 'villager'] as const

const villageWon = (): JournalEntry[] => [
  ...advance(3),
  ...[TATO, MARTA, CARO].map((voterId): JournalEntry => ({ kind: 'vote', voterId, targetId: LUIS, at: START })),
  ...advance(),
  { kind: 'end-game', at: START }
]

const mountOver = () => mountTableView(TableOverView, { path: '/table/over', journal: logged(journalWith(ROLES), ...villageWon()) })

describe('TableOverView', () => {
  it('The village celebrates: winner, every true role and the Drunk’s twist', async () => {
    const { wrapper } = await mountOver()

    expect(wrapper.find('.over-banner').text()).toContain('Village wins!')
    expect(wrapper.findAll('.over-role').map((role) => role.find('.over-role-name').text())).toEqual(['Luis', 'Tato', 'Marta', 'Caro', 'Juan', 'Sofi'])
    expect(wrapper.find('.over-roles').text()).toContain('Drunk')
    expect(wrapper.find('.over-twist').text()).toContain('Caro was the Drunk all along')
  })

  it('Votes remembered: Most Suspicious and the story are there, without Chatterbox', async () => {
    const { wrapper } = await mountOver()

    expect(wrapper.text()).toContain('Most Suspicious')
    expect(wrapper.text()).toContain('3 votes')
    expect(wrapper.text()).not.toContain('Chatterbox')
    expect(wrapper.text()).toContain('Night 1')
    expect(wrapper.text()).toContain('Day 1')
  })

  it('Rematch at the table: Play again deals new cards to the same names', async () => {
    const { wrapper, router, table } = await mountOver()
    await press(wrapper, /Play again/)

    expect(router.currentRoute.value.name).toBe('table-deal')
    expect(table.progress).toEqual({ stage: 'dealing', seatIndex: 0 })
    expect(table.journal?.setup.names.slice(0, 6)).toEqual(['Luis', 'Tato', 'Marta', 'Caro', 'Juan', 'Sofi'])
  })

  it('leaves and forgets the game', async () => {
    const { wrapper, router, kit } = await mountOver()
    await press(wrapper, 'Leave')

    expect(router.currentRoute.value.name).toBe('home')
    expect(kit.journals.saved).toBeNull()
  })
})
