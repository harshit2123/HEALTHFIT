/*
  Warnings:

  - You are about to drop the column `distanceKm` on the `WorkoutExercise` table. All the data in the column will be lost.
  - You are about to drop the column `muscleGroups` on the `WorkoutExercise` table. All the data in the column will be lost.
  - You are about to drop the column `reps` on the `WorkoutExercise` table. All the data in the column will be lost.
  - You are about to drop the column `sets` on the `WorkoutExercise` table. All the data in the column will be lost.
  - You are about to drop the column `timeMin` on the `WorkoutExercise` table. All the data in the column will be lost.
  - You are about to drop the column `weightKg` on the `WorkoutExercise` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('MANUAL', 'USER_CUSTOM', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STRENGTH', 'CARDIO', 'FLEXIBILITY', 'SPORTS', 'BODYWEIGHT', 'OTHER');

-- AlterTable
ALTER TABLE "WorkoutExercise" DROP COLUMN "distanceKm",
DROP COLUMN "muscleGroups",
DROP COLUMN "reps",
DROP COLUMN "sets",
DROP COLUMN "timeMin",
DROP COLUMN "weightKg",
ADD COLUMN     "exerciseId" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN     "routineId" TEXT;

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "reps" INTEGER,
    "weightKg" DECIMAL(6,2),
    "distanceKm" DECIMAL(6,2),
    "timeSeconds" INTEGER,
    "rpe" INTEGER,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,
    "isPR" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT,
    "category" "ExerciseCategory" NOT NULL,
    "primaryMuscles" JSONB NOT NULL,
    "secondaryMuscles" JSONB,
    "equipment" TEXT,
    "defaultUnit" TEXT NOT NULL DEFAULT 'REPS',
    "metPerKg" DECIMAL(4,2),
    "description" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "source" "ExerciseSource" NOT NULL DEFAULT 'MANUAL',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "searchKey" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "exerciseName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "setScheme" TEXT,
    "notes" TEXT,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSet_workoutExerciseId_idx" ON "WorkoutSet"("workoutExerciseId");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");

-- CreateIndex
CREATE INDEX "Exercise_searchKey_idx" ON "Exercise"("searchKey");

-- CreateIndex
CREATE INDEX "Exercise_usageCount_idx" ON "Exercise"("usageCount" DESC);

-- CreateIndex
CREATE INDEX "Routine_userId_lastUsedAt_idx" ON "Routine"("userId", "lastUsedAt" DESC);

-- CreateIndex
CREATE INDEX "RoutineExercise_routineId_idx" ON "RoutineExercise"("routineId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
