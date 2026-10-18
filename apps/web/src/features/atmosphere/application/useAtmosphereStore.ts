import type { CueEffect, CueInput, ScreenEffect, SoundCue } from '@luna/contracts'
import { defineStore } from 'pinia'
import { computed, inject, onScopeDispose, ref, watch } from 'vue'
import { useMatchStore } from '@/features/match/application/useMatchStore'
import type { MatchFailure } from '@/features/match/application/ports'
import { ambientFor, STING_SPACING_MS, stingsBetween } from '../domain/ambience'
import { EFFECT_DURATION_MS, REDUCED_FADE_MS, SOUND_PLAYING_MS } from '../domain/soundboard'
import {
  clampVolume,
  effectiveVolume,
  soundSettingsDefaults,
  type AtmosphereSettings,
  type VolumeChannel
} from '../domain/soundSettings'
import { ATMOSPHERE_SETTINGS_STORE, CUE_GATEWAY, MOTION_PREFERENCE, SOUND_ENGINE } from './ports'

export type SoundState = 'off' | 'locked' | 'on'

export interface ActiveEffect {
  readonly id: string
  readonly effect: ScreenEffect
}

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} was not provided to the app`)
  return value
}

export const useAtmosphereStore = defineStore('atmosphere', () => {
  const engine = required(inject(SOUND_ENGINE), 'SoundEngine')
  const settingsStore = required(inject(ATMOSPHERE_SETTINGS_STORE), 'AtmosphereSettingsStore')
  const gateway = required(inject(CUE_GATEWAY), 'CueGateway')
  const motion = required(inject(MOTION_PREFERENCE), 'MotionPreference')
  const match = useMatchStore()

  const settings = ref<AtmosphereSettings>(settingsStore.load() ?? soundSettingsDefaults(motion.prefersReducedMotion()))
  const unlocked = ref(false)
  const activeEffects = ref<readonly ActiveEffect[]>([])
  const playingSound = ref<SoundCue | null>(null)
  const failure = ref<MatchFailure | null>(null)

  const timers = new Set<ReturnType<typeof setTimeout>>()
  const seenCueIds = new Set<string>()
  let previousView = match.view

  const soundState = computed<SoundState>(() => {
    if (!settings.value.soundOn) return 'off'
    return unlocked.value ? 'on' : 'locked'
  })
  const audible = computed(() => soundState.value === 'on')
  const reducedMotion = computed(() => settings.value.reducedMotion)
  const shaking = computed(() => !reducedMotion.value && activeEffects.value.some((active) => active.effect === 'shake'))

  const later = (action: () => void, delayMs: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      action()
    }, delayMs)
    timers.add(timer)
  }

  const cancelTimers = () => {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
  }

  const syncAmbient = () => {
    if (!audible.value) return
    const id = settings.value.ambientOn ? ambientFor(match.view) : 'none'
    engine.setAmbient(id, effectiveVolume(settings.value, 'music'))
  }

  const playSound = (sound: SoundCue) => {
    if (audible.value) engine.play(sound, effectiveVolume(settings.value, 'effects'))
  }

  const playStings = (stings: readonly SoundCue[]) => {
    stings.forEach((sting, index) => (index === 0 ? playSound(sting) : later(() => playSound(sting), index * STING_SPACING_MS)))
  }

  const showEffect = (effect: ScreenEffect, id: string) => {
    const duration = reducedMotion.value ? REDUCED_FADE_MS : EFFECT_DURATION_MS[effect]
    activeEffects.value = [...activeEffects.value.filter((active) => active.effect !== effect), { id, effect }]
    later(() => {
      activeEffects.value = activeEffects.value.filter((active) => active.id !== id)
    }, duration)
  }

  const showPlaying = (sound: SoundCue) => {
    playingSound.value = sound
    later(() => {
      if (playingSound.value === sound) playingSound.value = null
    }, SOUND_PLAYING_MS)
  }

  const receiveCue = (cue: CueEffect) => {
    if (seenCueIds.has(cue.id)) return
    seenCueIds.add(cue.id)
    if (cue.kind === 'effect') {
      showEffect(cue.effect, cue.id)
      return
    }
    playSound(cue.sound)
    showPlaying(cue.sound)
  }

  const turnSoundOff = () => {
    settings.value = { ...settings.value, soundOn: false }
    cancelTimers()
    engine.stopAll()
  }

  const turnSoundOn = () => {
    engine.unlock()
    unlocked.value = true
    settings.value = { ...settings.value, soundOn: true }
    syncAmbient()
  }

  const toggleSound = () => (soundState.value === 'on' ? turnSoundOff() : turnSoundOn())

  const setVolume = (channel: VolumeChannel | 'master', percent: number) => {
    settings.value = { ...settings.value, [channel]: clampVolume(percent) }
  }

  const setReducedMotion = (reduced: boolean) => {
    settings.value = { ...settings.value, reducedMotion: reduced }
  }

  const setAmbientOn = (on: boolean) => {
    settings.value = { ...settings.value, ambientOn: on }
  }

  const sendCue = async (input: CueInput) => {
    const result = await gateway.cue(input)
    failure.value = result.ok ? null : result.error
    return result
  }

  gateway.onCue(receiveCue)
  motion.apply(settings.value.reducedMotion)

  watch(
    () => match.view,
    (next) => {
      const previous = previousView
      previousView = next
      if (next === null) return
      if (audible.value) playStings(stingsBetween(previous, next))
      syncAmbient()
    }
  )

  watch(
    settings,
    (next) => {
      settingsStore.save(next)
      motion.apply(next.reducedMotion)
      if (audible.value) syncAmbient()
    },
    { deep: true }
  )

  onScopeDispose(cancelTimers)

  return {
    settings,
    unlocked,
    activeEffects,
    playingSound,
    failure,
    soundState,
    reducedMotion,
    shaking,
    toggleSound,
    setVolume,
    setReducedMotion,
    setAmbientOn,
    sendCue
  }
})
