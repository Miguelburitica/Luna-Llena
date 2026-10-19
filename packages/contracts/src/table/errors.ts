export const TABLE_ERROR_CODES = ['nothing-to-undo'] as const
export type TableErrorCode = (typeof TABLE_ERROR_CODES)[number]

export interface TableError {
  readonly code: TableErrorCode
}

export const tableError = (code: TableErrorCode): TableError => ({ code })
