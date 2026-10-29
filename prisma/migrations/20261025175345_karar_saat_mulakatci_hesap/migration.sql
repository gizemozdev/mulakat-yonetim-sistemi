-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "yas" INTEGER NOT NULL,
    "eposta" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "karar" TEXT NOT NULL DEFAULT 'Değerlendiriliyor',
    "kararNotu" TEXT NOT NULL DEFAULT '',
    "pozisyonId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aday_pozisyonId_fkey" FOREIGN KEY ("pozisyonId") REFERENCES "Pozisyon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Aday" ("adSoyad", "createdAt", "eposta", "id", "pozisyonId", "telefon", "yas") SELECT "adSoyad", "createdAt", "eposta", "id", "pozisyonId", "telefon", "yas" FROM "Aday";
DROP TABLE "Aday";
ALTER TABLE "new_Aday" RENAME TO "Aday";
CREATE TABLE "new_Mulakat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adayId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "mulakatciId" INTEGER,
    "tarih" TEXT NOT NULL DEFAULT '',
    "saat" TEXT NOT NULL DEFAULT '',
    "durum" TEXT NOT NULL DEFAULT 'Planlanmadı',
    "ikAkisId" INTEGER,
    "ikGuncelSoruId" INTEGER,
    "genelNot" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Mulakat_adayId_fkey" FOREIGN KEY ("adayId") REFERENCES "Aday" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mulakat_mulakatciId_fkey" FOREIGN KEY ("mulakatciId") REFERENCES "Mulakatci" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mulakat_ikAkisId_fkey" FOREIGN KEY ("ikAkisId") REFERENCES "IkAkis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mulakat" ("adayId", "durum", "genelNot", "id", "ikAkisId", "ikGuncelSoruId", "mulakatciId", "tarih", "tur") SELECT "adayId", "durum", "genelNot", "id", "ikAkisId", "ikGuncelSoruId", "mulakatciId", "tarih", "tur" FROM "Mulakat";
DROP TABLE "Mulakat";
ALTER TABLE "new_Mulakat" RENAME TO "Mulakat";
CREATE UNIQUE INDEX "Mulakat_adayId_tur_key" ON "Mulakat"("adayId", "tur");
CREATE TABLE "new_Mulakatci" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "alan" TEXT NOT NULL,
    "kullaniciId" INTEGER,
    CONSTRAINT "Mulakatci_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mulakatci" ("adSoyad", "alan", "id") SELECT "adSoyad", "alan", "id" FROM "Mulakatci";
DROP TABLE "Mulakatci";
ALTER TABLE "new_Mulakatci" RENAME TO "Mulakatci";
CREATE UNIQUE INDEX "Mulakatci_adSoyad_alan_key" ON "Mulakatci"("adSoyad", "alan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
