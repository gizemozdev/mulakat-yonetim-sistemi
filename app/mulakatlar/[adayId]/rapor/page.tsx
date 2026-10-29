"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { istekAt } from "../../../../components/istekAt";
import { DurumEtiketi, Durum } from "../../../../components/MulakatKarti";
import { Karar, kararRengi } from "../../../../components/karar";
import {
  Degerlendirme,
  izlenim,
  konularaGoreGrupla,
  teknikTamamlandi,
  yuzdeHesapla,
} from "../../../../components/teknikPuan";

type MulakatOrtak = {
  tarih: string;
  saat: string;
  durum: Durum;
  mulakatci: { adSoyad: string } | null;
};

type Rapor = {
  aday: {
    adSoyad: string;
    yas: number;
    eposta: string;
    telefon: string;
    karar: Karar;
    kararNotu: string;
    pozisyon: { ad: string };
  };
  ik:
  | (MulakatOrtak & {
    genelNot: string;
    ikAkis: { ad: string } | null;
    ikCevaplar: {
      id: number;
      akisAdi: string;
      soruMetni: string;
      secenekMetni: string | null;
      not: string;
    }[];
  })
  | null;
  teknik:
  | (MulakatOrtak & {
    teknikCevaplar: {
      id: number;
      konuAdi: string;
      soruMetni: string;
      degerlendirme: Degerlendirme | null;
    }[];
  })
  | null;
};

const degerlendirmeAdi: Record<Degerlendirme, string> = {
  yeterli: "Yeterli",
  orta: "Orta",
  yetersiz: "Yetersiz",
};

const degerlendirmeRengi: Record<Degerlendirme, string> = {
  yeterli: "text-emerald-700",
  orta: "text-amber-700",
  yetersiz: "text-red-700",
};

// "2026-10-20" -> "20.10.2026"
const tarihGoster = (tarih: string) =>
  tarih ? tarih.split("-").reverse().join(".") : "Belirlenmedi";

const bolumBasligi =
  "mb-3 border-b border-slate-300 pb-1 text-base font-bold uppercase tracking-wide text-slate-800";

// Yazdırılmak (ya da PDF olarak kaydedilmek) üzere hazırlanmış tek sayfalık aday raporu
export default function Rapor() {
  const { adayId } = useParams<{ adayId: string }>();

  const [rapor, setRapor] = useState<Rapor | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    const raporuGetir = async () => {
      const { veri, hata: istekHatasi } = await istekAt(`/api/rapor/${adayId}`, "GET");

      if (istekHatasi) {
        setHata(istekHatasi);
      } else {
        setRapor(veri);
      }
    };

    raporuGetir();
  }, [adayId]);

  if (hata) {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-red-600">{hata}</p>;
  }

  if (!rapor) {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-slate-600">Rapor hazırlanıyor...</p>;
  }

  const { aday, ik, teknik } = rapor;

  // Teknik puan yalnızca tamamlanmış ve bütün soruları değerlendirilmiş mülakatta gösterilir
  const teknikTamam = teknikTamamlandi(teknik?.durum, teknik?.teknikCevaplar);

  const genelYuzde = teknikTamam ? yuzdeHesapla(teknik?.teknikCevaplar ?? []) : 0;

  const bilgiSatirlari = [
    ["Ad Soyad", aday.adSoyad],
    ["Pozisyon", aday.pozisyon.ad],
    ["Yaş", String(aday.yas)],
    ["E-posta", aday.eposta || "-"],
    ["Telefon", aday.telefon || "-"],
  ];

  const mulakatSatirlari = [
    { ad: "İK Mülakatı", mulakat: ik },
    { ad: "Teknik Mülakat", mulakat: teknik },
  ];

  return (
    <main className="mx-auto max-w-[210mm] px-4 py-8 print:max-w-none print:p-0">
      {/* Yazdırırken gizlenen araç çubuğu */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/mulakatlar?aday=${adayId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Mülakatlara dön
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            PDF için yazdırma penceresinde &quot;PDF olarak kaydet&quot;i seçin.
          </span>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-marka px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-marka-koyu"
          >
            <Printer size={18} />
            Yazdır / PDF
          </button>
        </div>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-800 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Başlık */}
        <header className="mb-8 flex items-start justify-between gap-4 border-b-2 border-marka pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Aday Değerlendirme Raporu</h1>
            <p className="mt-1 text-slate-600">Mülakat Yönetim Sistemi</p>
          </div>

          <p className="text-right text-xs text-slate-500">
            Rapor tarihi
            <br />
            <span className="font-medium text-slate-700">
              {new Date().toLocaleDateString("tr-TR")}
            </span>
          </p>
        </header>

        {/* Aday ve mülakat bilgileri */}
        <section className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <h2 className={bolumBasligi}>Aday Bilgileri</h2>

            <dl className="grid grid-cols-[6rem_1fr] gap-y-1.5">
              {bilgiSatirlari.map(([etiket, deger]) => (
                <div key={etiket} className="contents">
                  <dt className="text-slate-500">{etiket}</dt>
                  <dd className="break-all font-medium text-slate-900">{deger}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className={bolumBasligi}>Mülakatlar</h2>

            <div className="space-y-3">
              {mulakatSatirlari.map(({ ad, mulakat }) => (
                <div key={ad}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{ad}</span>
                    <DurumEtiketi durum={mulakat?.durum ?? "Planlanmadı"} yazi={mulakat?.durum ?? "Planlanmadı"} kucuk />
                  </div>

                  <p className="mt-0.5 text-slate-600">
                    {tarihGoster(mulakat?.tarih ?? "")}
                    {mulakat?.tarih && mulakat.saat && `, ${mulakat.saat}`} · {mulakat?.mulakatci?.adSoyad ?? "Mülakatçı atanmadı"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Karar */}
        <section className="mb-8 flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-slate-200 p-4 break-inside-avoid">
          <span className="font-bold uppercase tracking-wide text-slate-800">Karar</span>

          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${kararRengi(aday.karar)}`}>
            {aday.karar}
          </span>

          <p className="w-full whitespace-pre-line text-slate-700 sm:w-auto sm:flex-1">
            {aday.kararNotu || "Gerekçe yazılmadı."}
          </p>
        </section>

        {/* İK */}
        <section className="mb-8">
          <h2 className={bolumBasligi}>İK Mülakatı</h2>

          {!ik || ik.ikCevaplar.length === 0 ? (
            <p className="text-slate-500">İK mülakatı yapılmadı.</p>
          ) : (
            <>
              <p className="mb-3 text-slate-600">
                {ik.ikAkis ? `${ik.ikAkis.ad} akışı` : "Yalnızca genel sorular"} ·{" "}
                {ik.ikCevaplar.length} soru cevaplandı
                {ik.durum !== "Tamamlandı" && " · mülakat tamamlanmadı"}
              </p>

              <ol className="space-y-2.5">
                {ik.ikCevaplar.map((cevap, sira) => (
                  <li key={cevap.id} className="break-inside-avoid">
                    {/* Akış değiştiğinde (genel → pozisyon akışı) ara başlık */}
                    {(sira === 0 || ik.ikCevaplar[sira - 1].akisAdi !== cevap.akisAdi) && (
                      <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-marka first:mt-0">
                        {cevap.akisAdi}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <span className="w-5 shrink-0 text-right text-slate-400">{sira + 1}.</span>

                      <div className="flex-1">
                        <p className="text-slate-900">{cevap.soruMetni}</p>
                        <p className="mt-0.5">
                          <span className="text-slate-500">Cevap: </span>
                          <span className="font-medium">{cevap.secenekMetni ?? "Devam"}</span>
                        </p>

                        {cevap.not && (
                          <p className="mt-0.5 whitespace-pre-line text-slate-600">
                            <span className="text-slate-500">Not: </span>
                            {cevap.not}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 break-inside-avoid rounded-lg bg-slate-50 p-4 print:border print:border-slate-200 print:bg-white">
                <p className="mb-1 font-semibold text-slate-900">Genel Değerlendirme</p>
                <p className="whitespace-pre-line text-slate-700">
                  {ik.genelNot || "Genel not yazılmadı."}
                </p>
              </div>
            </>
          )}
        </section>

        {/* Teknik */}
        <section className="mb-8 break-inside-avoid-page">
          <h2 className={bolumBasligi}>Teknik Mülakat</h2>

          {!teknik || teknik.teknikCevaplar.length === 0 ? (
            <p className="text-slate-500">Teknik mülakat yapılmadı.</p>
          ) : (
            <>
              {teknikTamam ? (
                <div className="mb-4 flex items-end gap-3">
                  <span className="text-3xl font-bold text-slate-900">%{genelYuzde}</span>
                  <span className="pb-1 font-medium text-slate-700">{izlenim(genelYuzde)}</span>
                  <span className="pb-1 text-xs text-slate-500">
                    (Puan bir fikir verir, işe alım kararı değildir.)
                  </span>
                </div>
              ) : (
                <p className="mb-4 text-amber-700">
                  Teknik mülakat tamamlanmadığı için genel puan hesaplanmadı.
                </p>
              )}

              <table className="mb-5 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-xs uppercase text-slate-500">
                    <th className="py-1.5 font-semibold">Konu</th>
                    <th className="py-1.5 text-center font-semibold">Soru</th>
                    <th className="py-1.5 text-center font-semibold">Yeterli</th>
                    <th className="py-1.5 text-center font-semibold">Orta</th>
                    <th className="py-1.5 text-center font-semibold">Yetersiz</th>
                    <th className="py-1.5 text-right font-semibold">Puan</th>
                  </tr>
                </thead>

                <tbody>
                  {konularaGoreGrupla(teknik.teknikCevaplar).map(([konu, cevaplar]) => {
                    const say = (deger: Degerlendirme) =>
                      cevaplar.filter((cevap) => cevap.degerlendirme === deger).length;

                    return (
                      <tr key={konu} className="border-b border-slate-100">
                        <td className="py-1.5 font-medium capitalize text-slate-900">{konu}</td>
                        <td className="py-1.5 text-center">{cevaplar.length}</td>
                        <td className="py-1.5 text-center">{say("yeterli")}</td>
                        <td className="py-1.5 text-center">{say("orta")}</td>
                        <td className="py-1.5 text-center">{say("yetersiz")}</td>
                        <td className="py-1.5 text-right font-medium">%{yuzdeHesapla(cevaplar)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <ol className="space-y-1.5">
                {teknik.teknikCevaplar.map((cevap, sira) => (
                  <li key={cevap.id} className="flex gap-3">
                    <span className="w-5 shrink-0 text-right text-slate-400">{sira + 1}.</span>

                    <span className="flex-1">
                      {cevap.soruMetni}
                      <span className="ml-1 text-xs text-slate-500">({cevap.konuAdi})</span>
                    </span>

                    <span
                      className={`w-16 shrink-0 text-right font-medium ${cevap.degerlendirme ? degerlendirmeRengi[cevap.degerlendirme] : "text-slate-400"}`}
                    >
                      {cevap.degerlendirme ? degerlendirmeAdi[cevap.degerlendirme] : "-"}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <footer className="border-t border-slate-200 pt-3 text-xs text-slate-400">
          Bu rapor Mülakat Yönetim Sistemi tarafından oluşturulmuştur. Teknik puan
          değerlendirmelere dayanan bir göstergedir; işe alım kararı mülakatçılara aittir.
        </footer>
      </article>
    </main>
  );
}
