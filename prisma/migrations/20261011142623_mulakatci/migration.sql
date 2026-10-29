-- CreateTable
CREATE TABLE "Mulakatci" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "alan" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mulakat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adayId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "mulakatciId" INTEGER,
    "tarih" TEXT NOT NULL DEFAULT '',
    "durum" TEXT NOT NULL DEFAULT 'Planlanmadı',
    CONSTRAINT "Mulakat_adayId_fkey" FOREIGN KEY ("adayId") REFERENCES "Aday" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mulakat_mulakatciId_fkey" FOREIGN KEY ("mulakatciId") REFERENCES "Mulakatci" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mulakat" ("adayId", "durum", "id", "tarih", "tur") SELECT "adayId", "durum", "id", "tarih", "tur" FROM "Mulakat";
DROP TABLE "Mulakat";
ALTER TABLE "new_Mulakat" RENAME TO "Mulakat";
CREATE UNIQUE INDEX "Mulakat_adayId_tur_key" ON "Mulakat"("adayId", "tur");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Mulakatci_adSoyad_alan_key" ON "Mulakatci"("adSoyad", "alan");

