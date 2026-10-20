import type { ChatAccess } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import {
  beginMatch,
  constantRandom,
  DOCTOR,
  DRUNK,
  NARRATOR_ID,
  NIGHT_ROLES,
  SEER,
  START_TIME,
  unwrap,
  VILLAGER,
  WOLF_ONE,
  WOLF_TWO
} from './Match.fixtures'
import { narratorViewOf } from './narratorViewOf'

const NO_CHAT: ChatAccess = { read: [], write: [], lastWordsUntil: null, villagePaused: false }

describe('narratorViewOf', () => {
  it('projects the night with actions, waiting players and the dawn preview', () => {
    const match = beginMatch({ roles: NIGHT_ROLES })
    unwrap(match.act(WOLF_ONE, { kind: 'hunt', targetId: VILLAGER }, constantRandom(0)))
    unwrap(match.act(WOLF_TWO, { kind: 'hunt', targetId: VILLAGER }, constantRandom(0)))
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: SEER }, constantRandom(0)))
    unwrap(match.act(DRUNK, { kind: 'inspect', targetId: VILLAGER }, constantRandom(0.1)))

    const view = narratorViewOf(match, START_TIME, NO_CHAT)

    expect(view.perspective).toBe('narrator')
    expect(view.roles[DRUNK]).toBe('drunk')
    expect(view.chat).toEqual(NO_CHAT)
    expect(view.night?.preview).toEqual({
      victimId: VILLAGER,
      protectedId: SEER,
      healing: false,
      poisonTargetId: null,
      deaths: [VILLAGER]
    })
    expect(view.night?.actions[DRUNK]).toMatchObject({ action: 'inspect', visionIsWolf: true, fromDrunk: true })
    expect(view.night?.waitingOn).toEqual(['p3', 'p5', 'p6', 'p8'])
  })

  it('shows every vote during the vote', () => {
    const match = beginMatch({ roles: NIGHT_ROLES })
    for (let step = 0; step < 3; step += 1) unwrap(match.advance(NARRATOR_ID, START_TIME))
    unwrap(match.vote(SEER, WOLF_ONE))

    const view = narratorViewOf(match, START_TIME, NO_CHAT)

    expect(view.phase).toBe('vote')
    expect(view.votes?.[SEER]).toEqual({ targetId: WOLF_ONE, locked: false })
  })

  it('offers the Fool\'s win for a Fool the narrator killed by hand', () => {
    const match = beginMatch()
    expect(narratorViewOf(match, START_TIME, NO_CHAT).foolClaimIds).toEqual([])
    unwrap(match.setAlive(NARRATOR_ID, 'p7', false))
    expect(narratorViewOf(match, START_TIME, NO_CHAT).foolClaimIds).toEqual(['p7'])
  })
})
