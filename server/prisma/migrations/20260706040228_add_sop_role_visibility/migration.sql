-- CreateTable
CREATE TABLE "sop_role_visibility" (
    "sopId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    PRIMARY KEY ("sopId", "roleId"),
    CONSTRAINT "sop_role_visibility_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sop_role_visibility_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
