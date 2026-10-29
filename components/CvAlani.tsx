"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

const EN_FAZLA_BOYUT = 5 * 1024 * 1024;

// 245760 -> "240 KB", 1572864 -> "1,5 MB"
export const boyutGoster = (bayt: number) =>
  bayt < 1024 * 1024
    ? `${Math.max(1, Math.round(bayt / 1024))} KB`
    : `${(bayt / (1024 * 1024)).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`;

type CvAlaniProps = {
  adayId: number;
  cv: { dosyaAdi: string; boyut: number } | null;
  onYukle: (dosya: File) => Promise<string | null>;
  onSil: () => Promise<string | null>;
};

// Aday kartındaki CV satırı: varsa açma bağlantısı + kaldırma, yoksa yükleme düğmesi
export default function CvAlani({ adayId, cv, onYukle, onSil }: CvAlaniProps) {
  const dosyaSecici = useRef<HTMLInputElement>(null);
  const [isleniyor, setIsleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const dosyaSecildi = async (dosya: File | undefined) => {
    // Aynı dosya yeniden seçilebilsin diye seçim temizlenir
    if (dosyaSecici.current) dosyaSecici.current.value = "";

    if (!dosya) return;

    // Sunucu da denetliyor; burada boşuna büyük dosya gönderilmesin diye önceden uyarılır
    if (dosya.type !== "application/pdf") {
      setHata("Yalnızca PDF dosyası yüklenebilir.");
      return;
    }

    if (dosya.size > EN_FAZLA_BOYUT) {
      setHata("CV en fazla 5 MB olabilir.");
      return;
    }

    setIsleniyor(true);
    setHata((await onYukle(dosya)) ?? "");
    setIsleniyor(false);
  };

  const sil = async () => {
    setIsleniyor(true);
    setHata((await onSil()) ?? "");
    setIsleniyor(false);
  };

  return (
    <div className="mt-2 text-sm">
      <input
        ref={dosyaSecici}
        type="file"
        accept="application/pdf"
        onChange={(e) => dosyaSecildi(e.target.files?.[0])}
        className="hidden"
      />

      {cv ? (
        <span className="inline-flex flex-wrap items-center gap-2">
          <a
            href={`/api/adaylar/${adayId}/cv`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-marka hover:underline"
          >
            <FileText size={14} />
            CV
          </a>

          <span className="max-w-48 truncate text-slate-500" title={cv.dosyaAdi}>
            {cv.dosyaAdi} · {boyutGoster(cv.boyut)}
          </span>

          <button
            onClick={() => dosyaSecici.current?.click()}
            disabled={isleniyor}
            className="text-xs text-slate-500 hover:text-slate-800 hover:underline disabled:opacity-50"
          >
            Değiştir
          </button>

          <button
            onClick={sil}
            disabled={isleniyor}
            title="CV'yi kaldır"
            aria-label="CV'yi kaldır"
            className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </span>
      ) : (
        <button
          onClick={() => dosyaSecici.current?.click()}
          disabled={isleniyor}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-marka disabled:opacity-50"
        >
          <Upload size={14} />
          {isleniyor ? "Yükleniyor..." : "CV yükle (PDF)"}
        </button>
      )}

      {hata && <p className="mt-1 text-red-600">{hata}</p>}
    </div>
  );
}
