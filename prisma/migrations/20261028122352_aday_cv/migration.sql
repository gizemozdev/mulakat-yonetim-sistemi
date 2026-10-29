-- CreateTable
CREATE TABLE "AdayCv" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adayId" INTEGER NOT NULL,
    "dosyaAdi" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "icerik" BLOB NOT NULL,
    "yuklenme" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdayCv_adayId_fkey" FOREIGN KEY ("adayId") REFERENCES "Aday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdayCv_adayId_key" ON "AdayCv"("adayId");
