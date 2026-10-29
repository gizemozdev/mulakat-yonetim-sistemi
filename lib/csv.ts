// Türkçe Excel'in doğrudan açabileceği CSV: UTF-8 BOM (Türkçe karakterler için) ve ";" ayıracı
// (Türkçe ayarlarda virgül ondalık işareti olduğu için Excel ";" bekler)

const AYIRAC = ";";

// "=", "@" ya da harfle devam eden "+" / "-" ile başlayan değer Excel'de formül gibi çalışabilir
// (CSV / formül enjeksiyonu); başına ' eklenir. "+90 532..." gibi telefonlar etkilenmez.
const formulOlabilir = (deger: string) => /^[=@\t\r]|^[+-][^\d\s]/.test(deger);

const hucre = (deger: string | number | null | undefined) => {
  let metin = deger === null || deger === undefined ? "" : String(deger);

  if (formulOlabilir(metin)) {
    metin = `'${metin}`;
  }

  // Ayıraç, tırnak ya da satır sonu içeren değer tırnak içine alınır, içteki tırnak ikilenir
  return /[";\r\n]/.test(metin) ? `"${metin.replace(/"/g, '""')}"` : metin;
};

export const csvOlustur = (basliklar: string[], satirlar: (string | number | null)[][]) =>
  "﻿" +
  [basliklar, ...satirlar].map((satir) => satir.map(hucre).join(AYIRAC)).join("\r\n");
