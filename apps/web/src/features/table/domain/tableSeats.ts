import type { NarratorMatchView } from '@luna/contracts'
import type { Seat } from '@/features/match/domain/seating'
import { seatIndexOf, type TableJournal } from './tableJournal'
import { seatNameOf } from './tableSetup'

export const tableSeatsOf = (
  journal: TableJournal,
  view: NarratorMatchView,
  fallbackName: (seatNumber: number) => string
): Seat[] =>
  view.players.map((player) => {
    const index = seatIndexOf(player.id)
    return {
      id: player.id,
      name: seatNameOf(journal.setup, index) ?? fallbackName(index + 1),
      avatar: null,
      alive: player.alive,
      revealedRole: player.revealedRole,
      isYou: false,
      isPack: view.roles[player.id] === 'werewolf',
      bot: false
    }
  })

export const packNamesOf = (journal: TableJournal, seatId: string, fallbackName: (seatNumber: number) => string): string[] =>
  journal.seats.find((seat) => seat.id === seatId)?.role !== 'werewolf'
    ? []
    : journal.seats
    .flatMap((seat, index) => (seat.role === 'werewolf' && seat.id !== seatId ? [index] : []))
    .map((index) => seatNameOf(journal.setup, index) ?? fallbackName(index + 1))
