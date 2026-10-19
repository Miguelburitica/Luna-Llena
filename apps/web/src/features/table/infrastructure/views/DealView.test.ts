import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { journalWith } from '../../domain/tableJournal.fixtures'
import { buttonNamed, mountTableView, press } from '../mountTableView.fixtures'
import DealView from './DealView.vue'

afterEach(() => vi.useRealTimers())

const dealing = () => mountTableView(DealView, { path: '/table/deal', journal: journalWith(undefined, { opened: false }) })

const reveal = async (wrapper: Awaited<ReturnType<typeof dealing>>['wrapper'], name: string) => {
  await press(wrapper, `I’m ${name}`)
  await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
  await flushPromises()
}

describe('DealView', () => {
  it('Privacy between players: after "I’ve seen it" only the next name shows', async () => {
    const { wrapper } = await dealing()
    expect(wrapper.text()).toContain('Pass the phone to Luis')
    expect(wrapper.find('.rcard').exists()).toBe(false)

    await reveal(wrapper, 'Luis')
    await press(wrapper, 'I’ve seen it')

    expect(wrapper.text()).toContain('Pass the phone to Tato')
    expect(wrapper.text()).toContain('Seat 2 of 8')
    expect(wrapper.find('.rcard').exists()).toBe(false)
  })

  it('No peeking back: there is no way to show an earlier card', async () => {
    const { wrapper } = await dealing()
    await reveal(wrapper, 'Luis')
    await press(wrapper, 'I’ve seen it')

    expect(buttonNamed(wrapper, /back|previous/i)).toBeUndefined()
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['I’m Tato'])
  })

  it('The Drunk’s card shows the Seer and the village', async () => {
    const { wrapper, table } = await dealing()
    for (let seat = 0; seat < 3; seat += 1) table.markSeen()
    await flushPromises()
    await reveal(wrapper, 'Caro')

    expect(wrapper.find('.rcard-name').text()).toBe('Seer')
    expect(wrapper.find('.tbadge').text()).toBe('Village')
  })

  it('The pack: a Werewolf sees the other Werewolf by name', async () => {
    const { wrapper } = await dealing()
    await reveal(wrapper, 'Luis')

    expect(wrapper.find('.reveal-pack').text()).toContain('Tato')
    expect(wrapper.find('.reveal-pack').text()).toContain('Luis (you)')
  })

  it('Back to the narrator and A quick tap: only a hold opens the logbook', async () => {
    vi.useFakeTimers()
    const { wrapper, router, table } = await dealing()
    for (let seat = 0; seat < 8; seat += 1) table.markSeen()
    await flushPromises()
    expect(wrapper.text()).toContain('Give the phone back to the narrator')
    const hold = wrapper.find('.hold')

    await hold.trigger('pointerdown')
    await vi.advanceTimersByTimeAsync(300)
    await hold.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(1000)
    expect(table.progress?.stage).toBe('hand-back')

    await hold.trigger('pointerdown')
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
    expect(table.progress?.stage).toBe('logbook')
    expect(router.currentRoute.value.name).toBe('table')
  })
})
