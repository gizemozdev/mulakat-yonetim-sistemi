-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "yas" INTEGER NOT NULL,
    "eposta" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "pozisyonId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aday_pozisyonId_fkey" FOREIGN KEY ("pozisyonId") REFERENCES "Pozisyon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Aday" ("adSoyad", "createdAt", "id", "pozisyonId", "yas") SELECT "adSoyad", "createdAt", "id", "pozisyonId", "yas" FROM "Aday";
DROP TABLE "Aday";
ALTER TABLE "new_Aday" RENAME TO "Aday";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
