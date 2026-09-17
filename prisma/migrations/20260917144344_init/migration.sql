-- CreateTable
CREATE TABLE "WardrobeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "WornOutfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateWorn" DATETIME NOT NULL,
    "contextNote" TEXT,
    "sourceType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OutfitItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wardrobeItemId" TEXT NOT NULL,
    "wornOutfitId" TEXT NOT NULL,
    CONSTRAINT "OutfitItem_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OutfitItem_wornOutfitId_fkey" FOREIGN KEY ("wornOutfitId") REFERENCES "WornOutfit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspirationImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "aestheticLabels" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "silhouetteNotes" TEXT NOT NULL,
    "formalityRangeMin" INTEGER NOT NULL,
    "formalityRangeMax" INTEGER NOT NULL,
    "moodDescription" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StyleProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "dominantAesthetics" TEXT NOT NULL,
    "preferredColors" TEXT NOT NULL,
    "formalityComfortMin" INTEGER NOT NULL,
    "formalityComfortMax" INTEGER NOT NULL,
    "styleSummary" TEXT NOT NULL,
    "lastGeneratedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GeneratedSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "triggerType" TEXT NOT NULL,
    "promptText" TEXT,
    "itemIdsJson" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" TEXT,
    "noveltyNote" TEXT,
    "wasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
