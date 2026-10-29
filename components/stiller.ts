// Birden fazla sayfada kullanılan ortak Tailwind sınıfları.
// Bir kartın ya da düğmenin görünümü buradan değiştirilince her yerde değişir.
export const stiller = {
  // Sayfa yapısı
  sayfaUstu: "flex flex-wrap items-center justify-between gap-4",
  sayfaBasligi: "text-3xl font-bold tracking-tight text-slate-900",
  bolumBasligi: "mb-4 text-lg font-semibold text-slate-900",

  // Kartlar ve formlar
  kart: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md",
  formPaneli: "mt-8 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
  formBasligi: "mb-6 text-xl font-semibold text-slate-900",
  etiket: "mb-1 block text-sm font-medium text-slate-800",
  // Form girdisi; hata varsa (dolu hata metni ya da true) kırmızı kenarlık
  girdi: (hatali?: string | boolean) =>
    `w-full rounded-lg border px-4 py-3 text-slate-900 placeholder-slate-500 outline-none ${hatali
      ? "border-red-500"
      : "border-slate-400 focus:border-marka focus:ring-2 focus:ring-marka/20"
    }`,

  // Düğmeler
  birincilDugme:
    "inline-flex items-center gap-2 rounded-lg bg-marka px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-marka-koyu",
  ikincilDugme:
    "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50",
  kaydetDugmesi:
    "w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60",
  kucukKaydetDugmesi:
    "rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700",
  vazgecDugmesi: "rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300",
  duzenleDugmesi:
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100",
  silDugmesi:
    "inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50",
  ikonDugmesi: "rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800",
  ikonSilDugmesi: "rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600",

  // Kart içinde yerinde düzenleme alanları
  duzenlemeGirdisi:
    "flex-1 rounded-lg border border-slate-400 px-4 py-2 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20",
  // Liste üstündeki süzme seçimleri (AramaCubugu yanında)
  suzmeSecimi:
    "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20",
  duzenlemeSecimi:
    "rounded-lg border border-slate-400 px-4 py-2 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20",
};
