import type { TimelineEntry } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { outcomeOf, playerViewOf } from '../../application/MatchGateway.fixtures'
import { timelineChapters } from '../../domain/endGame'
import type { Seat } from '../../domain/seating'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import EndStory from './EndStory.vue'

const seat = (name: string): Seat => ({
  id: `id-${name}`,
  bot: false,
  name,
  avatar: null,
  alive: true,
  revealedRole: null,
  isYou: false,
  isPack: false
})

const haunts: TimelineEntry[] = [
  { kind: 'haunt', round: 1, ghostId: 'id-Juan', haunt: 'flicker', targetId: null, word: null },
  { kind: 'haunt', round: 1, ghostId: 'id-Juan', haunt: 'whisper', targetId: 'id-Marta', word: 'bakery' }
]

const mountStory = (timeline: TimelineEntry[]) =>
  mountMatchView(EndStory, {
    view: playerViewOf({ players: matchPlayers() }),
    props: {
      chapters: timelineChapters(outcomeOf({ timeline })),
      seats: ['Juan', 'Marta'].map(seat),
      roleOf: () => null
    }
  })

describe('EndStory haunts', () => {
  it('tells a flicker and a whisper with names and the word', async () => {
    const { wrapper } = await mountStory(haunts)
    await wrapper.find('.story-toggle').trigger('click')
    expect(wrapper.findAll('.story-fact').map((fact) => fact.text())).toEqual([
      'Juan’s ghost flickered the lights.',
      'Juan’s ghost whispered “bakery” to Marta.'
    ])
  })

  it('files a haunt after the night under the day chapter', async () => {
    const night: TimelineEntry = {
      kind: 'night',
      round: 1,
      victimId: null,
      protectedId: null,
      healed: false,
      poisonedId: null,
      visions: [],
      deaths: []
    }
    const { wrapper } = await mountStory([night, ...haunts])
    expect(wrapper.findAll('.story-toggle').map((toggle) => toggle.text())).toEqual(['Night 1', 'Day 1'])
  })
})
