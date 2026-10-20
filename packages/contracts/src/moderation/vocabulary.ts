import type { Result } from '../result'
import type { RoomStatus, RoomVisibility } from '../room/vocabulary'

export const REVIEW_LABELS = ['ok', 'profanity', 'harassment', 'sexual', 'spam', 'injection'] as const
export type ReviewLabel = (typeof REVIEW_LABELS)[number]

export const REVIEWED_TEXT_KINDS = ['name', 'room-name', 'message'] as const
export type ReviewedTextKind = (typeof REVIEWED_TEXT_KINDS)[number]

export const STRIKE_REASONS = ['kicked', 'room-hidden', 'message-flagged', 'name-blocked'] as const
export type StrikeReason = (typeof STRIKE_REASONS)[number]

export const CLIENT_KEY_KINDS = ['device', 'address'] as const
export type ClientKeyKind = (typeof CLIENT_KEY_KINDS)[number]

export const BAN_SOURCES = ['strikes', 'operator'] as const
export type BanSource = (typeof BAN_SOURCES)[number]

export const MODERATION_LIMITS = {
  strikeWindowHours: 24,
  deviceStrikesToBan: 3,
  addressStrikesToBan: 6,
  banHours: 24,
  maxOperatorBanHours: 24 * 365,
  reviewsPerMinute: 30,
  reviewsPerRoom: 600,
  nameReviewTimeoutMs: 3000,
  messageReviewTimeoutMs: 4000,
  journalSize: 100,
  excerptLength: 200,
  admin: { failuresToLock: 5, failureWindowMinutes: 10, lockMinutes: 10 }
} as const

export const ADMIN_SESSION = {
  cookieName: 'luna_admin',
  lifetimeHours: 8,
  path: '/api/admin/session',
  maxBodyBytes: 1024
} as const

export const DEVICE_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

export interface ClientHandshake {
  readonly device?: string
}

export const ADMIN_ERROR_CODES = ['admin-disabled', 'admin-denied', 'room-not-found', 'ban-invalid'] as const
export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[number]

export interface AdminError {
  readonly code: AdminErrorCode
}

export const adminError = (code: AdminErrorCode): AdminError => ({ code })

export interface ClientKey {
  readonly kind: ClientKeyKind
  readonly value: string
}

export interface BanView {
  readonly key: ClientKey
  readonly until: number
  readonly source: BanSource
}

export interface StrikeView {
  readonly device: string
  readonly address: string
  readonly reason: StrikeReason
  readonly roomCode: string | null
  readonly excerpt: string | null
  readonly at: number
}

export interface ReportView {
  readonly roomCode: string
  readonly roomName: string
  readonly address: string
  readonly at: number
}

export interface AdminRoomView {
  readonly code: string
  readonly name: string
  readonly narratorName: string
  readonly visibility: RoomVisibility
  readonly status: RoomStatus
  readonly playerCount: number
  readonly reports: number
  readonly hidden: boolean
}

export interface ModerationOverview {
  readonly bans: readonly BanView[]
  readonly strikes: readonly StrikeView[]
  readonly reports: readonly ReportView[]
  readonly rooms: readonly AdminRoomView[]
}

export interface AdminSessionStatus {
  readonly signedIn: boolean
  readonly expiresAt: number | null
}

export type AdminAck<T> = (result: Result<T, AdminError>) => void

export interface AdminClientEvents {
  'admin:overview': (input: Record<string, never>, ack: AdminAck<ModerationOverview>) => void
  'admin:ban': (input: ClientKey & { readonly hours: number }, ack: AdminAck<void>) => void
  'admin:unban': (input: ClientKey, ack: AdminAck<void>) => void
  'admin:closeRoom': (input: { readonly code: string }, ack: AdminAck<void>) => void
}
