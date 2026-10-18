import { describe, expect, it } from 'vitest'
import { accessOf } from '../application/ChatGateway.fixtures'
import { channelIconOf, defaultTab, isDead, monitorChannels, MONITOR_TABS, visibleTabs } from './channels'

describe('chat tabs', () => {
  it('shows one tab per readable channel in a fixed order', () => {
    expect(visibleTabs(accessOf({ read: ['ghosts', 'village'] }))).toEqual(['village', 'ghosts'])
    expect(visibleTabs(accessOf({ read: ['village', 'wolves'] }))).toEqual(['village', 'wolves'])
    expect(visibleTabs(accessOf({ read: [] }))).toEqual([])
  })

  it('treats a member who reads the ghosts as dead and opens on that channel', () => {
    expect(isDead(accessOf({ read: ['village', 'ghosts'] }))).toBe(true)
    expect(isDead(accessOf())).toBe(false)
    expect(defaultTab(accessOf({ read: ['village', 'ghosts'] }))).toBe('ghosts')
    expect(defaultTab(accessOf({ read: ['village', 'wolves'] }))).toBe('village')
    expect(defaultTab(accessOf({ read: [] }))).toBe('village')
  })

  it('opens on the wolves for a wolf who may write there', () => {
    expect(defaultTab(accessOf({ read: ['village', 'wolves'], write: ['wolves'] }))).toBe('wolves')
    expect(defaultTab(accessOf({ read: ['village', 'wolves'], write: ['village'] }))).toBe('village')
  })

  it('gives the narrator an all tab ahead of the channels', () => {
    expect(MONITOR_TABS).toEqual(['all', 'village', 'wolves', 'ghosts'])
    expect(monitorChannels('all')).toEqual(['village', 'wolves', 'ghosts'])
    expect(monitorChannels('wolves')).toEqual(['wolves'])
  })

  it('has an icon for every channel', () => {
    expect(['village', 'wolves', 'ghosts'].map((channel) => channelIconOf(channel as 'village'))).toEqual(['home', 'paw', 'ghost'])
  })
})
