/*
  Warnings:

  - You are about to drop the `execution_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sop_execution_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `code` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `line` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `standardClosingTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `standardOpeningTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `step_acknowledgments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `user_stations` table. All the data in the column will be lost.
  - Added the required column `stationCode` to the `stations` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "execution_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sop_execution_sessions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "station_sops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    CONSTRAINT "station_sops_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "station_sops_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "shiftDate" TEXT NOT NULL,
    CONSTRAINT "sop_sessions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sop_sessions_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sop_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_session_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepTitle" TEXT,
    "stepType" TEXT,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchChoice" TEXT,
    CONSTRAINT "sop_session_steps_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sop_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "stationCode" TEXT NOT NULL,
    "lineCode" TEXT NOT NULL DEFAULT 'L3',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_stations" ("id", "name") SELECT "id", "name" FROM "stations";
DROP TABLE "stations";
ALTER TABLE "new_stations" RENAME TO "stations";
CREATE UNIQUE INDEX "stations_stationCode_key" ON "stations"("stationCode");
CREATE TABLE "new_step_acknowledgments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "step_acknowledgments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "step_acknowledgments_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_step_acknowledgments" ("acknowledgedAt", "id", "sopId", "stepId", "userId", "version") SELECT "acknowledgedAt", "id", "sopId", "stepId", "userId", "version" FROM "step_acknowledgments";
DROP TABLE "step_acknowledgments";
ALTER TABLE "new_step_acknowledgments" RENAME TO "step_acknowledgments";
CREATE TABLE "new_user_stations" (
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "stationId"),
    CONSTRAINT "user_stations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_stations_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_stations" ("stationId", "userId") SELECT "stationId", "userId" FROM "user_stations";
DROP TABLE "user_stations";
ALTER TABLE "new_user_stations" RENAME TO "user_stations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "station_sops_stationId_procedureType_key" ON "station_sops"("stationId", "procedureType");
