"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";

// Türkçe harflere uygun, büyük / küçük harf duyarsız arama ("ELİF" içinde "elif" bulunur)
export const metinIceriyor = (metin: string, aranan: string) =>
  metin.toLocaleLowerCase("tr").includes(aranan.trim().toLocaleLowerCase("tr"));

type AramaCubuguProps = {
  arama: string;
  onAramaDegistir: (arama: string) => void;
  yerTutucu: string;
  gosterilen: number;
  toplam: number;
  onTemizle: () => void;
  // Arama kutusunun yanındaki süzme seçimleri
  children?: ReactNode;
};

// Liste sayfalarının üstündeki arama kutusu + süzme seçimleri + sonuç sayısı
export default function AramaCubugu({
  arama,
  onAramaDegistir,
  yerTutucu,
  gosterilen,
  toplam,
  onTemizle,
  children,
}: AramaCubuguProps) {
  const suzuluyor = gosterilen !== toplam;

  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={arama}
            onChange={(e) => onAramaDegistir(e.target.value)}
            placeholder={yerTutucu}
            aria-label={yerTutucu}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
          />
        </div>

        {children}
      </div>

      {suzuluyor && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          <span>
            {toplam} adaydan {gosterilen} tanesi gösteriliyor
          </span>

          <button
            onClick={onTemizle}
            className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-marka hover:underline"
          >
            <X size={14} />
            Filtreleri temizle
          </button>
        </div>
      )}
    </div>
  );
}
