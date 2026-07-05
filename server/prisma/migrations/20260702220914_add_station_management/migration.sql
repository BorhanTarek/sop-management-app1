/*
  Warnings:

  - You are about to drop the `operating_hours` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `acknowledgedAt` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `acknowledgedByUserId` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `actualExecutionTime` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledTime` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `execution_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `delayThresholdMin` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `phase` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `stationMasterId` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `targetCloseTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `targetOpenTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `stations` table. All the data in the column will be lost.
  - Added the required column `action` to the `execution_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetTime` to the `execution_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `execution_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "operating_hours";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_execution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetTime" TEXT NOT NULL,
    "actualTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "sopId" TEXT,
    CONSTRAINT "execution_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "execution_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "execution_logs_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_execution_logs" ("delayMinutes", "id", "sopId", "stationId") SELECT "delayMinutes", "id", "sopId", "stationId" FROM "execution_logs";
DROP TABLE "execution_logs";
ALTER TABLE "new_execution_logs" RENAME TO "execution_logs";
CREATE TABLE "new_stations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT NOT NULL DEFAULT 'Line 3',
    "standardOpeningTime" TEXT NOT NULL DEFAULT '05:00',
    "standardClosingTime" TEXT NOT NULL DEFAULT '01:00'
);
INSERT INTO "new_stations" ("code", "id", "line", "name") SELECT "code", "id", "line", "name" FROM "stations";
DROP TABLE "stations";
ALTER TABLE "new_stations" RENAME TO "stations";
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stationId" TEXT,
    CONSTRAINT "users_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "department", "email", "fullName", "id", "isActive", "passwordHash", "updatedAt") SELECT "createdAt", "department", "email", "fullName", "id", "isActive", "passwordHash", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
