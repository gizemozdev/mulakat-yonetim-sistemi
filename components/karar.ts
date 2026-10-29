// Aday kararı: API doğrulaması, karar kartı, aday etiketi, süzgeç ve rapor ortak kullanır

export const kararlar = [
  "Değerlendiriliyor",
  "Beklemede",
  "Teklif verildi",
  "İşe alındı",
  "Reddedildi",
] as const;

export type Karar = (typeof kararlar)[number];

export const VARSAYILAN_KARAR: Karar = "Değerlendiriliyor";

export const kararRengi = (karar: Karar) => {
  switch (karar) {
    case "Değerlendiriliyor":
      return "bg-slate-100 text-slate-700";

    case "Beklemede":
      return "bg-amber-100 text-amber-800";

    case "Teklif verildi":
      return "bg-sky-100 text-sky-800";

    case "İşe alındı":
      return "bg-emerald-100 text-emerald-800";

    case "Reddedildi":
      return "bg-red-100 text-red-700";
  }
};
