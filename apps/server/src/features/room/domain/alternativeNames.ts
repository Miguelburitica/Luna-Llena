import { ROOM_LIMITS } from '@luna/contracts'
import { DisplayName } from './DisplayName'

const SUFFIXES = ['2', 'B.', '3', 'Jr.', '4', '5', '6', '7', '8', '9']
const SUGGESTION_COUNT = 3

const withSuffix = (base: string, suffix: string): string =>
  `${base.slice(0, ROOM_LIMITS.maxNameLength - suffix.length - 1).trimEnd()} ${suffix}`

export const alternativeNames = (requested: DisplayName, isTaken: (candidate: DisplayName) => boolean): string[] =>
  SUFFIXES.map((suffix) => DisplayName.create(withSuffix(requested.value, suffix)))
    .flatMap((candidate) => (candidate.ok && !isTaken(candidate.value) ? [candidate.value.value] : []))
    .slice(0, SUGGESTION_COUNT)
