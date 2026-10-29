// İK soru akışı ekranlarında ortak kullanılan tipler ve yardımcılar

export type IkSecenek = {
  id: number;
  soruId: number;
  metin: string;
  sonrakiSoruId: number | null;
};

export type IkSoru = {
  id: number;
  akisId: number;
  metin: string;
  secenekler: IkSecenek[];
};

export type IkAkis = {
  id: number;
  ad: string;
  genel: boolean;
  ilkSoruId: number | null;
  pozisyonlar: { id: number; ad: string }[];
  sorular: IkSoru[];
};

// Uzun soru metinlerini açılır listelerde ve uyarılarda kısaltır
export const kisalt = (metin: string, uzunluk = 45) =>
  metin.length > uzunluk ? `${metin.slice(0, uzunluk).trimEnd()}…` : metin;

// Akışta mülakatı takıltacak sorunları bulur
export const akisUyarilari = (akis: IkAkis) => {
  const uyarilar: string[] = [];

  if (akis.sorular.length === 0) return uyarilar;

  if (akis.ilkSoruId === null) {
    uyarilar.push("İlk soru seçilmemiş; mülakat bu akışta hiçbir soruyla başlayamaz.");
  } else {
    // İlk sorudan başlayıp seçenekleri izleyerek ulaşılabilen soruları bul
    const ulasilan = new Set<number>();
    const gidilecekler = [akis.ilkSoruId];

    while (gidilecekler.length > 0) {
      const soruId = gidilecekler.pop() as number;

      if (ulasilan.has(soruId)) continue;
      ulasilan.add(soruId);

      akis.sorular
        .find((soru) => soru.id === soruId)
        ?.secenekler.forEach((secenek) => {
          if (secenek.sonrakiSoruId !== null) gidilecekler.push(secenek.sonrakiSoruId);
        });
    }

    akis.sorular
      .filter((soru) => !ulasilan.has(soru.id))
      .forEach((soru) =>
        uyarilar.push(`"${kisalt(soru.metin)}" sorusuna hiçbir seçenekten ulaşılamıyor.`)
      );
  }

  akis.sorular
    .filter((soru) => soru.secenekler.length === 0)
    .forEach((soru) =>
      uyarilar.push(`"${kisalt(soru.metin)}" sorusunun hiç seçeneği yok; mülakat bu soruda ilerleyemez.`)
    );

  return uyarilar;
};
