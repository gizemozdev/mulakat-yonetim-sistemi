-- CreateTable
CREATE TABLE "Mulakat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adayId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "kisi" TEXT NOT NULL DEFAULT '',
    "tarih" TEXT NOT NULL DEFAULT '',
    "durum" TEXT NOT NULL DEFAULT 'Planlanmadı',
    CONSTRAINT "Mulakat_adayId_fkey" FOREIGN KEY ("adayId") REFERENCES "Aday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Mulakat_adayId_tur_key" ON "Mulakat"("adayId", "tur");
