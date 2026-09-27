-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LIKE_RECEIVED';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "lineFollowing" BOOLEAN,
ADD COLUMN     "lineMutedTypes" "NotificationType"[] DEFAULT ARRAY[]::"NotificationType"[];

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "lineSentAt" TIMESTAMP(3),
ADD COLUMN     "lineSkipReason" TEXT,
ADD COLUMN     "path" TEXT;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "type" "NotificationType" NOT NULL,
    "lineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "LineDeliverySetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "monthlyLimit" INTEGER,
    "priorityReserve" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineDeliverySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Like_toId_createdAt_idx" ON "Like"("toId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Like_fromId_toId_key" ON "Like"("fromId", "toId");

-- CreateIndex
CREATE INDEX "Notification_lineSentAt_idx" ON "Notification"("lineSentAt");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

