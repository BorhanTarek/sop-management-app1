-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT NOT NULL DEFAULT 'Line 3',
    "phase" TEXT DEFAULT 'Phase 3',
    "targetOpenTime" TEXT NOT NULL DEFAULT '05:00 AM',
    "targetCloseTime" TEXT NOT NULL DEFAULT '01:00 AM',
    "delayThresholdMin" INTEGER NOT NULL DEFAULT 5,
    "stationMasterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stations_stationMasterId_fkey" FOREIGN KEY ("stationMasterId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isGlobalOverride" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operating_hours_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "sopId" TEXT,
    "actionType" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "actualExecutionTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ON_SCHEDULE',
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "acknowledgedByUserId" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "execution_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "execution_logs_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");
