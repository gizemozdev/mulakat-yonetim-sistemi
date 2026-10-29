"use client";

import { useState } from "react";
import { Gavel } from "lucide-react";
import { Karar, kararlar, kararRengi } from "./karar";

// Aday kartlarında ve listede kararı gösteren küçük etiket
export function KararEtiketi({ karar }: { karar: Karar }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${kararRengi(karar)}`}>
      {karar}
    </span>
  );
}

type KararKartiProps = {
  karar: Karar;
  kararNotu: string;
  onKaydet: (karar: Karar, kararNotu: string) => Promise<string | null>;
};

// Mülakatlar sayfasında seçili adayın kararı: seçim hemen, not alandan çıkınca kaydedilir.
// Aday değişince yeni değerlerle başlasın diye kullanan yer key={aday.id} verir.
export default function KararKarti({ karar, kararNotu, onKaydet }: KararKartiProps) {
  const [not, setNot] = useState(kararNotu);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");

  const kaydet = async (yeniKarar: Karar, yeniNot: string) => {
    setHata("");
    setBilgi("Kaydediliyor...");

    const sunucuHatasi = await onKaydet(yeniKarar, yeniNot);

    if (sunucuHatasi) {
      setHata(sunucuHatasi);
      setBilgi("");
    } else {
      setBilgi("Kaydedildi");
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Gavel size={18} className="text-marka" />
          Karar
        </h3>

        {bilgi && <span className="text-xs text-slate-500">{bilgi}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[14rem_1fr]">
        <div>
          <label htmlFor="karar" className="mb-1 block text-sm font-medium text-slate-800">
            Sonuç
          </label>

          <select
            id="karar"
            value={karar}
            onChange={(e) => kaydet(e.target.value as Karar, not)}
            className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium outline-none focus:border-marka focus:ring-2 focus:ring-marka/20 ${kararRengi(karar)}`}
          >
            {kararlar.map((secenek) => (
              <option key={secenek} value={secenek} className="bg-white text-slate-900">
                {secenek}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="kararNotu" className="mb-1 block text-sm font-medium text-slate-800">
            Gerekçe
          </label>

          <textarea
            id="kararNotu"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            onBlur={() => not.trim() !== kararNotu && kaydet(karar, not)}
            rows={2}
            placeholder="Kararın kısa gerekçesi (ör. teknik olarak güçlü, maaş beklentisi uyuşmadı)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
          />
        </div>
      </div>

      {hata && <p className="mt-2 text-sm text-red-600">{hata}</p>}
    </div>
  );
}
