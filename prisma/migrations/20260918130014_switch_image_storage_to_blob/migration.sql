/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `InspirationImage` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `WardrobeItem` table. All the data in the column will be lost.
  - Added the required column `imageData` to the `InspirationImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageMimeType` to the `InspirationImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageData` to the `WardrobeItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageMimeType` to the `WardrobeItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InspirationImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageData" BLOB NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "aestheticLabels" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "silhouetteNotes" TEXT NOT NULL,
    "formalityRangeMin" INTEGER NOT NULL,
    "formalityRangeMax" INTEGER NOT NULL,
    "moodDescription" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_InspirationImage" ("aestheticLabels", "colorPalette", "createdAt", "formalityRangeMax", "formalityRangeMin", "id", "moodDescription", "silhouetteNotes") SELECT "aestheticLabels", "colorPalette", "createdAt", "formalityRangeMax", "formalityRangeMin", "id", "moodDescription", "silhouetteNotes" FROM "InspirationImage";
DROP TABLE "InspirationImage";
ALTER TABLE "new_InspirationImage" RENAME TO "InspirationImage";
CREATE TABLE "new_WardrobeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageData" BLOB NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColors" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "materialGuess" TEXT NOT NULL,
    "formality" INTEGER NOT NULL,
    "seasons" TEXT NOT NULL,
    "fitStyle" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WardrobeItem" ("category", "createdAt", "fitStyle", "formality", "id", "materialGuess", "pattern", "primaryColor", "seasons", "secondaryColors", "subcategory", "tags", "userConfirmed") SELECT "category", "createdAt", "fitStyle", "formality", "id", "materialGuess", "pattern", "primaryColor", "seasons", "secondaryColors", "subcategory", "tags", "userConfirmed" FROM "WardrobeItem";
DROP TABLE "WardrobeItem";
ALTER TABLE "new_WardrobeItem" RENAME TO "WardrobeItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
