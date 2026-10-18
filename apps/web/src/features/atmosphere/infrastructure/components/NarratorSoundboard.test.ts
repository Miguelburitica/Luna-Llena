import { SOUND_CUES } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { narratorViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'
import NarratorSoundboard from './NarratorSoundboard.vue'

const mountBoard = () => mountMatchView(NarratorSoundboard, { view: narratorViewOf(), memberId: 'id-Nico' })

const tileLabelled = (wrapper: Awaited<ReturnType<typeof mountBoard>>['wrapper'], label: string) =>
  wrapper.findAll('.tile').find((tile) => tile.text() === label)

describe('NarratorSoundboard', () => {
  it('shows a tile for every sound cue', async () => {
    const { wrapper } = await mountBoard()
    expect(wrapper.findAll('.tile').map((tile) => tile.text())).toEqual([
      'Howl',
      'Thunder',
      'Church bell',
      'Suspense',
      'Scream',
      'Rooster',
      'Drumroll',
      'Sad trombone'
    ])
    expect(wrapper.findAll('.tile')).toHaveLength(SOUND_CUES.length)
  })

  it('sends Thunder to everyone', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    await tileLabelled(wrapper, 'Thunder')?.trigger('click')
    expect(atmosphere.cues.sent).toEqual([{ kind: 'sound', sound: 'thunder' }])
  })

  it('sends each screen effect', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    for (const button of wrapper.findAll('.fx')) await button.trigger('click')
    expect(wrapper.findAll('.fx').map((button) => button.text())).toEqual(['Lightning', 'Fog', 'Shake'])
    expect(atmosphere.cues.sent).toEqual([
      { kind: 'effect', effect: 'lightning' },
      { kind: 'effect', effect: 'fog' },
      { kind: 'effect', effect: 'shake' }
    ])
  })

  it('marks the tile that is playing', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    atmosphere.cues.emit({ kind: 'sound', sound: 'howl' })
    await wrapper.vm.$nextTick()
    expect(tileLabelled(wrapper, 'Howl')?.classes()).toContain('is-playing')
    expect(tileLabelled(wrapper, 'Thunder')?.classes()).not.toContain('is-playing')
  })

  it('explains a rejected cue', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    atmosphere.cues.failWith('not-narrator')
    await tileLabelled(wrapper, 'Scream')?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('Only the narrator can use the soundboard.')
  })

  it('explains an unknown cue', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    atmosphere.cues.failWith('cue-invalid')
    await tileLabelled(wrapper, 'Scream')?.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('That sound or effect does not exist.')
  })

  it('turns the ambient loop off and on', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    const toggle = wrapper.find('[aria-label="Ambient loop"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
    await toggle.trigger('click')
    expect(wrapper.find('[aria-label="Ambient loop"]').attributes('aria-checked')).toBe('false')
    await flushPromises()
    expect(atmosphere.settings.saved?.ambientOn).toBe(false)
  })

  it('sets the master volume', async () => {
    const { wrapper, atmosphere } = await mountBoard()
    const slider = wrapper.find('[aria-label="Soundboard volume"]')
    await slider.setValue('70')
    await flushPromises()
    expect(wrapper.text()).toContain('70%')
    expect(atmosphere.settings.saved?.master).toBe(70)
  })
})
