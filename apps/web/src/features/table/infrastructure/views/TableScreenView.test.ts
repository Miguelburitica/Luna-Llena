import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { advance, journalWith, logged, START } from '../../domain/tableJournal.fixtures'
import { mountTableView } from '../mountTableView.fixtures'
import TableScreenView from './TableScreenView.vue'

afterEach(() => vi.useRealTimers())

describe('TableScreenView', () => {
  it('Facing the table: the day scene and countdown, and no living player’s role', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
    const { wrapper } = await mountTableView(TableScreenView, { path: '/table/stage', journal: logged(journalWith(), ...advance(2)) })

    expect(wrapper.find('.stage').classes()).toContain('ph-day')
    expect(wrapper.find('.stage-clock').text()).toBe('3:00')
    for (const role of ['Werewolf', 'Seer', 'Drunk', 'Doctor', 'Witch', 'Hunter', 'Fool']) expect(wrapper.text()).not.toContain(role)
  })

  it('Lightning for the table: the table screen flashes', async () => {
    const { wrapper, atmosphere } = await mountTableView(TableScreenView, { path: '/table/stage', journal: logged(journalWith(), ...advance(2)) })
    atmosphere.cues.emit({ kind: 'effect', effect: 'lightning' })
    await flushPromises()

    expect(wrapper.find('.screen-lightning').exists()).toBe(true)
  })

  it('returns to the logbook only after a hold', async () => {
    vi.useFakeTimers()
    const { wrapper, router } = await mountTableView(TableScreenView, { path: '/table/stage', journal: journalWith() })
    await wrapper.find('.hold').trigger('pointerdown')
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('table')
  })
})
