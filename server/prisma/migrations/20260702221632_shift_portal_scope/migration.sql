/*
  Warnings:

  - You are about to drop the column `stationId` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "user_stations" (
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "stationId"),
    CONSTRAINT "user_stations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_stations_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_execution_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "sop_execution_sessions_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sop_execution_sessions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sop_execution_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_step_acknowledgments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sessionId" TEXT,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "step_acknowledgments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "step_acknowledgments_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "step_acknowledgments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sop_execution_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_step_acknowledgments" ("acknowledgedAt", "id", "sopId", "stepId", "userId", "version") SELECT "acknowledgedAt", "id", "sopId", "stepId", "userId", "version" FROM "step_acknowledgments";
DROP TABLE "step_acknowledgments";
ALTER TABLE "new_step_acknowledgments" RENAME TO "step_acknowledgments";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "department", "email", "fullName", "id", "isActive", "passwordHash", "updatedAt") SELECT "createdAt", "department", "email", "fullName", "id", "isActive", "passwordHash", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
