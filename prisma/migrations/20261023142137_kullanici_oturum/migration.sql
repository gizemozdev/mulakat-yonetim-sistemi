-- CreateTable
CREATE TABLE "Kullanici" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullaniciAdi" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "sifreOzeti" TEXT NOT NULL,
    "olusturulma" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Oturum" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anahtarOzeti" TEXT NOT NULL,
    "kullaniciId" INTEGER NOT NULL,
    "bitis" DATETIME NOT NULL,
    CONSTRAINT "Oturum_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_kullaniciAdi_key" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE UNIQUE INDEX "Oturum_anahtarOzeti_key" ON "Oturum"("anahtarOzeti");
