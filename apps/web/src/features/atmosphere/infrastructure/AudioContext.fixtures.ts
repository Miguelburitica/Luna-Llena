export interface RecordedNode {
  readonly kind: string
  readonly params: Record<string, FakeParam>
  connect<T>(target: T): T
  disconnect(): void
  start(when?: number): void
  stop(when?: number): void
  type?: string
  buffer?: unknown
  loop?: boolean
}

export class FakeParam {
  value = 0
  readonly events: string[] = []

  setValueAtTime(value: number, at: number) {
    this.events.push(`set ${value} ${at}`)
    this.value = value
    return this
  }

  linearRampToValueAtTime(value: number, at: number) {
    this.events.push(`linear ${value} ${at}`)
    return this
  }

  exponentialRampToValueAtTime(value: number, at: number) {
    this.events.push(`exponential ${value} ${at}`)
    return this
  }

  setTargetAtTime(value: number, at: number, constant: number) {
    this.events.push(`target ${value} ${at} ${constant}`)
    return this
  }

  cancelScheduledValues(at: number) {
    this.events.push(`cancel ${at}`)
    return this
  }
}

const PARAMS_BY_KIND: Readonly<Record<string, readonly string[]>> = {
  gain: ['gain'],
  oscillator: ['frequency', 'detune'],
  biquadfilter: ['frequency', 'Q', 'gain'],
  bufferSource: ['playbackRate'],
  compressor: ['threshold', 'knee', 'ratio', 'attack', 'release']
}

const nodeOf = (kind: string, created: RecordedNode[]): RecordedNode => {
  const params: Record<string, FakeParam> = {}
  for (const name of PARAMS_BY_KIND[kind] ?? []) params[name] = new FakeParam()
  const node: RecordedNode & Record<string, unknown> = {
    kind,
    params,
    connect: (target) => target,
    disconnect: () => undefined,
    start: () => undefined,
    stop: () => undefined,
    ...params
  }
  created.push(node)
  return node
}

export class FakeAudioContext {
  readonly created: RecordedNode[] = []
  readonly destination = { kind: 'destination' }
  readonly sampleRate = 8000
  currentTime = 0
  state = 'running'
  resumed = 0

  createGain() {
    return nodeOf('gain', this.created)
  }

  createOscillator() {
    return nodeOf('oscillator', this.created)
  }

  createBiquadFilter() {
    return nodeOf('biquadfilter', this.created)
  }

  createBufferSource() {
    return nodeOf('bufferSource', this.created)
  }

  createDynamicsCompressor() {
    return nodeOf('compressor', this.created)
  }

  createBuffer(_channels: number, length: number) {
    const samples = new Float32Array(length)
    return { getChannelData: () => samples, length }
  }

  resume() {
    this.resumed += 1
    return Promise.resolve()
  }

  count(kind: string): number {
    return this.created.filter((node) => node.kind === kind).length
  }
}

export const asAudioContext = (context: FakeAudioContext): AudioContext => context as unknown as AudioContext
