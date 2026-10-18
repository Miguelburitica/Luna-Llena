import type { SoundCue } from '@luna/contracts'
import type { SoundEngine } from '../application/ports'
import type { AmbientId } from '../domain/ambience'
import { AMBIENT_RECIPES, STING_RECIPES, type RunningLoop, type Stage } from './soundRecipes'

export const CROSSFADE_SECONDS = 1.5

const VOLUME_SMOOTHING_SECONDS = 0.08
const NOISE_SECONDS = 2
const SILENCING_MILLISECONDS = 300
const LIMITER = { threshold: -14, knee: 0, ratio: 12, attack: 0.003, release: 0.2 }

interface Bus {
  readonly master: GainNode
  readonly music: GainNode
  readonly effects: GainNode
}

interface PlayingAmbient {
  readonly id: AmbientId
  readonly fade: GainNode
  readonly loop: RunningLoop
}

const browserAudioContext = (): AudioContext => {
  const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new Constructor()
}

const noiseBufferOf = (context: AudioContext): AudioBuffer => {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * NOISE_SECONDS), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1
  return buffer
}

export class WebAudioSoundEngine implements SoundEngine {
  private stage: Stage | null = null
  private bus: Bus | null = null
  private ambient: PlayingAmbient | null = null

  constructor(private readonly createContext: () => AudioContext = browserAudioContext) {}

  unlock(): void {
    if (this.stage === null) this.build()
    void this.stage?.context.resume().catch(() => undefined)
  }

  setAmbient(id: AmbientId, volume: number): void {
    const stage = this.stage
    const bus = this.bus
    if (stage === null || bus === null) return
    const now = stage.context.currentTime
    bus.music.gain.setTargetAtTime(volume, now, VOLUME_SMOOTHING_SECONDS)
    if (this.ambient?.id === id) return
    this.fadeOutAmbient(CROSSFADE_SECONDS)
    if (id === 'none') return
    const fade = stage.context.createGain()
    fade.gain.setValueAtTime(0, now)
    fade.gain.linearRampToValueAtTime(1, now + CROSSFADE_SECONDS)
    fade.connect(bus.music)
    this.ambient = { id, fade, loop: AMBIENT_RECIPES[id](stage, fade) }
  }

  play(sound: SoundCue, volume: number): void {
    const stage = this.stage
    const bus = this.bus
    if (stage === null || bus === null) return
    const level = stage.context.createGain()
    level.gain.value = volume
    level.connect(bus.effects)
    STING_RECIPES[sound](stage, level)
  }

  stopAll(): void {
    this.fadeOutAmbient(0.2)
    this.replaceEffectsBus()
  }

  private replaceEffectsBus(): void {
    const stage = this.stage
    const bus = this.bus
    if (stage === null || bus === null) return
    const leaving = bus.effects
    leaving.gain.setTargetAtTime(0, stage.context.currentTime, 0.02)
    setTimeout(() => leaving.disconnect(), SILENCING_MILLISECONDS)
    const effects = stage.context.createGain()
    effects.connect(bus.master)
    this.bus = { ...bus, effects }
  }

  private fadeOutAmbient(seconds: number): void {
    const stage = this.stage
    const leaving = this.ambient
    this.ambient = null
    if (stage === null || leaving === null) return
    const now = stage.context.currentTime
    leaving.fade.gain.cancelScheduledValues(now)
    leaving.fade.gain.setValueAtTime(leaving.fade.gain.value, now)
    leaving.fade.gain.linearRampToValueAtTime(0, now + seconds)
    leaving.loop.stop(now + seconds + 0.05)
  }

  private build(): void {
    const context = this.createContext()
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = LIMITER.threshold
    limiter.knee.value = LIMITER.knee
    limiter.ratio.value = LIMITER.ratio
    limiter.attack.value = LIMITER.attack
    limiter.release.value = LIMITER.release
    limiter.connect(context.destination)
    const master = context.createGain()
    master.connect(limiter)
    const music = context.createGain()
    music.connect(master)
    const effects = context.createGain()
    effects.connect(master)
    this.bus = { master, music, effects }
    this.stage = { context, noise: noiseBufferOf(context) }
  }
}
