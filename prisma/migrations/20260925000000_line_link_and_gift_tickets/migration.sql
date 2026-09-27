-- CreateEnum
CREATE TYPE "GiftTicketStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GiftTicketReason" AS ENUM ('REFERRAL', 'CAMPAIGN', 'COMPENSATION');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "lineConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineUserId" TEXT,
ADD COLUMN     "notifyViaLine" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "GiftTicket" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 5000,
    "reason" "GiftTicketReason" NOT NULL DEFAULT 'REFERRAL',
    "status" "GiftTicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "GiftTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftTicket_code_key" ON "GiftTicket"("code");

-- CreateIndex
CREATE INDEX "GiftTicket_memberId_idx" ON "GiftTicket"("memberId");

-- CreateIndex
CREATE INDEX "GiftTicket_status_idx" ON "GiftTicket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Member_lineUserId_key" ON "Member"("lineUserId");

-- AddForeignKey
ALTER TABLE "GiftTicket" ADD CONSTRAINT "GiftTicket_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

