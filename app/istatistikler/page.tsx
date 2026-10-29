"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { BarChart3, Columns3 } from "lucide-react";
import { useAdaylar } from "../context/AdayContext";
import BosDurum from "../../components/BosDurum";
import { KararEtiketi } from "../../components/KararKarti";
import { kararlar } from "../../components/karar";
import { Durum } from "../../components/MulakatKarti";
import { kayitBul, MulakatKaydi, mulakatKayitlariniGetir } from "../../components/mulakatKayitlari";
import { stiller } from "../../components/stiller";
import { konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from "../../components/teknikPuan";

const durumlar: Durum[] = ["Planlanmadı", "Planlandı", "Tamamlandı", "İptal"];

const tabloBasligi = "py-2 text-xs font-semibold uppercase tracking-wide text-slate-500";

// Tek renkli yatay çubuk satırı: etiket, oran kadar dolu çubuk ve değer yazısı
function CubukSatiri({
  etiket,
  oran,
  deger,
  aciklama,
}: {
  etiket: ReactNode;
  oran: number;
  deger: string;
  aciklama: string;
}) {
  return (
    <div title={aciklama} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-3 sm:grid-cols-[13rem_1fr_4rem]">
      <div className="truncate text-sm text-slate-700">{etiket}</div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-marka"
          style={{ width: `${Math.max(oran * 100, oran > 0 ? 2 : 0)}%` }}
        />
      </div>

      <span className="text-right text-sm font-semibold tabular-nums text-slate-900">{deger}</span>
    </div>
  );
}

// Adaylar, mülakat durumları, kararlar ve teknik konular üzerine özet sayılar
export default function Istatistikler() {
  const { adaylar, yukleniyor: adaylarYukleniyor } = useAdaylar();

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

  if (yukleniyor || adaylarYukleniyor) {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-slate-600">İstatistikler hazırlanıyor...</p>;
  }

  // Kaydı olmayan mülakat "Planlanmadı" sayılır (Mülakatlar sayfasındaki varsayılanla aynı)
  const durumu = (adayId: number, tur: "ik" | "teknik") =>
    kayitBul(kayitlar, adayId, tur)?.durum ?? "Planlanmadı";

  // Puanı anlamlı olan (tamamlanmış ve hepsi değerlendirilmiş) teknik mülakatların yüzdeleri
  const teknikYuzdesi = (adayId: number) => {
    const kayit = kayitBul(kayitlar, adayId, "teknik");

    return kayit && teknikTamamlandi(kayit.durum, kayit.teknikCevaplar)
      ? yuzdeHesapla(kayit.teknikCevaplar)
      : null;
  };

  const ortalama = (sayilar: number[]) =>
    sayilar.length ? Math.round(sayilar.reduce((a, b) => a + b, 0) / sayilar.length) : null;

  const teknikYuzdeleri = adaylar
    .map((aday) => teknikYuzdesi(aday.id))
    .filter((yuzde): yuzde is number => yuzde !== null);

  const tamamlananMulakat = kayitlar.filter((kayit) => kayit.durum === "Tamamlandı").length;

  const kararSayilari = kararlar.map((karar) => ({
    karar,
    sayi: adaylar.filter((aday) => aday.karar === karar).length,
  }));
  const enCokKarar = Math.max(...kararSayilari.map((satir) => satir.sayi), 1);

  // Pozisyonlar adaylardan çıkarılır (adayı olmayan pozisyon istatistikte anlamsız)
  const pozisyonlar = [
    ...new Map(adaylar.map((aday) => [aday.pozisyon.id, aday.pozisyon])).values(),
  ].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  // Bütün teknik cevaplar konu konu; en düşük yüzde en üstte (en çok zorlanılan konu)
  const konuSonuclari = konularaGoreGrupla(
    kayitlar.flatMap((kayit) => kayit.teknikCevaplar.filter((cevap) => cevap.degerlendirme))
  )
    .map(([konu, cevaplar]) => ({ konu, soru: cevaplar.length, yuzde: yuzdeHesapla(cevaplar) }))
    .sort((a, b) => a.yuzde - b.yuzde || a.konu.localeCompare(b.konu, "tr"));

  const ozetler = [
    { ad: "Toplam aday", deger: String(adaylar.length) },
    { ad: "Tamamlanan mülakat", deger: String(tamamlananMulakat) },
    {
      ad: "Ortalama teknik puan",
      deger: ortalama(teknikYuzdeleri) === null ? "-" : `%${ortalama(teknikYuzdeleri)}`,
    },
    {
      ad: "Teklif verilen / işe alınan",
      deger: String(
        adaylar.filter((aday) => aday.karar === "Teklif verildi" || aday.karar === "İşe alındı").length
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className={stiller.sayfaBasligi}>İstatistikler</h1>

      <p className="mt-2 text-slate-600">
        Adayların, mülakatların ve teknik konuların genel durumu. Teknik puanlar yalnızca
        tamamlanmış mülakatlardan hesaplanır ve karar değil, fikir verir.
      </p>

      {hata && <p className="mt-6 text-red-600">{hata}</p>}

      {adaylar.length === 0 ? (
        <div className="mt-10">
          <BosDurum ikon={<BarChart3 size={24} />} mesaj="İstatistik için henüz aday bulunmuyor." />
        </div>
      ) : (
        <>
          {/* Özet sayılar */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ozetler.map((ozet) => (
              <div key={ozet.ad} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-bold tabular-nums text-slate-900">{ozet.deger}</p>
                <p className="mt-1 text-sm text-slate-600">{ozet.ad}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Karar dağılımı */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className={stiller.bolumBasligi}>Karar dağılımı</h2>

              <div className="space-y-3">
                {kararSayilari.map(({ karar, sayi }) => (
                  <CubukSatiri
                    key={karar}
                    etiket={<KararEtiketi karar={karar} />}
                    oran={sayi / enCokKarar}
                    deger={String(sayi)}
                    aciklama={`${karar}: ${sayi} aday`}
                  />
                ))}
              </div>
            </section>

            {/* Mülakat durumları */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className={stiller.bolumBasligi}>Mülakat durumları</h2>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tabloBasligi}>Durum</th>
                    <th className={`${tabloBasligi} text-right`}>İK</th>
                    <th className={`${tabloBasligi} text-right`}>Teknik</th>
                  </tr>
                </thead>

                <tbody>
                  {durumlar.map((durum) => (
                    <tr key={durum} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-700">{durum}</td>
                      {(["ik", "teknik"] as const).map((tur) => (
                        <td key={tur} className="py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {adaylar.filter((aday) => durumu(aday.id, tur) === durum).length}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Pozisyonlar */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className={stiller.bolumBasligi}>Pozisyonlara göre</h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tabloBasligi}>Pozisyon</th>
                    <th className={`${tabloBasligi} text-right`}>Aday</th>
                    <th className={`${tabloBasligi} text-right`}>İK tamam</th>
                    <th className={`${tabloBasligi} text-right`}>Teknik tamam</th>
                    <th className={`${tabloBasligi} text-right`}>Ort. teknik</th>
                    <th className={`${tabloBasligi} text-right`}>Teklif / işe alım</th>
                    <th className={tabloBasligi} />
                  </tr>
                </thead>

                <tbody>
                  {pozisyonlar.map((pozisyon) => {
                    const pozisyonAdaylari = adaylar.filter((aday) => aday.pozisyon.id === pozisyon.id);
                    const ortalamaPuan = ortalama(
                      pozisyonAdaylari
                        .map((aday) => teknikYuzdesi(aday.id))
                        .filter((yuzde): yuzde is number => yuzde !== null)
                    );

                    return (
                      <tr key={pozisyon.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 font-medium text-slate-900">{pozisyon.ad}</td>
                        <td className="py-2.5 text-right tabular-nums">{pozisyonAdaylari.length}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {pozisyonAdaylari.filter((aday) => durumu(aday.id, "ik") === "Tamamlandı").length}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {pozisyonAdaylari.filter((aday) => durumu(aday.id, "teknik") === "Tamamlandı").length}
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {ortalamaPuan === null ? "-" : `%${ortalamaPuan}`}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {
                            pozisyonAdaylari.filter(
                              (aday) => aday.karar === "Teklif verildi" || aday.karar === "İşe alındı"
                            ).length
                          }
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            href={`/karsilastirma?pozisyon=${pozisyon.id}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-marka hover:underline"
                          >
                            <Columns3 size={14} />
                            Karşılaştır
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Teknik konular */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className={stiller.bolumBasligi}>Teknik konulara göre başarı</h2>

            <p className="-mt-2 mb-4 text-sm text-slate-600">
              Bütün mülakatlarda o konuda verilen değerlendirmelerin ortalaması (Yeterli 2, Orta 1,
              Yetersiz 0 puan). En çok zorlanılan konular en üstte.
            </p>

            {konuSonuclari.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz değerlendirilmiş teknik soru yok.</p>
            ) : (
              <div className="space-y-3">
                {konuSonuclari.map((satir) => (
                  <CubukSatiri
                    key={satir.konu}
                    etiket={
                      <span>
                        <span className="capitalize">{satir.konu}</span>
                        <span className="ml-1.5 text-xs text-slate-500">({satir.soru} soru)</span>
                      </span>
                    }
                    oran={satir.yuzde / 100}
                    deger={`%${satir.yuzde}`}
                    aciklama={`${satir.konu}: ${satir.soru} değerlendirilmiş soru, ortalama %${satir.yuzde}`}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
