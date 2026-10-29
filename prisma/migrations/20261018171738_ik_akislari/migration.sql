-- CreateTable
CREATE TABLE "IkAkis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL,
    "genel" BOOLEAN NOT NULL DEFAULT false,
    "ilkSoruId" INTEGER,
    CONSTRAINT "IkAkis_ilkSoruId_fkey" FOREIGN KEY ("ilkSoruId") REFERENCES "IkSoru" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IkSoru" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "akisId" INTEGER NOT NULL,
    "metin" TEXT NOT NULL,
    CONSTRAINT "IkSoru_akisId_fkey" FOREIGN KEY ("akisId") REFERENCES "IkAkis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IkSecenek" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "soruId" INTEGER NOT NULL,
    "metin" TEXT NOT NULL,
    "sonrakiSoruId" INTEGER,
    CONSTRAINT "IkSecenek_soruId_fkey" FOREIGN KEY ("soruId") REFERENCES "IkSoru" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IkSecenek_sonrakiSoruId_fkey" FOREIGN KEY ("sonrakiSoruId") REFERENCES "IkSoru" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_IkAkisToPozisyon" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_IkAkisToPozisyon_A_fkey" FOREIGN KEY ("A") REFERENCES "IkAkis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_IkAkisToPozisyon_B_fkey" FOREIGN KEY ("B") REFERENCES "Pozisyon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IkAkis_ad_key" ON "IkAkis"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "_IkAkisToPozisyon_AB_unique" ON "_IkAkisToPozisyon"("A", "B");

-- CreateIndex
CREATE INDEX "_IkAkisToPozisyon_B_index" ON "_IkAkisToPozisyon"("B");

-- Her İK mülakatında sorulan genel akış; uygulama bunu silmeye izin vermez
INSERT INTO "IkAkis" ("ad", "genel") VALUES ('Genel Sorular', true);
