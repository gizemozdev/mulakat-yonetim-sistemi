-- CreateTable
CREATE TABLE "Pozisyon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Aday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "yas" INTEGER NOT NULL,
    "pozisyonId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aday_pozisyonId_fkey" FOREIGN KEY ("pozisyonId") REFERENCES "Pozisyon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pozisyon_ad_key" ON "Pozisyon"("ad");
