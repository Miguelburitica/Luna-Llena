import type { CastVote } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { playerViewOf, youOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const voting = { voted: 5, locked: 2, voters: 7 }

const mountVote = (vote: CastVote | null = null, overrides = {}) => {
  const view = playerViewOf({
    phase: 'vote',
    round: 2,
    players: matchPlayers({ 'id-Juan': { alive: false } }),
    voting,
    you: youOf({ vote }),
    ...overrides
  })
  return mountMatchView(PlayerTable, { view, props: { view } })
}

const pickNames = (wrapper: Awaited<ReturnType<typeof mountVote>>['wrapper']) =>
  wrapper.findAll('.vote-dock .pick').map((pick) => pick.find('.pick-name').text())

const buttonWith = (wrapper: Awaited<ReturnType<typeof mountVote>>['wrapper'], text: string) =>
  wrapper.findAll('.vote-dock button').find((button) => button.text().includes(text))

describe('VoteDock', () => {
  it('offers living players other than you and shows how many voted', async () => {
    const { wrapper } = await mountVote()
    expect(pickNames(wrapper)).toEqual(['Marta', 'Luis', 'Sofi', 'Caro', 'Tato', 'Pipe'])
    expect(wrapper.find('.vote-dock .sbadge').text()).toBe('5 of 7 voted')
    expect(wrapper.find('.vote-dock .h3').text()).toBe('Tap a suspect')
  })

  it('votes for the tapped player', async () => {
    const { wrapper, matches } = await mountVote()
    await wrapper.findAll('.vote-dock .pick')[1]?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'vote', input: { targetId: 'id-Luis' } }])
  })

  it('marks your vote and offers to lock it', async () => {
    const { wrapper, matches } = await mountVote({ targetId: 'id-Luis', locked: false })
    const picked = wrapper.findAll('.vote-dock .pick').find((pick) => pick.classes().includes('is-sel'))
    expect(picked?.find('.pick-name').text()).toBe('Luis')
    const lock = buttonWith(wrapper, 'Lock vote on Luis')
    await lock?.trigger('click')
    expect(matches.commands()).toEqual(['lockVote'])
  })

  it('cannot lock before voting and clears a vote to abstain', async () => {
    const empty = await mountVote()
    expect(buttonWith(empty.wrapper, 'Lock vote')?.attributes('disabled')).toBeDefined()
    const voted = await mountVote({ targetId: 'id-Luis', locked: false })
    await buttonWith(voted.wrapper, 'Clear my vote')?.trigger('click')
    expect(voted.matches.calls).toEqual([{ command: 'vote', input: { targetId: null } }])
  })

  it('shows Locked on X and freezes the picker once locked', async () => {
    const { wrapper, matches } = await mountVote({ targetId: 'id-Luis', locked: true })
    expect(wrapper.find('.vote-dock [role="status"]').text()).toBe('Locked on Luis')
    expect(buttonWith(wrapper, 'Lock vote')).toBeUndefined()
    const picks = wrapper.findAll('.vote-dock .pick')
    expect(picks.every((pick) => pick.attributes('disabled') !== undefined)).toBe(true)
    await picks[0]?.trigger('click')
    expect(matches.calls).toEqual([])
  })

  it('shows a rejected vote', async () => {
    const { wrapper, matches } = await mountVote({ targetId: 'id-Luis', locked: false })
    matches.failWith('vote', 'vote-locked')
    await wrapper.findAll('.vote-dock .pick')[0]?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vote-dock .err').text()).toBe('Your vote is locked.')
  })

  it('shows no vote dock to the dead or outside the vote', async () => {
    const dead = await mountVote(null, { players: matchPlayers({ 'id-Ana': { alive: false } }) })
    expect(dead.wrapper.find('.vote-dock').exists()).toBe(false)
    const day = await mountVote(null, { phase: 'day', voting: null })
    expect(day.wrapper.find('.vote-dock').exists()).toBe(false)
  })
})
