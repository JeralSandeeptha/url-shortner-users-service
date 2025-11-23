-- AlterTable
ALTER TABLE "User" ADD COLUMN     "biography" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "productUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "securityAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeZone" TEXT,
ADD COLUMN     "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklySummary" BOOLEAN NOT NULL DEFAULT false;
