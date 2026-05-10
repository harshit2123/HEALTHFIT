-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "primaryGoal" TEXT,
ADD COLUMN     "streakDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakLastDate" TIMESTAMP(3);
