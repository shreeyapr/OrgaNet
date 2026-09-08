-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "venue" TEXT,
    "guestCount" INTEGER,
    "description" TEXT,
    "venueId" TEXT,
    "spaceId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'P3',
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "priorityReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "description", "endDate", "eventCode", "guestCount", "id", "name", "spaceId", "startDate", "status", "updatedAt", "venue", "venueId") SELECT "createdAt", "description", "endDate", "eventCode", "guestCount", "id", "name", "spaceId", "startDate", "status", "updatedAt", "venue", "venueId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_eventCode_key" ON "Event"("eventCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
