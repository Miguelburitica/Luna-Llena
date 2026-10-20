import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { mountMatchView } from '../mountMatchView.fixtures'
import GameView from './GameView.vue'

describe('GameView after a kick', () => {
  it('tells a kicked player a bot took their seat', async () => {
    const { wrapper, rooms } = await mountMatchView(GameView)
    rooms.pushKicked()
    await flushPromises()
    expect(wrapper.text()).toContain('You were removed')
    expect(wrapper.text()).toContain('A bot took your seat.')
  })

  it('still says the room closed when the narrator closes it', async () => {
    const { wrapper, rooms } = await mountMatchView(GameView)
    rooms.pushClosed()
    await flushPromises()
    expect(wrapper.text()).toContain('The village emptied')
  })
})
