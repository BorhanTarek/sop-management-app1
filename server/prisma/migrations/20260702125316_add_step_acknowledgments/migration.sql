-- CreateTable
CREATE TABLE "step_acknowledgments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "step_acknowledgments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "step_acknowledgments_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
