import { done, err, matchError, ok, type MatchError, type MatchView, type Result } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { Match } from '@luna/rules'
import type { Actor, MatchPublisher, MatchRepository } from './ports'
import { toMatchViewFor, toMatchViews } from './matchViews'

export interface MatchAccess {
  readonly matches: MatchRepository
  readonly publisher: MatchPublisher
  readonly clock: Clock
}

export const findActorMatch = async (matches: MatchRepository, actor: Actor): Promise<Result<Match, MatchError>> => {
  const match = await matches.find(actor.code)
  if (match === undefined) return err(matchError('match-not-found'))
  return match.hasMember(actor.memberId) ? ok(match) : err(matchError('session-invalid'))
}

export const saveAndPublish = async ({ matches, publisher, clock }: MatchAccess, match: Match): Promise<void> => {
  await matches.save(match)
  publisher.publish(match.code, toMatchViews(match, clock.now()))
}

export const viewOf = async (access: MatchAccess, actor: Actor): Promise<Result<MatchView, MatchError>> => {
  const match = await findActorMatch(access.matches, actor)
  if (!match.ok) return match
  const view = toMatchViewFor(match.value, actor.memberId, access.clock.now())
  return view === undefined ? err(matchError('session-invalid')) : ok(view)
}

export const changeMatchAs = async (
  access: MatchAccess,
  actor: Actor,
  change: (match: Match, now: number) => Result<unknown, MatchError>
): Promise<Result<void, MatchError>> => {
  const match = await findActorMatch(access.matches, actor)
  if (!match.ok) return match
  const outcome = change(match.value, access.clock.now())
  if (!outcome.ok) return outcome
  await saveAndPublish(access, match.value)
  return done
}
