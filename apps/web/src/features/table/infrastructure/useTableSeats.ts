import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Seat } from '@/features/match/domain/seating'
import { useTableStore } from '../application/useTableStore'
import { packNamesOf, tableSeatsOf } from '../domain/tableSeats'

export const useTableSeats = () => {
  const { t } = useI18n()
  const table = useTableStore()
  const fallbackName = (seatNumber: number) => t('table.seatName', { number: seatNumber })
  const seats = computed<Seat[]>(() =>
    table.journal === null || table.view === null ? [] : tableSeatsOf(table.journal, table.view, fallbackName)
  )
  const nameOf = (id: string | null): string => seats.value.find((seat) => seat.id === id)?.name ?? ''
  const packOf = (seatId: string): string[] => (table.journal === null ? [] : packNamesOf(table.journal, seatId, fallbackName))
  return { seats, nameOf, packOf, fallbackName }
}
