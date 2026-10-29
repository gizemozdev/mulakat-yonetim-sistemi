import Link from "next/link";
import { ArrowRight, ClipboardCheck, Info, MessagesSquare } from "lucide-react";
import {
  Degerlendirme,
  izlenim,
  izlenimRengi,
  konularaGoreGrupla,
  yuzdeHesapla,
} from "./teknikPuan";

export type TeknikSonuc = {
  konuAdi: string;
  degerlendirme: Degerlendirme | null;
}[];

export type IkSonuc = {
  akisAdi: string | null;
  cevapSayisi: number;
  genelNot: string;
};

type SonucOzetiProps = {
  adayId: number;
  teknik: TeknikSonuc | null;
  ik: IkSonuc | null;
};

const bolumBasligi = "flex items-center gap-2 font-semibold text-slate-900";
const tamSonucBaglantisi =
  "mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-marka hover:underline";

// Adayın tamamlanmış teknik ve İK mülakatlarının kısa özeti; null olan bölüm "tamamlanmadı" gösterir
export default function SonucOzeti({ adayId, teknik, ik }: SonucOzetiProps) {
  const genelYuzde = teknik ? yuzdeHesapla(teknik) : 0;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Sonuç Özeti</h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* İK */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className={bolumBasligi}>
            <MessagesSquare size={18} className="text-marka" />
            İK Mülakatı
          </p>

          {ik ? (
            <>
              <p className="mt-3 text-sm text-slate-600">
                {ik.akisAdi ? `${ik.akisAdi} akışı` : "Yalnızca genel sorular"} ·{" "}
                {ik.cevapSayisi} soru cevaplandı
              </p>

              <p className="mt-3 text-sm font-medium text-slate-500">Genel değerlendirme</p>
              <p className="mt-1 line-clamp-4 whitespace-pre-line text-slate-800">
                {ik.genelNot || "Genel not yazılmadı."}
              </p>

              <Link href={`/mulakatlar/${adayId}/ik`} className={tamSonucBaglantisi}>
                Cevapları gör
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">İK mülakatı henüz tamamlanmadı.</p>
          )}
        </div>

        {/* Teknik */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className={bolumBasligi}>
            <ClipboardCheck size={18} className="text-marka" />
            Teknik Mülakat
          </p>

          {teknik ? (
            <>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">%{genelYuzde}</span>
                <span className="pb-1 font-medium text-slate-700">{izlenim(genelYuzde)}</span>
              </div>

              <div className="mt-3 space-y-2">
                {konularaGoreGrupla(teknik).map(([konuAdi, liste]) => {
                  const yuzde = yuzdeHesapla(liste);

                  return (
                    <div key={konuAdi}>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{konuAdi}</span>
                        <span>%{yuzde}</span>
                      </div>

                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${izlenimRengi(yuzde)}`}
                          style={{ width: `${yuzde}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                <Info size={14} className="mt-0.5 shrink-0" />
                Puan işe alım kararı değildir, fikir vermek içindir.
              </p>

              <Link href={`/mulakatlar/${adayId}/teknik`} className={tamSonucBaglantisi}>
                Tam sonucu gör
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Teknik mülakat henüz tamamlanmadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
