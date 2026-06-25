-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ResidenceArea" AS ENUM ('SAPPORO', 'EBETSU', 'KITAHIROSHIMA', 'ENIWA', 'TOBETSU', 'NANPORO', 'OTARU', 'ISHIKARI', 'IWAMIZAWA', 'CHITOSE', 'SHINSHINOTSU', 'NAGANUMA');

-- CreateEnum
CREATE TYPE "EligibilityType" AS ENUM ('RESIDENT', 'WORKER');

-- CreateEnum
CREATE TYPE "IncomeBracket" AS ENUM ('UNDER_399', 'B400_599', 'B600_799', 'B800_999', 'OVER_1000');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('WEEKENDS_HOLIDAYS', 'SHIFT', 'OTHER_FIXED');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SLIM', 'AVERAGE', 'CHUBBY', 'MUSCULAR', 'PLUMP');

-- CreateEnum
CREATE TYPE "SmokingHabit" AS ENUM ('SMOKER', 'NON_SMOKER');

-- CreateEnum
CREATE TYPE "DrinkingHabit" AS ENUM ('DRINKER', 'SOCIAL', 'NON_DRINKER');

-- CreateEnum
CREATE TYPE "ChildrenWish" AS ENUM ('WANT', 'EITHER', 'DONT_WANT');

-- CreateEnum
CREATE TYPE "MemberAccountType" AS ENUM ('NORMAL', 'SALON');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('DOCUMENT_REVIEW', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_DOCUMENT', 'SINGLE_CERT', 'INCOME_CERT');

-- CreateEnum
CREATE TYPE "DocumentCheckStatus" AS ENUM ('PENDING', 'OK', 'NG');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'NO_SHOW', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('SCHEDULING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DateEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULING');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('REGISTRATION', 'RENEWAL', 'DATE_FEE', 'PENALTY_5500', 'PENALTY_11000');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "CancellationCategory" AS ENUM ('BEFORE_24H', 'H24_TO_2H', 'WITHIN_2H_OR_NOSHOW');

-- CreateEnum
CREATE TYPE "ReferralSourceType" AS ENUM ('MEMBER', 'STORE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "SurveyImplementation" AS ENUM ('AS_PLANNED', 'ENDED_EARLY', 'OVER_60');

-- CreateEnum
CREATE TYPE "SurveySatisfaction" AS ENUM ('VERY_SATISFIED', 'SATISFIED', 'NEUTRAL', 'SOMEWHAT_DISSATISFIED', 'DISSATISFIED');

-- CreateEnum
CREATE TYPE "SurveyIntent" AS ENUM ('WANT_AGAIN', 'NO_MATCH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'MATCHED', 'CANDIDATE_RECEIVED', 'DATE_CONFIRMED', 'DAY_OF_CONTACT', 'DATE_CANCELLED', 'RESCHEDULE_REQUEST', 'ADMIN_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "AnnouncementTarget" AS ENUM ('ALL', 'MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('OWN', 'SPONSOR');

-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('TOP_BOTTOM', 'MYPAGE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'STAFF');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountType" "MemberAccountType" NOT NULL DEFAULT 'NORMAL',
    "status" "MemberStatus" NOT NULL DEFAULT 'DOCUMENT_REVIEW',
    "approvedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "cardRegistered" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "residenceArea" "ResidenceArea" NOT NULL,
    "eligibilityType" "EligibilityType" NOT NULL DEFAULT 'RESIDENT',
    "occupation" TEXT NOT NULL,
    "incomeBracket" "IncomeBracket" NOT NULL,
    "incomeCertVerified" BOOLEAN NOT NULL DEFAULT false,
    "holidayType" "HolidayType" NOT NULL,
    "fixedHolidays" "Weekday"[],
    "hasMarriageHistory" BOOLEAN NOT NULL,
    "hasChildren" BOOLEAN NOT NULL,
    "childrenWish" "ChildrenWish" NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "smoking" "SmokingHabit" NOT NULL,
    "drinking" "DrinkingHabit" NOT NULL,
    "qualifications" TEXT,
    "hobbies" TEXT,
    "selfIntroduction" TEXT,
    "referralBonusRemaining" INTEGER NOT NULL DEFAULT 0,
    "nextRenewalAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "checkStatus" "DocumentCheckStatus" NOT NULL DEFAULT 'PENDING',
    "checkedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "email" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "phase" "MatchPhase" NOT NULL DEFAULT 'SCHEDULING',
    "applicationId" TEXT,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleProposal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleCandidate" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "selectedById" TEXT,
    "selectedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "DateEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "storeId" TEXT,
    "storeConfirmedAt" TIMESTAMP(3),
    "reservationName" TEXT,
    "notesTemplate" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "matchId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "waivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "byMemberId" TEXT NOT NULL,
    "category" "CancellationCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "refundIssuedToCounterpart" BOOLEAN NOT NULL DEFAULT true,
    "penaltyAmount" INTEGER NOT NULL DEFAULT 0,
    "warningPoints" INTEGER NOT NULL DEFAULT 0,
    "freeDateGrantedToCounterpart" BOOLEAN NOT NULL DEFAULT false,
    "mutualHide" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warning" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "cancellationId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sourceType" "ReferralSourceType" NOT NULL,
    "memberId" TEXT,
    "storeLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "referrerId" TEXT,
    "referredId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "establishedAt" TIMESTAMP(3),
    "referrerBonusGranted" BOOLEAN NOT NULL DEFAULT false,
    "referredBonusGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "q1Implementation" "SurveyImplementation" NOT NULL,
    "q2Satisfaction" "SurveySatisfaction" NOT NULL,
    "q3Impression" TEXT NOT NULL,
    "q4Intent" "SurveyIntent" NOT NULL,
    "q5Other" TEXT,
    "sentAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "matchId" TEXT,
    "readAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target" "AnnouncementTarget" NOT NULL DEFAULT 'ALL',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "type" "AdType" NOT NULL DEFAULT 'OWN',
    "position" "AdPosition" NOT NULL DEFAULT 'TOP_BOTTOM',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminMemo" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "memberId" TEXT,
    "matchId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_sex_residenceArea_idx" ON "Member"("sex", "residenceArea");

-- CreateIndex
CREATE INDEX "Member_sex_birthDate_idx" ON "Member"("sex", "birthDate");

-- CreateIndex
CREATE INDEX "Photo_memberId_idx" ON "Photo"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_memberId_order_key" ON "Photo"("memberId", "order");

-- CreateIndex
CREATE INDEX "Document_memberId_idx" ON "Document"("memberId");

-- CreateIndex
CREATE INDEX "Document_checkStatus_idx" ON "Document"("checkStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_memberId_idx" ON "PasswordResetToken"("memberId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "DateApplication_applicantId_idx" ON "DateApplication"("applicantId");

-- CreateIndex
CREATE INDEX "DateApplication_receiverId_idx" ON "DateApplication"("receiverId");

-- CreateIndex
CREATE INDEX "DateApplication_status_idx" ON "DateApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_applicationId_key" ON "Match"("applicationId");

-- CreateIndex
CREATE INDEX "Match_applicantId_idx" ON "Match"("applicantId");

-- CreateIndex
CREATE INDEX "Match_receiverId_idx" ON "Match"("receiverId");

-- CreateIndex
CREATE INDEX "Match_phase_idx" ON "Match"("phase");

-- CreateIndex
CREATE INDEX "Match_lastActionAt_idx" ON "Match"("lastActionAt");

-- CreateIndex
CREATE INDEX "ScheduleProposal_matchId_idx" ON "ScheduleProposal"("matchId");

-- CreateIndex
CREATE INDEX "ScheduleCandidate_proposalId_idx" ON "ScheduleCandidate"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "DateEvent_matchId_key" ON "DateEvent"("matchId");

-- CreateIndex
CREATE INDEX "DateEvent_startAt_idx" ON "DateEvent"("startAt");

-- CreateIndex
CREATE INDEX "DateEvent_status_idx" ON "DateEvent"("status");

-- CreateIndex
CREATE INDEX "Payment_memberId_idx" ON "Payment"("memberId");

-- CreateIndex
CREATE INDEX "Payment_matchId_idx" ON "Payment"("matchId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Cancellation_matchId_idx" ON "Cancellation"("matchId");

-- CreateIndex
CREATE INDEX "Cancellation_byMemberId_idx" ON "Cancellation"("byMemberId");

-- CreateIndex
CREATE INDEX "Cancellation_category_idx" ON "Cancellation"("category");

-- CreateIndex
CREATE INDEX "Warning_memberId_idx" ON "Warning"("memberId");

-- CreateIndex
CREATE INDEX "Warning_expiresAt_idx" ON "Warning"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_memberId_key" ON "ReferralCode"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_codeId_idx" ON "Referral"("codeId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "SurveyResponse_matchId_idx" ON "SurveyResponse"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_matchId_memberId_key" ON "SurveyResponse"("matchId", "memberId");

-- CreateIndex
CREATE INDEX "Notification_memberId_readAt_idx" ON "Notification"("memberId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_isPublished_target_idx" ON "Announcement"("isPublished", "target");

-- CreateIndex
CREATE INDEX "Ad_isEnabled_position_idx" ON "Ad"("isEnabled", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminMemo_memberId_idx" ON "AdminMemo"("memberId");

-- CreateIndex
CREATE INDEX "AdminMemo_matchId_idx" ON "AdminMemo"("matchId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateApplication" ADD CONSTRAINT "DateApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateApplication" ADD CONSTRAINT "DateApplication_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DateApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleProposal" ADD CONSTRAINT "ScheduleProposal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleProposal" ADD CONSTRAINT "ScheduleProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCandidate" ADD CONSTRAINT "ScheduleCandidate_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ScheduleProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCandidate" ADD CONSTRAINT "ScheduleCandidate_selectedById_fkey" FOREIGN KEY ("selectedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateEvent" ADD CONSTRAINT "DateEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateEvent" ADD CONSTRAINT "DateEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_byMemberId_fkey" FOREIGN KEY ("byMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_cancellationId_fkey" FOREIGN KEY ("cancellationId") REFERENCES "Cancellation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMemo" ADD CONSTRAINT "AdminMemo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMemo" ADD CONSTRAINT "AdminMemo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMemo" ADD CONSTRAINT "AdminMemo_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
