-- CreateTable
CREATE TABLE "TeknikCevap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mulakatId" INTEGER NOT NULL,
    "sira" INTEGER NOT NULL,
    "konuAdi" TEXT NOT NULL,
    "soruMetni" TEXT NOT NULL,
    "degerlendirme" TEXT,
    CONSTRAINT "TeknikCevap_mulakatId_fkey" FOREIGN KEY ("mulakatId") REFERENCES "Mulakat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
