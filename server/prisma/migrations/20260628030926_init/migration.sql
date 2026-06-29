-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "categories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "referenceCode" TEXT,
    "categoryId" TEXT,
    "ownerId" TEXT,
    "docType" TEXT NOT NULL DEFAULT 'SOP',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentVersion" TEXT NOT NULL DEFAULT '1.0',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "sops_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sops_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "contentHtml" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sop_versions_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sop_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "change_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "versionFrom" TEXT,
    "versionTo" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "changedById" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "change_logs_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "change_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sopId" TEXT NOT NULL,
    "versionId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "stepType" TEXT NOT NULL DEFAULT 'action',
    "refCode" TEXT,
    "parentStepId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sop_steps_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sop_steps_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "sop_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sop_steps_parentStepId_fkey" FOREIGN KEY ("parentStepId") REFERENCES "sop_steps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sops_referenceCode_key" ON "sops"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "sop_versions_sopId_version_key" ON "sop_versions"("sopId", "version");
