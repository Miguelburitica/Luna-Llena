import { describe, expect, it } from 'vitest'
import { suggestedDeckFor } from '../../domain/deckAdvice'
import { memberView, snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import NarratorLobby from './NarratorLobby.vue'

const players = ['Ana', 'Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Tato'].map((name) => memberView(name, { ready: true }))

describe('NarratorLobby', () => {
  it('lists the unmet start conditions and keeps Start disabled', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: {
        canStart: false,
        unmet: ['deck-mismatch', 'players-not-ready'],
        notReadyMemberIds: ['id-Marta', 'id-Tato'],
        playerCount: 7,
        deckSize: 8
      }
    })
    const { wrapper } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    expect(wrapper.text()).toContain('Mismatch')
    expect(wrapper.text()).toContain('Deck has 8 roles for 7 players.')
    expect(wrapper.text()).toContain('Everyone is ready (Marta, Tato)')
    const start = wrapper.findAll('button').find((button) => button.text().includes('Start game'))
    expect(start?.attributes('disabled')).toBeDefined()
  })

  it('starts the game when the room can start', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: { canStart: true, unmet: [], notReadyMemberIds: [], playerCount: 7, deckSize: 7 }
    })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    expect(wrapper.text()).toContain('Match')
    await wrapper.findAll('button').find((button) => button.text().includes('Start game'))?.trigger('click')
    expect(gateway.commands()).toContain('start')
  })

  it('asks before kicking a player', async () => {
    const snapshot = snapshotOf()
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    await wrapper.find('[aria-label="Kick Ana"]').trigger('click')
    expect(wrapper.text()).toContain('Kick Ana from the village?')
    expect(gateway.commands()).not.toContain('kick')
    const confirm = wrapper.findAll('.modal button').find((button) => button.text() === 'Kick Ana')
    await confirm?.trigger('click')
    expect(gateway.calls.at(-1)).toEqual({ command: 'kick', input: 'id-Ana' })
  })

  it('fills in the suggested deck for the players in the room', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: { canStart: false, unmet: ['deck-mismatch'], notReadyMemberIds: [], playerCount: 7, deckSize: 8 }
    })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    const suggest = wrapper.findAll('button').find((button) => button.text().includes('Use suggested deck for 7'))
    await suggest?.trigger('click')
    expect(gateway.calls.at(-1)).toEqual({ command: 'updateSettings', input: { deck: suggestedDeckFor(7) } })
  })

  it('disables the suggested deck below the minimum players', async () => {
    const { wrapper } = await mountRoomView(NarratorLobby, { props: { snapshot: snapshotOf(), memberId: 'id-Nico' } })
    const suggest = wrapper.findAll('button').find((button) => button.text().includes('Use suggested deck for 2'))
    expect(suggest?.attributes('disabled')).toBeDefined()
  })

  it('flags a deck without wolves before the start', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: { canStart: false, unmet: ['no-wolves'], notReadyMemberIds: [], playerCount: 7, deckSize: 7 }
    })
    const { wrapper } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    const row = wrapper.findAll('.narrator-checks li').find((item) => item.text().includes('Werewolf'))
    expect(row?.classes()).toContain('tone-bad')
  })

  it('adds a bot with the picked personality and difficulty', async () => {
    const snapshot = snapshotOf({ members: [memberView('Nico', { isNarrator: true }), memberView('Ana')] })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    const panel = wrapper.find('.bot-panel')
    await panel.findAll('.chip').find((chip) => chip.text() === 'Detective')?.trigger('click')
    await panel.findAll('.seg button').find((option) => option.text() === 'Sharp')?.trigger('click')
    await panel.find('.bot-add').trigger('click')
    expect(gateway.calls.find((call) => call.command === 'addBot')?.input).toEqual({ personality: 'detective', difficulty: 'sharp' })
  })

  it('lets surprise me leave the personality to chance', async () => {
    const snapshot = snapshotOf({ members: [memberView('Nico', { isNarrator: true })] })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    await wrapper.find('.bot-add').trigger('click')
    expect(gateway.calls.find((call) => call.command === 'addBot')?.input).toEqual({ difficulty: 'normal' })
  })

  it('labels bots and removes them without asking', async () => {
    const bot = memberView('Moco-Bot', { ready: true, bot: { personality: 'chaos', difficulty: 'easy' } })
    const snapshot = snapshotOf({ members: [memberView('Nico', { isNarrator: true }), bot], botCast: 'quixote' })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    const row = wrapper.findAll('.pcard').find((card) => card.text().includes('Moco-Bot'))
    expect(row?.find('.bot-tag').text()).toBe('BOT')
    expect(row?.text()).toContain('Chaos goblin · Easy')
    expect(wrapper.find('.bot-cast').text()).toBe('Characters from Don Quixote')
    await row?.find('[aria-label="Remove Moco-Bot"]').trigger('click')
    expect(gateway.calls.find((call) => call.command === 'removeBot')?.input).toBe('id-Moco-Bot')
  })

  it('switches the bots to English', async () => {
    const snapshot = snapshotOf({ members: [memberView('Nico', { isNarrator: true })] })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    await wrapper.findAll('.bot-panel .seg button').find((option) => option.text() === 'English')?.trigger('click')
    expect(gateway.calls.find((call) => call.command === 'updateSettings')?.input).toEqual({ botLanguage: 'en' })
  })
})
