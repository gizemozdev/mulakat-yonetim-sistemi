-- CreateTable
CREATE TABLE "IkCevap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mulakatId" INTEGER NOT NULL,
    "sira" INTEGER NOT NULL,
    "soruId" INTEGER,
    "akisAdi" TEXT NOT NULL,
    "soruMetni" TEXT NOT NULL,
    "secenekMetni" TEXT,
    "not" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "IkCevap_mulakatId_fkey" FOREIGN KEY ("mulakatId") REFERENCES "Mulakat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "ikAkisId" INTEGER,
    "ikGuncelSoruId" INTEGER,
    "genelNot" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Mulakat_adayId_fkey" FOREIGN KEY ("adayId") REFERENCES "Aday" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mulakat_mulakatciId_fkey" FOREIGN KEY ("mulakatciId") REFERENCES "Mulakatci" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mulakat_ikAkisId_fkey" FOREIGN KEY ("ikAkisId") REFERENCES "IkAkis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mulakat" ("adayId", "durum", "id", "mulakatciId", "tarih", "tur") SELECT "adayId", "durum", "id", "mulakatciId", "tarih", "tur" FROM "Mulakat";
DROP TABLE "Mulakat";
ALTER TABLE "new_Mulakat" RENAME TO "Mulakat";
CREATE UNIQUE INDEX "Mulakat_adayId_tur_key" ON "Mulakat"("adayId", "tur");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
