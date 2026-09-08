-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResourceAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requiredQuantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT,
    CONSTRAINT "ResourceAllocation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourceAllocation_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourceAllocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResourceAllocation" ("createdAt", "eventId", "functionId", "id", "notes", "quantity", "resourceId") SELECT "createdAt", "eventId", "functionId", "id", "notes", "quantity", "resourceId" FROM "ResourceAllocation";
DROP TABLE "ResourceAllocation";
ALTER TABLE "new_ResourceAllocation" RENAME TO "ResourceAllocation";
CREATE INDEX "ResourceAllocation_resourceId_idx" ON "ResourceAllocation"("resourceId");
CREATE INDEX "ResourceAllocation_functionId_idx" ON "ResourceAllocation"("functionId");
CREATE UNIQUE INDEX "ResourceAllocation_resourceId_functionId_key" ON "ResourceAllocation"("resourceId", "functionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
