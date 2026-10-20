import type { Clock } from '../../../shared/application/Clock'
import { AdminSessionOf } from './AdminSessionOf'
import { BanClient } from './BanClient'
import { CheckBan } from './CheckBan'
import { CloseRoomAsAdmin } from './CloseRoomAsAdmin'
import { LiftBan } from './LiftBan'
import { ModerationOverviewQuery } from './ModerationOverviewQuery'
import type { AdminSecret, AdminSessions, ContentClassifier, ModerationRecords, RoomDirectory } from './ports'
import { RecordReport } from './RecordReport'
import { RecordStrike } from './RecordStrike'
import { ReviewText } from './ReviewText'
import { SignInAdmin } from './SignInAdmin'
import { SignOutAdmin } from './SignOutAdmin'

export interface ModerationDependencies {
  readonly records: ModerationRecords
  readonly classifier: ContentClassifier
  readonly sessions: AdminSessions
  readonly secret: AdminSecret
  readonly directory: RoomDirectory
  readonly clock: Clock
}

export const createModerationUseCases = ({ records, classifier, sessions, secret, directory, clock }: ModerationDependencies) => {
  const admin = { secret, sessions, clock }
  return {
    reviewText: new ReviewText(records, classifier, clock),
    recordStrike: new RecordStrike(records, clock),
    checkBan: new CheckBan(records, clock),
    recordReport: new RecordReport(records, clock),
    signInAdmin: new SignInAdmin(admin, records),
    signOutAdmin: new SignOutAdmin(sessions),
    adminSessionOf: new AdminSessionOf(admin),
    moderationOverview: new ModerationOverviewQuery(admin, records, directory),
    banClient: new BanClient(admin, records),
    liftBan: new LiftBan(admin, records),
    closeRoomAsAdmin: new CloseRoomAsAdmin(admin, directory)
  }
}

export type ModerationUseCases = ReturnType<typeof createModerationUseCases>
