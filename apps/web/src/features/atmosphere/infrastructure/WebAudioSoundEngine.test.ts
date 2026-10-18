import { SOUND_CUES } from '@luna/contracts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AMBIENT_RECIPES } from './soundRecipes'
import { asAudioContext, FakeAudioContext } from './AudioContext.fixtures'
import { CROSSFADE_SECONDS, WebAudioSoundEngine } from './WebAudioSoundEngine'

const engineOver = () => {
  const context = new FakeAudioContext()
  let created = 0
  const engine = new WebAudioSoundEngine(() => {
    created += 1
    return asAudioContext(context)
  })
  return { engine, context, contexts: () => created }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('WebAudioSoundEngine', () => {
  it('creates no audio context until it is unlocked', () => {
    const { engine, context, contexts } = engineOver()
    engine.setAmbient('night', 0.5)
    engine.play('howl', 0.5)
    expect(contexts()).toBe(0)
    expect(context.created).toEqual([])
  })

  it('builds the gain stage behind a limiter and resumes on unlock', () => {
    const { engine, context, contexts } = engineOver()
    engine.unlock()
    engine.unlock()
    expect(contexts()).toBe(1)
    expect(context.count('compressor')).toBe(1)
    expect(context.count('gain')).toBe(3)
    expect(context.resumed).toBe(2)
  })

  it.each(SOUND_CUES)('plays the %s recipe without throwing and creates nodes', (sound) => {
    const { engine, context } = engineOver()
    engine.unlock()
    const before = context.created.length
    expect(() => engine.play(sound, 0.8)).not.toThrow()
    expect(context.created.length).toBeGreaterThan(before)
  })

  it.each(Object.keys(AMBIENT_RECIPES))('starts the %s loop and stops it', (phase) => {
    const { engine, context } = engineOver()
    engine.unlock()
    const before = context.created.length
    expect(() => engine.setAmbient(phase as keyof typeof AMBIENT_RECIPES, 0.4)).not.toThrow()
    expect(context.created.length).toBeGreaterThan(before)
    expect(() => engine.stopAll()).not.toThrow()
    vi.advanceTimersByTime(5_000)
  })

  it('crossfades from one loop to the next over about a second and a half', () => {
    const { engine, context } = engineOver()
    engine.unlock()
    engine.setAmbient('execution', 0.4)
    context.currentTime = 10
    engine.setAmbient('night', 0.4)
    const fades = context.created.filter((node) => node.kind === 'gain' && node.params.gain?.events.some((event) => event.startsWith('linear')))
    const ramps = fades.flatMap((node) => node.params.gain?.events ?? []).filter((event) => event.startsWith('linear'))
    expect(ramps).toContain(`linear 0 ${10 + CROSSFADE_SECONDS}`)
    expect(ramps).toContain(`linear 1 ${10 + CROSSFADE_SECONDS}`)
    engine.stopAll()
  })

  it('keeps one loop running when the same phase is set again', () => {
    const { engine, context } = engineOver()
    engine.unlock()
    engine.setAmbient('vote', 0.4)
    const nodes = context.created.length
    engine.setAmbient('vote', 0.2)
    expect(context.created.length).toBe(nodes)
    engine.stopAll()
  })

  it('swallows a rejected resume', async () => {
    const { engine, context } = engineOver()
    context.resume = () => Promise.reject(new Error('blocked'))
    expect(() => engine.unlock()).not.toThrow()
    await vi.runAllTimersAsync()
  })
})
