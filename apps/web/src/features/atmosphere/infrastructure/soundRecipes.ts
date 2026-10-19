import type { Phase, SoundCue } from '@luna/contracts'

export interface Stage {
  readonly context: AudioContext
  readonly noise: AudioBuffer
}

export interface RunningLoop {
  stop(at: number): void
}

type Source = OscillatorNode | AudioBufferSourceNode

const SILENCE = 0.0001
const BELL_PARTIALS = [
  { ratio: 1, level: 0.34, seconds: 3 },
  { ratio: 2.76, level: 0.2, seconds: 2.2 },
  { ratio: 5.4, level: 0.11, seconds: 1.5 },
  { ratio: 8.93, level: 0.05, seconds: 0.9 }
]
const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880]
const PAD_CHORDS: Readonly<Record<'dawn' | 'day', readonly number[]>> = {
  dawn: [196, 246.94, 293.66],
  day: [261.63, 329.63, 392]
}
const TROMBONE_NOTES = [233.08, 220, 207.65, 164.81]

class Loop implements RunningLoop {
  private readonly sources: Source[] = []
  private readonly timers: Array<ReturnType<typeof setInterval>> = []

  hold<T extends Source>(source: T): T {
    this.sources.push(source)
    return source
  }

  every(milliseconds: number, action: () => void): void {
    action()
    this.timers.push(setInterval(action, milliseconds))
  }

  stop(at: number): void {
    for (const timer of this.timers) clearInterval(timer)
    this.timers.length = 0
    for (const source of this.sources) source.stop(at)
  }
}

const gainNode = (context: AudioContext, destination: AudioNode, level = 1): GainNode => {
  const gain = context.createGain()
  gain.gain.value = level
  gain.connect(destination)
  return gain
}

const modulation = (context: AudioContext, target: AudioParam, depth: number): GainNode => {
  const gain = context.createGain()
  gain.gain.value = depth
  gain.connect(target)
  return gain
}

const filterNode = (context: AudioContext, type: BiquadFilterType, frequency: number, destination: AudioNode, q = 1): BiquadFilterNode => {
  const filter = context.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = q
  filter.connect(destination)
  return filter
}

const fadeEnvelope = (context: AudioContext, destination: AudioNode, start: number, attack: number, peak: number, end: number): GainNode => {
  const gain = context.createGain()
  gain.gain.setValueAtTime(SILENCE, start)
  gain.gain.linearRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(SILENCE, end)
  gain.connect(destination)
  return gain
}

const oscillator = (context: AudioContext, type: OscillatorType, frequency: number, destination: AudioNode): OscillatorNode => {
  const source = context.createOscillator()
  source.type = type
  source.frequency.value = frequency
  source.connect(destination)
  return source
}

const noiseSource = (stage: Stage, destination: AudioNode, loop: boolean): AudioBufferSourceNode => {
  const source = stage.context.createBufferSource()
  source.buffer = stage.noise
  source.loop = loop
  source.connect(destination)
  return source
}

const blip = (stage: Stage, destination: AudioNode, start: number, frequency: number, seconds: number, peak: number, type: OscillatorType = 'sine') => {
  const end = start + seconds
  const source = oscillator(stage.context, type, frequency, fadeEnvelope(stage.context, destination, start, 0.01, peak, end))
  source.start(start)
  source.stop(end + 0.05)
  return source
}

const thump = (stage: Stage, destination: AudioNode, start: number, peak: number) => {
  const source = blip(stage, destination, start, 70, 0.22, peak)
  source.frequency.setValueAtTime(70, start)
  source.frequency.exponentialRampToValueAtTime(38, start + 0.18)
}

const lowPass = (stage: Stage, destination: AudioNode, frequency: number) => filterNode(stage.context, 'lowpass', frequency, destination)

const wobble = (loop: Loop, context: AudioContext, rate: number, depth: number, target: AudioParam, start: number) => {
  const lfo = loop.hold(oscillator(context, 'sine', rate, modulation(context, target, depth)))
  lfo.start(start)
}

const nightLoop = (stage: Stage, output: AudioNode): RunningLoop => {
  const { context } = stage
  const loop = new Loop()
  const start = context.currentTime
  const filter = filterNode(context, 'bandpass', 420, gainNode(context, output, 0.5), 0.7)
  wobble(loop, context, 0.11, 240, filter.frequency, start)
  loop.hold(noiseSource(stage, filter, true)).start(start)
  loop.every(700, () => {
    const now = context.currentTime
    const pitch = 4200 + Math.random() * 500
    for (const offset of [0, 0.09, 0.18]) blip(stage, output, now + offset, pitch, 0.04, 0.035)
  })
  return loop
}

const padLoop = (stage: Stage, output: AudioNode, phase: 'dawn' | 'day'): RunningLoop => {
  const { context } = stage
  const loop = new Loop()
  const start = context.currentTime
  const filter = lowPass(stage, gainNode(context, output, 0.22), phase === 'dawn' ? 700 : 1400)
  if (phase === 'dawn') {
    filter.frequency.setValueAtTime(400, start)
    filter.frequency.linearRampToValueAtTime(1100, start + 8)
  }
  for (const frequency of PAD_CHORDS[phase]) loop.hold(oscillator(context, phase === 'dawn' ? 'sine' : 'triangle', frequency, filter)).start(start)
  if (phase === 'day') {
    loop.every(2400, () => {
      const note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)] ?? CHIME_NOTES[0] ?? 523.25
      blip(stage, output, context.currentTime, note, 1.2, 0.05)
    })
  }
  return loop
}

const voteLoop = (stage: Stage, output: AudioNode): RunningLoop => {
  const { context } = stage
  const loop = new Loop()
  loop.every(900, () => {
    const now = context.currentTime
    thump(stage, output, now, 0.55)
    thump(stage, output, now + 0.22, 0.38)
  })
  return loop
}

const executionLoop = (stage: Stage, output: AudioNode): RunningLoop => {
  const { context } = stage
  const loop = new Loop()
  const start = context.currentTime
  const filter = lowPass(stage, gainNode(context, output, 0.28), 180)
  for (const frequency of [55, 55.7, 82.4]) loop.hold(oscillator(context, 'sawtooth', frequency, filter)).start(start)
  return loop
}

export const AMBIENT_RECIPES: Readonly<Record<Phase, (stage: Stage, output: AudioNode) => RunningLoop>> = {
  night: nightLoop,
  dawn: (stage, output) => padLoop(stage, output, 'dawn'),
  day: (stage, output) => padLoop(stage, output, 'day'),
  vote: voteLoop,
  execution: executionLoop
}

const howl = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const end = start + 1.9
  const voice = oscillator(context, 'sine', 300, fadeEnvelope(context, output, start, 0.25, 0.32, end))
  voice.frequency.setValueAtTime(300, start)
  voice.frequency.linearRampToValueAtTime(600, start + 0.9)
  voice.frequency.linearRampToValueAtTime(450, end)
  const vibrato = oscillator(context, 'sine', 6, modulation(context, voice.frequency, 14))
  for (const source of [voice, vibrato]) {
    source.start(start)
    source.stop(end + 0.05)
  }
}

const thunder = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const end = start + 3.4
  const filter = lowPass(stage, fadeEnvelope(context, output, start, 0.05, 0.9, end), 260)
  filter.frequency.setValueAtTime(260, start)
  filter.frequency.exponentialRampToValueAtTime(70, end)
  const source = noiseSource(stage, filter, false)
  source.start(start)
  source.stop(end + 0.05)
}

const bell = (stage: Stage, output: AudioNode) => {
  const start = stage.context.currentTime
  for (const partial of BELL_PARTIALS) blip(stage, output, start, 330 * partial.ratio, partial.seconds, partial.level)
}

const suspense = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const end = start + 3.3
  const envelope = context.createGain()
  envelope.gain.setValueAtTime(SILENCE, start)
  envelope.gain.linearRampToValueAtTime(0.3, start + 3)
  envelope.gain.linearRampToValueAtTime(SILENCE, end)
  envelope.connect(output)
  const filter = lowPass(stage, envelope, 200)
  filter.frequency.setValueAtTime(200, start)
  filter.frequency.linearRampToValueAtTime(1400, start + 3)
  for (const frequency of [82.4, 83.2]) {
    const source = oscillator(context, 'sawtooth', frequency, filter)
    source.start(start)
    source.stop(end + 0.05)
  }
}

const scream = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const end = start + 0.6
  const formant = filterNode(context, 'bandpass', 1100, fadeEnvelope(context, output, start, 0.04, 0.26, end), 4)
  const voice = oscillator(context, 'sawtooth', 500, formant)
  voice.frequency.setValueAtTime(500, start)
  voice.frequency.exponentialRampToValueAtTime(1500, start + 0.3)
  voice.frequency.exponentialRampToValueAtTime(1200, end)
  voice.start(start)
  voice.stop(end + 0.05)
}

const rooster = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const soft = lowPass(stage, output, 2600)
  for (const offset of [0, 0.26, 0.52]) {
    const voice = blip(stage, soft, start + offset, 600, 0.2, 0.14, 'square')
    voice.frequency.setValueAtTime(600, start + offset)
    voice.frequency.linearRampToValueAtTime(1150, start + offset + 0.16)
  }
}

const drumroll = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const rollSeconds = 1.8
  const tickEvery = 0.045
  const tickCount = Math.floor(rollSeconds / tickEvery)
  for (let tick = 0; tick < tickCount; tick += 1) {
    const at = start + tick * tickEvery
    const loudness = 0.12 + 0.3 * (tick / tickCount)
    const source = noiseSource(stage, fadeEnvelope(context, filterNode(context, 'bandpass', 900, output, 1.2), at, 0.004, loudness, at + 0.035), false)
    source.start(at)
    source.stop(at + 0.04)
  }
  const hit = start + rollSeconds
  const boom = noiseSource(stage, lowPass(stage, fadeEnvelope(context, output, hit, 0.01, 0.7, hit + 0.7), 320), false)
  boom.start(hit)
  boom.stop(hit + 0.75)
  thump(stage, output, hit, 0.7)
}

const trombone = (stage: Stage, output: AudioNode) => {
  const { context } = stage
  const start = context.currentTime
  const noteSeconds = 0.5
  const wah = lowPass(stage, output, 500)
  TROMBONE_NOTES.forEach((frequency, index) => {
    const at = start + index * noteSeconds
    const last = index === TROMBONE_NOTES.length - 1
    const seconds = last ? noteSeconds * 2 : noteSeconds
    const voice = blip(stage, wah, at, frequency, seconds, 0.2, 'sawtooth')
    wah.frequency.setValueAtTime(400, at)
    wah.frequency.linearRampToValueAtTime(950, at + noteSeconds / 2)
    wah.frequency.linearRampToValueAtTime(400, at + noteSeconds)
    if (last) voice.frequency.linearRampToValueAtTime(frequency * 0.8, at + seconds)
  })
}

const ALARM_BEEPS = [0, 0.22, 0.44, 0.9, 1.12, 1.34]

export const alarm = (stage: Stage, output: AudioNode) => {
  const start = stage.context.currentTime
  const soft = lowPass(stage, output, 3200)
  for (const offset of ALARM_BEEPS) blip(stage, soft, start + offset, 988, 0.16, 0.16, 'square')
}

export const STING_RECIPES: Readonly<Record<SoundCue, (stage: Stage, output: AudioNode) => void>> = {
  howl,
  thunder,
  bell,
  suspense,
  scream,
  rooster,
  drumroll,
  trombone
}
