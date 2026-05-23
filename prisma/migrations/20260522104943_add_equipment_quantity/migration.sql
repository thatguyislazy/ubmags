-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "building" TEXT,
    "requiresSpecify" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Resource" ("building", "capacity", "category", "createdAt", "description", "id", "isActive", "name", "requiresSpecify", "slug", "sortOrder", "updatedAt") SELECT "building", "capacity", "category", "createdAt", "description", "id", "isActive", "name", "requiresSpecify", "slug", "sortOrder", "updatedAt" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
