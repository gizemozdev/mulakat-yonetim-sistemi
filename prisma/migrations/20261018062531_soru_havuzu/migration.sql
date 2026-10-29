-- CreateTable
CREATE TABLE "Konu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TeknikSoru" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "konuId" INTEGER NOT NULL,
    "metin" TEXT NOT NULL,
    CONSTRAINT "TeknikSoru_konuId_fkey" FOREIGN KEY ("konuId") REFERENCES "Konu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Konu_ad_key" ON "Konu"("ad");
