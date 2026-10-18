import type { MatchView } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { narratorViewOf, outcomeOf, playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { createMatchTestApp } from '@/features/match/application/matchApp.fixtures'
import { soundSettingsDefaults, type AtmosphereSettings } from '../domain/soundSettings'
import { createAtmosphereKit, provideAtmosphere } from './Atmosphere.fixtures'
import { useAtmosphereStore } from './useAtmosphereStore'

const settingsOn: AtmosphereSettings = { ...soundSettingsDefaults(false), soundOn: true }

const setup = (initial: AtmosphereSettings | null = null, systemPrefersReduced = false, view: MatchView = playerViewOf()) => {
  const kit = createAtmosphereKit(initial, systemPrefersReduced)
  const test = createMatchTestApp(view)
  provideAtmosphere(test.app, kit)
  test.store.view = view
  const atmosphere = test.app.runWithContext(() => useAtmosphereStore())
  return { ...test, kit, atmosphere, match: test.store }
}

const showView = async (match: { view: MatchView | null }, view: MatchView) => {
  match.view = view
  await flushPromises()
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
afterEach(() => vi.useRealTimers())

describe('useAtmosphereStore', () => {
  it('starts silent on a first visit with the documented defaults', () => {
    const { atmosphere, kit } = setup()
    expect(atmosphere.soundState).toBe('off')
    expect(atmosphere.settings).toEqual(soundSettingsDefaults(false))
    expect(kit.engine.calls).toEqual([])
  })

  it('follows the system motion preference on a first visit', () => {
    const { atmosphere, kit } = setup(null, true)
    expect(atmosphere.reducedMotion).toBe(true)
    expect(kit.motion.applied).toBe(true)
  })

  it('starts the ambient loop of the current phase when sound is turned on', () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    expect(atmosphere.soundState).toBe('on')
    expect(kit.engine.calls[0]).toEqual({ kind: 'unlock' })
    expect(kit.engine.lastAmbient()).toEqual({ id: 'night', volume: 0.44 })
  })

  it('offers a tap while a remembered on still needs unlocking', () => {
    const { atmosphere, kit } = setup(settingsOn)
    expect(atmosphere.soundState).toBe('locked')
    expect(kit.engine.calls).toEqual([])
    atmosphere.toggleSound()
    expect(atmosphere.soundState).toBe('on')
    expect(kit.engine.lastAmbient()?.id).toBe('night')
  })

  it('silences everything when sound is turned off', async () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    atmosphere.toggleSound()
    await flushPromises()
    expect(atmosphere.soundState).toBe('off')
    expect(kit.engine.calls.at(-1)).toEqual({ kind: 'stop' })
    expect(kit.settings.saved?.soundOn).toBe(false)
  })

  it('crossfades the loop when the phase changes', async () => {
    const { atmosphere, kit, match } = setup()
    atmosphere.toggleSound()
    await showView(match, playerViewOf({ phase: 'day' }))
    expect(kit.engine.lastAmbient()?.id).toBe('day')
  })

  it('fades the loop out after the outcome', async () => {
    const { atmosphere, kit, match } = setup()
    atmosphere.toggleSound()
    await showView(match, playerViewOf({ outcome: outcomeOf() }))
    expect(kit.engine.lastAmbient()?.id).toBe('none')
  })

  it('plays the nightfall howl once while sound is on', async () => {
    const { atmosphere, kit, match } = setup(null, false, playerViewOf({ phase: 'execution', round: 1 }))
    atmosphere.toggleSound()
    await showView(match, playerViewOf({ phase: 'night', round: 2 }))
    expect(kit.engine.played()).toEqual(['howl'])
    expect(kit.engine.calls.filter((call) => call.kind === 'play')[0]).toMatchObject({ volume: 0.8 })
  })

  it('stays silent about stings while sound is off', async () => {
    const { kit, match } = setup(null, false, playerViewOf({ phase: 'execution', round: 1 }))
    await showView(match, playerViewOf({ phase: 'night', round: 2 }))
    expect(kit.engine.calls).toEqual([])
  })

  it('does not replay a sting after a reload', async () => {
    const { atmosphere, kit, match } = setup(null, false, playerViewOf({ phase: 'dawn', dawn: { round: 1, deaths: ['id-Ana'] } }))
    match.view = null
    atmosphere.toggleSound()
    await showView(match, playerViewOf({ phase: 'dawn', dawn: { round: 1, deaths: ['id-Ana'] } }))
    expect(kit.engine.played()).toEqual([])
  })

  it('tolls the bell once for a death at dawn', async () => {
    const { atmosphere, kit, match } = setup()
    atmosphere.toggleSound()
    const dawn = playerViewOf({ phase: 'dawn', dawn: { round: 1, deaths: ['id-Ana'] } })
    await showView(match, dawn)
    await showView(match, { ...dawn })
    expect(kit.engine.played()).toEqual(['bell'])
  })

  it('spaces the stings of a verdict', async () => {
    const { atmosphere, kit, match } = setup(null, false, playerViewOf({ phase: 'vote' }))
    atmosphere.toggleSound()
    const verdict = { round: 1, tally: [], executedId: 'id-Luis', tie: false, foolWins: false }
    await showView(match, playerViewOf({ phase: 'execution', verdict }))
    expect(kit.engine.played()).toEqual(['drumroll'])
    vi.advanceTimersByTime(2_000)
    expect(kit.engine.played()).toEqual(['drumroll', 'scream'])
  })

  it('drops queued stings when sound is turned off', async () => {
    const { atmosphere, kit, match } = setup(null, false, playerViewOf({ phase: 'vote' }))
    atmosphere.toggleSound()
    const verdict = { round: 1, tally: [], executedId: 'id-Luis', tie: false, foolWins: false }
    await showView(match, playerViewOf({ phase: 'execution', verdict }))
    atmosphere.toggleSound()
    vi.advanceTimersByTime(5_000)
    expect(kit.engine.played()).toEqual(['drumroll'])
  })

  it('plays a narrator cue for a member with sound on', () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    kit.cues.emit({ kind: 'sound', sound: 'thunder' })
    expect(kit.engine.played()).toEqual(['thunder'])
    expect(atmosphere.playingSound).toBe('thunder')
    vi.advanceTimersByTime(1_500)
    expect(atmosphere.playingSound).toBeNull()
  })

  it('does not play a sound cue while sound is off', () => {
    const { atmosphere, kit } = setup()
    kit.cues.emit({ kind: 'sound', sound: 'thunder' })
    expect(kit.engine.played()).toEqual([])
    expect(atmosphere.activeEffects).toEqual([])
  })

  it('plays a cue only once however often it arrives', () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    kit.cues.emit({ kind: 'sound', sound: 'howl' }, 'same')
    kit.cues.emit({ kind: 'sound', sound: 'howl' }, 'same')
    expect(kit.engine.played()).toEqual(['howl'])
  })

  it('shows screen effects even when sound is off, then clears them', () => {
    const { atmosphere, kit } = setup()
    kit.cues.emit({ kind: 'effect', effect: 'lightning' })
    expect(atmosphere.activeEffects.map((active) => active.effect)).toEqual(['lightning'])
    vi.advanceTimersByTime(250)
    expect(atmosphere.activeEffects).toEqual([])
  })

  it('keeps fog drifting for six seconds next to other effects', () => {
    const { atmosphere, kit } = setup()
    kit.cues.emit({ kind: 'effect', effect: 'fog' })
    kit.cues.emit({ kind: 'effect', effect: 'lightning' })
    vi.advanceTimersByTime(250)
    expect(atmosphere.activeEffects.map((active) => active.effect)).toEqual(['fog'])
    vi.advanceTimersByTime(5_750)
    expect(atmosphere.activeEffects).toEqual([])
  })

  it('shakes for 600 ms, or not at all with reduced motion', () => {
    const { atmosphere, kit } = setup()
    kit.cues.emit({ kind: 'effect', effect: 'shake' })
    expect(atmosphere.shaking).toBe(true)
    vi.advanceTimersByTime(600)
    expect(atmosphere.shaking).toBe(false)
    atmosphere.setReducedMotion(true)
    kit.cues.emit({ kind: 'effect', effect: 'shake' })
    expect(atmosphere.shaking).toBe(false)
    expect(atmosphere.activeEffects).toHaveLength(1)
    vi.advanceTimersByTime(250)
    expect(atmosphere.activeEffects).toEqual([])
  })

  it('sends cues through the gateway and remembers a rejection', async () => {
    const { atmosphere, kit } = setup(null, false, narratorViewOf())
    kit.cues.failWith('not-narrator')
    const result = await atmosphere.sendCue({ kind: 'sound', sound: 'bell' })
    expect(kit.cues.sent).toEqual([{ kind: 'sound', sound: 'bell' }])
    expect(result.ok).toBe(false)
    expect(atmosphere.failure).toEqual({ code: 'not-narrator' })
  })

  it('persists settings and applies the reduced class when they change', async () => {
    const { atmosphere, kit } = setup()
    atmosphere.setVolume('music', 20)
    atmosphere.setReducedMotion(true)
    await flushPromises()
    expect(kit.settings.saved).toMatchObject({ music: 20, reducedMotion: true })
    expect(kit.motion.applied).toBe(true)
  })

  it('plays the loop at a fifth of the master volume after "Quieter music"', async () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    atmosphere.setVolume('music', 20)
    await flushPromises()
    expect(kit.engine.lastAmbient()).toEqual({ id: 'night', volume: 0.16 })
    kit.cues.emit({ kind: 'sound', sound: 'bell' })
    expect(kit.engine.calls.at(-1)).toEqual({ kind: 'play', sound: 'bell', volume: 0.8 })
  })

  it('silences the loop when the ambient toggle is off', async () => {
    const { atmosphere, kit } = setup()
    atmosphere.toggleSound()
    atmosphere.setAmbientOn(false)
    await flushPromises()
    expect(kit.engine.lastAmbient()?.id).toBe('none')
  })

  it('restores remembered settings', () => {
    const { atmosphere } = setup({ ...settingsOn, music: 10, reducedMotion: true })
    expect(atmosphere.settings.music).toBe(10)
    expect(atmosphere.reducedMotion).toBe(true)
  })
})
