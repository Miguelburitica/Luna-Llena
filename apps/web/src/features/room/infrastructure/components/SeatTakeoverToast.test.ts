import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountRoomView } from '../mountRoomView.fixtures'
import SeatTakeoverToast from './SeatTakeoverToast.vue'

afterEach(() => {
  vi.useRealTimers()
})

describe('SeatTakeoverToast', () => {
  it('tells everyone a bot took a kicked seat, then fades', async () => {
    vi.useFakeTimers()
    const { wrapper, gateway } = await mountRoomView(SeatTakeoverToast)
    gateway.pushSeatTakenOver({ formerName: 'Tato', botName: 'Aureliano' })
    await flushPromises()
    expect(wrapper.text()).toBe('Tato was kicked. Aureliano (bot) takes the seat.')
    vi.advanceTimersByTime(6000)
    await flushPromises()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })
})
