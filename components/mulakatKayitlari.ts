import { istekAt } from "./istekAt";
import { Durum } from "./MulakatKarti";
import { Degerlendirme } from "./teknikPuan";

// /api/mulakatlar'dan gelen kaydın istatistik ve karşılaştırma sayfalarının kullandığı kısmı
export type MulakatKaydi = {
  id: number;
  adayId: number;
  tur: "ik" | "teknik";
  durum: Durum;
  teknikCevaplar: { konuAdi: string; degerlendirme: Degerlendirme | null }[];
};

export const mulakatKayitlariniGetir = async () => {
  const { veri, hata } = await istekAt("/api/mulakatlar", "GET");

  return { hata, kayitlar: (veri ?? []) as MulakatKaydi[] };
};

// Adayın İK ya da teknik kaydı; hiç kaydı yoksa undefined (durumu "Planlanmadı" sayılır)
export const kayitBul = (kayitlar: MulakatKaydi[], adayId: number, tur: "ik" | "teknik") =>
  kayitlar.find((kayit) => kayit.adayId === adayId && kayit.tur === tur);
