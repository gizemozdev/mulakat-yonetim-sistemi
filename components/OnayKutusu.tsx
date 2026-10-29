"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

type OnayKutusuProps = {
  acik: boolean;
  baslik: string;
  mesaj: string;
  onayYazisi?: string;
  onOnayla: () => void;
  onVazgec: () => void;
};

// Silme gibi geri alınamayan işlemlerden önce gösterilen onay penceresi
export default function OnayKutusu({
  acik,
  baslik,
  mesaj,
  onayYazisi = "Sil",
  onOnayla,
  onVazgec,
}: OnayKutusuProps) {
  // Kutu açıkken Esc tuşu vazgeçme işlevi görür
  useEffect(() => {
    if (!acik) return;

    const tusaBasildi = (e: KeyboardEvent) => {
      if (e.key === "Escape") onVazgec();
    };

    window.addEventListener("keydown", tusaBasildi);

    return () => window.removeEventListener("keydown", tusaBasildi);
  }, [acik, onVazgec]);

  if (!acik) return null;

  return (
    <div
      onClick={onVazgec}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <TriangleAlert size={20} />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {baslik}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {mesaj}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onVazgec}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Vazgeç
          </button>

          <button
            onClick={onOnayla}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {onayYazisi}
          </button>
        </div>
      </div>
    </div>
  );
}
