import { CornerDownRight, Flag } from "lucide-react";
import { IkAkis, IkSoru, kisalt } from "./ikAkisTipleri";

type DugumProps = {
  soru: IkSoru;
  akis: IkAkis;
  yol: number[];
};

// Bir soruyu ve seçeneklerinin götürdüğü soruları iç içe çizer
function SoruDugumu({ soru, akis, yol }: DugumProps) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-900">{kisalt(soru.metin, 60)}</p>

      {soru.secenekler.length === 0 ? (
        <p className="mt-1 text-xs text-amber-600">Seçenek yok</p>
      ) : (
        <ul className="mt-1.5 space-y-2 border-l-2 border-slate-200 pl-3">
          {soru.secenekler.map((secenek) => {
            const sonraki = akis.sorular.find((s) => s.id === secenek.sonrakiSoruId);

            return (
              <li key={secenek.id}>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CornerDownRight size={12} />
                  <span className="rounded bg-marka-acik px-1.5 py-0.5 font-medium text-marka">
                    {secenek.metin}
                  </span>
                </p>

                <div className="mt-1.5 pl-4">
                  {!sonraki ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <Flag size={12} />
                      Akış biter
                    </p>
                  ) : yol.includes(sonraki.id) ? (
                    // Sunucu döngüye izin vermez; bu yalnızca bir güvenlik önlemi
                    <p className="text-xs text-red-600">Döngü</p>
                  ) : (
                    <SoruDugumu soru={sonraki} akis={akis} yol={[...yol, sonraki.id]} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Akışı ilk sorudan başlayarak girintili bir ağaç olarak gösteren salt okunur önizleme
export default function AkisAgaci({ akis }: { akis: IkAkis }) {
  const ilkSoru = akis.sorular.find((soru) => soru.id === akis.ilkSoruId);

  if (!ilkSoru) {
    return (
      <p className="text-sm text-slate-500">
        Önizleme için akışa soru ekleyin ve bir ilk soru seçin.
      </p>
    );
  }

  return <SoruDugumu soru={ilkSoru} akis={akis} yol={[ilkSoru.id]} />;
}
