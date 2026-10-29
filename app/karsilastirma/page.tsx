"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, ReactNode, Suspense, useEffect, useState } from "react";
import { ArrowLeft, Columns3, Trophy } from "lucide-react";
import { useAdaylar } from "../context/AdayContext";
import BosDurum from "../../components/BosDurum";
import { KararEtiketi } from "../../components/KararKarti";
import { DurumEtiketi } from "../../components/MulakatKarti";
import { kayitBul, MulakatKaydi, mulakatKayitlariniGetir } from "../../components/mulakatKayitlari";
import { stiller } from "../../components/stiller";
import { konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from "../../components/teknikPuan";

const satirBasligi = "sticky left-0 bg-white py-3 pr-4 text-left text-sm font-medium text-slate-600";

// Sayısal satırdaki en yüksek değer kalın ve kupa ikonuyla (renge tek başına güvenmeden) gösterilir
function PuanHucresi({ deger, enYuksek }: { deger: number | null; enYuksek: boolean }) {
  if (deger === null) return <span className="text-slate-400">-</span>;

  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${enYuksek ? "font-bold text-slate-900" : "text-slate-700"}`}>
      {enYuksek && <Trophy size={14} className="text-amber-500" aria-label="En yüksek" />}%{deger}
    </span>
  );
}

function KarsilastirmaIcerigi() {
  const { adaylar, yukleniyor: adaylarYukleniyor } = useAdaylar();
  const router = useRouter();

  // İstatistiklerden "?pozisyon=3" ile gelinirse o pozisyon seçili açılır
  const adrestekiPozisyon = useSearchParams().get("pozisyon") ?? "";
  const [pozisyonId, setPozisyonId] = useState(adrestekiPozisyon);

  const [kayitlar, setKayitlar] = useState<MulakatKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  useEffect(() => {
    const kayitlariGetir = async () => {
      const sonuc = await mulakatKayitlariniGetir();

      setHata(sonuc.hata);
      setKayitlar(sonuc.kayitlar);
      setYukleniyor(false);
    };

    kayitlariGetir();
  }, []);

  const pozisyonSec = (yeniId: string) => {
    setPozisyonId(yeniId);
    // Adres de güncellenir; sayfa yenilenince ya da bağlantı paylaşılınca aynı pozisyon açılır
    router.replace(yeniId ? `/karsilastirma?pozisyon=${yeniId}` : "/karsilastirma");
  };

  const pozisyonlar = [
    ...new Map(adaylar.map((aday) => [aday.pozisyon.id, aday.pozisyon])).values(),
  ].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  const pozisyonAdaylari = adaylar
    .filter((aday) => String(aday.pozisyon.id) === pozisyonId)
    .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));

  // Puanlar yalnızca tamamlanmış teknik mülakatlardan
  const tamamTeknik = (adayId: number) => {
    const kayit = kayitBul(kayitlar, adayId, "teknik");

    return kayit && teknikTamamlandi(kayit.durum, kayit.teknikCevaplar) ? kayit.teknikCevaplar : null;
  };

  // Adaylardan herhangi birine sorulmuş bütün konular, ilk görüldükleri sırayla
  const konular = konularaGoreGrupla(
    pozisyonAdaylari.flatMap((aday) => tamamTeknik(aday.id) ?? [])
  ).map(([konu]) => konu);

  const konuYuzdesi = (adayId: number, konu: string) => {
    const cevaplar = (tamamTeknik(adayId) ?? []).filter((cevap) => cevap.konuAdi === konu);
    return cevaplar.length ? yuzdeHesapla(cevaplar) : null;
  };

  // Puan satırı: her aday için değer + satırdaki en yüksek değer (tek değer varsa vurgulanmaz)
  const puanSatiri = (baslik: ReactNode, degerOku: (adayId: number) => number | null) => {
    const degerler = pozisyonAdaylari.map((aday) => degerOku(aday.id));
    const sayilar = degerler.filter((deger): deger is number => deger !== null);
    const enYuksek = sayilar.length > 1 ? Math.max(...sayilar) : null;

    return (
      <tr className="border-b border-slate-100">
        <th scope="row" className={satirBasligi}>{baslik}</th>
        {degerler.map((deger, sira) => (
          <td key={pozisyonAdaylari[sira].id} className="px-3 py-3 text-sm">
            <PuanHucresi deger={deger} enYuksek={deger !== null && deger === enYuksek} />
          </td>
        ))}
      </tr>
    );
  };

  if (yukleniyor || adaylarYukleniyor) {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-slate-600">Yükleniyor...</p>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/istatistikler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-marka"
      >
        <ArrowLeft size={16} />
        İstatistiklere dön
      </Link>

      <div className={`mt-4 ${stiller.sayfaUstu}`}>
        <div>
          <h1 className={stiller.sayfaBasligi}>Aday Karşılaştırma</h1>
          <p className="mt-2 text-slate-600">
            Aynı pozisyondaki adayların mülakat sonuçları yan yana. Puan karar değil, fikir verir.
          </p>
        </div>

        <select
          value={pozisyonId}
          onChange={(e) => pozisyonSec(e.target.value)}
          aria-label="Karşılaştırılacak pozisyon"
          className={stiller.suzmeSecimi}
        >
          <option value="">Pozisyon seçin</option>

          {pozisyonlar.map((pozisyon) => (
            <option key={pozisyon.id} value={pozisyon.id}>
              {pozisyon.ad}
            </option>
          ))}
        </select>
      </div>

      {hata && <p className="mt-6 text-red-600">{hata}</p>}

      <div className="mt-8">
        {!pozisyonId ? (
          <BosDurum ikon={<Columns3 size={24} />} mesaj="Karşılaştırmak için bir pozisyon seçin." />
        ) : pozisyonAdaylari.length === 0 ? (
          <BosDurum ikon={<Columns3 size={24} />} mesaj="Bu pozisyonda aday bulunmuyor." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={satirBasligi}>
                    <span className="sr-only">Ölçüt</span>
                  </th>

                  {pozisyonAdaylari.map((aday) => (
                    <th key={aday.id} scope="col" className="min-w-36 px-3 py-3 text-left align-bottom">
                      <Link
                        href={`/mulakatlar?aday=${aday.id}`}
                        className="font-semibold text-slate-900 hover:text-marka"
                      >
                        {aday.adSoyad}
                      </Link>

                      <Link
                        href={`/mulakatlar/${aday.id}/rapor`}
                        className="mt-0.5 block text-xs font-normal text-marka hover:underline"
                      >
                        Raporu aç
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-slate-100">
                  <th scope="row" className={satirBasligi}>Karar</th>
                  {pozisyonAdaylari.map((aday) => (
                    <td key={aday.id} className="px-3 py-3">
                      <KararEtiketi karar={aday.karar} />
                    </td>
                  ))}
                </tr>

                {(["ik", "teknik"] as const).map((tur) => (
                  <tr key={tur} className="border-b border-slate-100">
                    <th scope="row" className={satirBasligi}>
                      {tur === "ik" ? "İK mülakatı" : "Teknik mülakat"}
                    </th>
                    {pozisyonAdaylari.map((aday) => {
                      const durum = kayitBul(kayitlar, aday.id, tur)?.durum ?? "Planlanmadı";

                      return (
                        <td key={aday.id} className="px-3 py-3">
                          <DurumEtiketi durum={durum} yazi={durum} kucuk />
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {puanSatiri(
                  <span className="font-semibold text-slate-900">Genel teknik puan</span>,
                  (adayId) => {
                    const cevaplar = tamamTeknik(adayId);
                    return cevaplar ? yuzdeHesapla(cevaplar) : null;
                  }
                )}

                {konular.map((konu) => (
                  <Fragment key={konu}>
                    {puanSatiri(
                      <span className="pl-3 capitalize">{konu}</span>,
                      (adayId) => konuYuzdesi(adayId, konu)
                    )}
                  </Fragment>
                ))}

                <tr>
                  <th scope="row" className={satirBasligi}>Sorulan teknik soru</th>
                  {pozisyonAdaylari.map((aday) => (
                    <td key={aday.id} className="px-3 py-3 text-sm tabular-nums text-slate-700">
                      {kayitBul(kayitlar, aday.id, "teknik")?.teknikCevaplar.length ?? 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <p className="mt-4 text-xs text-slate-500">
              Puanlar yalnızca tamamlanmış ve bütün soruları değerlendirilmiş teknik mülakatlardan
              hesaplanır; &quot;-&quot; o adaya bu konunun sorulmadığını ya da mülakatın bitmediğini gösterir.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// useSearchParams derlemede bir Suspense sınırı ister (node_modules/next/dist/docs: use-search-params)
export default function Karsilastirma() {
  return (
    <Suspense>
      <KarsilastirmaIcerigi />
    </Suspense>
  );
}
