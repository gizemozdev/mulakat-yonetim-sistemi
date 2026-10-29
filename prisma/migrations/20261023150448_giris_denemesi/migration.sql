-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Kullanici" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullaniciAdi" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "sifreOzeti" TEXT NOT NULL,
    "olusturulma" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hataliDeneme" INTEGER NOT NULL DEFAULT 0,
    "kilitBitis" DATETIME
);
INSERT INTO "new_Kullanici" ("adSoyad", "id", "kullaniciAdi", "olusturulma", "sifreOzeti") SELECT "adSoyad", "id", "kullaniciAdi", "olusturulma", "sifreOzeti" FROM "Kullanici";
DROP TABLE "Kullanici";
ALTER TABLE "new_Kullanici" RENAME TO "Kullanici";
CREATE UNIQUE INDEX "Kullanici_kullaniciAdi_key" ON "Kullanici"("kullaniciAdi");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
