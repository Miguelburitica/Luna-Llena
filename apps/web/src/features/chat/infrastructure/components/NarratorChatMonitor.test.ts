import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { accessOf, messageOf } from '../../application/ChatGateway.fixtures'
import { narratorViewOf } from '@/features/match/application/MatchGateway.fixtures'
import NarratorDashboard from '@/features/match/infrastructure/components/NarratorDashboard.vue'
import { matchPlayers, mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'

const narratorAccess = accessOf({ read: ['village', 'wolves', 'ghosts'], write: ['village'] })

const history = [
  messageOf({ channel: 'wolves', authorId: 'id-Tato', text: 'him. he is too smart.' }),
  messageOf({ channel: 'ghosts', authorId: 'id-Juan', text: 'the bakery was nice' }),
  messageOf({ authorId: 'id-Nico', kind: 'narrator', text: 'The fog is thick tonight. Lock your doors.' }),
  messageOf({ authorId: 'id-Pipe', text: 'Sofi is being weird' })
]

const mountMonitor = () => {
  const view = narratorViewOf({ players: matchPlayers(), chat: narratorAccess })
  return mountMatchView(NarratorDashboard, {
    view,
    props: { view },
    memberId: 'id-Nico',
    configure: ({ chats }) => chats.withHistory(history)
  })
}

const tabNamed = (wrapper: Awaited<ReturnType<typeof mountMonitor>>['wrapper'], name: string) =>
  wrapper.findAll('.tab').find((tab) => tab.text().startsWith(name))

describe('narrator chat monitor', () => {
  it('lives in the dashboard with All, Village, Wolves and Ghosts tabs', async () => {
    const { wrapper } = await mountMonitor()
    expect(wrapper.find('.panel .tabs').exists()).toBe(true)
    expect(wrapper.findAll('.tabs .tab').map((tab) => tab.text())).toEqual(['All', 'Village', 'Wolves', 'Ghosts'])
    expect(tabNamed(wrapper, 'All')?.classes()).toContain('is-on')
  })

  it('shows every channel on All with its channel label', async () => {
    const { wrapper } = await mountMonitor()
    const whos = wrapper.findAll('.chat-list .who').map((who) => who.text())
    expect(whos).toEqual(['Tato · Wolves', 'Juan · Ghosts', 'Narrator · to everyone', 'Pipe · Village'])
    expect(wrapper.findAll('.chat-list .msg').map((message) => message.classes().filter((name) => name !== 'msg'))).toEqual([
      ['msg-wolf'],
      ['msg-ghost'],
      ['msg-narr'],
      []
    ])
  })

  it('filters by channel', async () => {
    const { wrapper } = await mountMonitor()
    await tabNamed(wrapper, 'Wolves')?.trigger('click')
    expect(wrapper.findAll('.chat-list .bubble').map((bubble) => bubble.text())).toEqual(['Tato · Wolveshim. he is too smart.'])
    await tabNamed(wrapper, 'Village')?.trigger('click')
    expect(wrapper.findAll('.chat-list .msg')).toHaveLength(2)
    expect(wrapper.find('.chat-list').text()).not.toContain('too smart')
  })

  it('counts unread messages of the channels it is not showing', async () => {
    const { wrapper, chats } = await mountMonitor()
    await tabNamed(wrapper, 'Village')?.trigger('click')
    chats.pushMessage(messageOf({ channel: 'wolves', authorId: 'id-Luis', text: 'ok Juan' }))
    await flushPromises()
    expect(tabNamed(wrapper, 'Wolves')?.find('.count').text()).toBe('1')
    expect(tabNamed(wrapper, 'All')?.find('.count').exists()).toBe(false)
    await tabNamed(wrapper, 'All')?.trigger('click')
    expect(tabNamed(wrapper, 'Wolves')?.find('.count').exists()).toBe(false)
  })

  it('posts to the village as the narrator', async () => {
    const { wrapper, chats } = await mountMonitor()
    expect(wrapper.find('.chat-composer .sbadge').text()).toBe('As Narrator → All')
    await wrapper.find('[aria-label="Narrator message"]').setValue('The baker saw something.')
    await wrapper.find('.chat-composer .composer').trigger('submit')
    await flushPromises()
    expect(chats.calls.at(-1)).toEqual({ command: 'send', input: { channel: 'village', text: 'The baker saw something.' } })
  })
})
