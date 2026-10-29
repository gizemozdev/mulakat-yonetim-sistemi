// Teknik mülakat puanı: teknik mülakat sayfası ve Mülakatlar sayfasındaki özet ortak kullanır

export type Degerlendirme = "yeterli" | "orta" | "yetersiz";

// Yeterli 2, Orta 1, Yetersiz 0 puan; sonuç yüzde olarak verilir
const puanlar: Record<Degerlendirme, number> = { yeterli: 2, orta: 1, yetersiz: 0 };

export const yuzdeHesapla = (liste: { degerlendirme: Degerlendirme | null }[]) => {
  if (liste.length === 0) return 0;

  const toplam = liste.reduce(
    (puan, cevap) => puan + (cevap.degerlendirme ? puanlar[cevap.degerlendirme] : 0),
    0
  );

  return Math.round((toplam / (liste.length * 2)) * 100);
};

// Puan yalnızca durumu "Tamamlandı" olan ve bütün soruları değerlendirilmiş mülakatta anlamlı
export const teknikTamamlandi = (
  durum: string | undefined,
  cevaplar: { degerlendirme: Degerlendirme | null }[] | undefined
) =>
  durum === "Tamamlandı" &&
  (cevaplar?.length ?? 0) > 0 &&
  (cevaplar ?? []).every((cevap) => cevap.degerlendirme);

export const izlenim = (yuzde: number) =>
  yuzde >= 75 ? "Güçlü" : yuzde >= 50 ? "Orta düzey" : "Gelişmeye açık";

export const izlenimRengi = (yuzde: number) =>
  yuzde >= 75 ? "bg-emerald-500" : yuzde >= 50 ? "bg-amber-500" : "bg-red-500";

// Cevapları konu adına göre gruplar; konular ilk soruldukları sırayla gelir
export const konularaGoreGrupla = <T extends { konuAdi: string }>(cevaplar: T[]) =>
  Object.entries(
    cevaplar.reduce<Record<string, T[]>>((gruplar, cevap) => {
      gruplar[cevap.konuAdi] = [...(gruplar[cevap.konuAdi] || []), cevap];
      return gruplar;
    }, {})
  );
