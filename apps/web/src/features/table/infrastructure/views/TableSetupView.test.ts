import { describe, expect, it } from 'vitest'
import { journalWith } from '../../domain/tableJournal.fixtures'
import { buttonNamed, mountTableView, press } from '../mountTableView.fixtures'
import TableSetupView from './TableSetupView.vue'

const mountSetup = (journal = journalWith(undefined, { opened: false, names: [] })) =>
  mountTableView(TableSetupView, { path: '/table/setup', journal })

describe('TableSetupView', () => {
  it('Quick setup: 8 unnamed seats with the suggested deck can be dealt', async () => {
    const { wrapper, router, table } = await mountTableView(TableSetupView, { path: '/table/setup' })

    expect(wrapper.findAll('.table-setup-name input').map((input) => input.attributes('placeholder'))).toEqual(
      Array.from({ length: 8 }, (_, index) => `Player ${index + 1}`)
    )
    await press(wrapper, 'Suggested deck for 8')
    await press(wrapper, /Deal the roles/)

    expect(router.currentRoute.value.name).toBe('table-deal')
    expect(table.journal?.seats).toHaveLength(8)
  })

  it('Same name twice: the later seat shows name-taken and dealing is off', async () => {
    const { wrapper } = await mountTableView(TableSetupView, { path: '/table/setup' })
    const inputs = wrapper.findAll('.table-setup-name input')
    await inputs[1]?.setValue('Ana')
    await inputs[4]?.setValue('ana')

    expect(wrapper.findAll('.table-setup-name')[4]?.text()).toContain('That name is already at the table')
    expect(buttonNamed(wrapper, /Deal the roles/)?.attributes('disabled')).toBeDefined()
  })

  it('Deck too big: 7 players with 8 cards shows the deck mismatch', async () => {
    const { wrapper } = await mountTableView(TableSetupView, { path: '/table/setup' })
    await wrapper.find('button[aria-label="Fewer players"]').trigger('click')

    expect(wrapper.findAll('.table-setup-name')).toHaveLength(7)
    expect(wrapper.text()).toContain('The deck needs one card per player')
    expect(buttonNamed(wrapper, /Deal the roles/)?.attributes('disabled')).toBeDefined()
  })

  it('Too few players: the counter stops at 6', async () => {
    const { wrapper } = await mountTableView(TableSetupView, { path: '/table/setup' })
    for (let step = 0; step < 4; step += 1) await wrapper.find('button[aria-label="Fewer players"]').trigger('click')

    expect(wrapper.findAll('.table-setup-name')).toHaveLength(6)
  })

  it('Starting over: a saved game asks first, then a fresh setup opens', async () => {
    const { wrapper, kit } = await mountSetup(journalWith())

    expect(wrapper.text()).toContain('A table game is saved')
    expect(wrapper.find('form').exists()).toBe(false)
    await press(wrapper, 'Start over')

    expect(kit.journals.saved).toBeNull()
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
