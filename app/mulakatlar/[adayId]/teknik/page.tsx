"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Info, RotateCcw } from "lucide-react";
import { useAdaylar } from "../../../context/AdayContext";
import BosDurum from "../../../../components/BosDurum";
import OnayKutusu from "../../../../components/OnayKutusu";
import { stiller } from "../../../../components/stiller";
import { istekAt } from "../../../../components/istekAt";
import {
  Degerlendirme,
  izlenim,
  izlenimRengi,
  konularaGoreGrupla,
  yuzdeHesapla,
} from "../../../../components/teknikPuan";

type Cevap = {
  id: number;
  sira: number;
  konuAdi: string;
  soruMetni: string;
  degerlendirme: Degerlendirme | null;
};

type KonuOzeti = {
  id: number;
  ad: string;
  sorular: { id: number }[];
};

const secenekler: { deger: Degerlendirme; ad: string; renk: string; secili: string }[] = [
  {
    deger: "yeterli",
    ad: "Yeterli",
    renk: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    secili: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    deger: "orta",
    ad: "Orta",
    renk: "border-amber-200 text-amber-700 hover:bg-amber-50",
    secili: "border-amber-500 bg-amber-500 text-white",
  },
  {
    deger: "yetersiz",
    ad: "Yetersiz",
    renk: "border-red-200 text-red-700 hover:bg-red-50",
    secili: "border-red-600 bg-red-600 text-white",
  },
];

export default function TeknikMulakat() {
  const adayId = Number(useParams<{ adayId: string }>().adayId);
  const { adaylar } = useAdaylar();
  const aday = adaylar.find((mevcut) => mevcut.id === adayId);

  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [durum, setDurum] = useState("Planlanmadı");
  const [konular, setKonular] = useState<KonuOzeti[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  // Kurulum ekranında her konu için girilen soru sayısı
  const [adetler, setAdetler] = useState<Record<number, string>>({});
  const [aktifSira, setAktifSira] = useState(0);
  const [isleniyor, setIsleniyor] = useState(false);
  const [sifirlaAcik, setSifirlaAcik] = useState(false);

  // Bir değerlendirme kaydedilirken yeni tıklama alınmaz; hızlı art arda basışta
  // ikinci tıklama, ekranı henüz değişmemiş önceki sorunun üzerine yazmasın
  const [kaydediliyor, setKaydediliyor] = useState(false);
  // State bir sonraki çizimde güncellenir; aynı anda gelen tıklamaları ref anında yakalar
  const kayitSuruyor = useRef(false);

  // Mülakat kaydını ve soru havuzunun konularını birlikte getir
  useEffect(() => {
    const verileriGetir = async () => {
      const [oturumYaniti, konuYaniti] = await Promise.all([
        istekAt(`/api/teknik-mulakat/${adayId}`, "GET"),
        istekAt("/api/konular", "GET"),
      ]);

      setYukleniyor(false);

      if (oturumYaniti.hata) {
        setHata(oturumYaniti.hata);
        return;
      }

      const oturum = oturumYaniti.veri;

      setCevaplar(oturum.cevaplar);
      setDurum(oturum.durum);

      // Kaldığı yerden devam: ilk değerlendirilmemiş soru
      const ilkBos = oturum.cevaplar.findIndex((cevap: Cevap) => !cevap.degerlendirme);
      setAktifSira(ilkBos === -1 ? 0 : ilkBos);

      if (konuYaniti.veri) {
        setKonular(konuYaniti.veri);
      }
    };

    verileriGetir();
  }, [adayId]);

  const toplamSoru = Object.values(adetler).reduce(
    (toplam, adet) => toplam + (Number(adet) || 0),
    0
  );

  const mulakatiBaslat = async () => {
    setIsleniyor(true);
    setHata("");

    const { veri, hata: istekHatasi } = await istekAt(`/api/teknik-mulakat/${adayId}`, "POST", {
      secimler: Object.entries(adetler).map(([konuId, adet]) => ({
        konuId: Number(konuId),
        adet: Number(adet) || 0,
      })),
    });

    setIsleniyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    setCevaplar(veri.cevaplar);
    setDurum(veri.durum);
    setAktifSira(0);
  };

  const degerlendir = async (cevap: Cevap, degerlendirme: Degerlendirme) => {
    if (kayitSuruyor.current) return;

    kayitSuruyor.current = true;
    setKaydediliyor(true);
    setHata("");

    const { veri, hata: istekHatasi } = await istekAt(`/api/teknik-cevaplar/${cevap.id}`, "PUT", {
      degerlendirme,
    });

    kayitSuruyor.current = false;
    setKaydediliyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    const yeniCevaplar = cevaplar.map((mevcut) => (mevcut.id === veri.id ? veri : mevcut));
    setCevaplar(yeniCevaplar);

    // Sıradaki değerlendirilmemiş soruya geç
    const siradaki = yeniCevaplar.findIndex(
      (mevcut, sira) => sira > aktifSira && !mevcut.degerlendirme
    );

    if (siradaki !== -1) {
      setAktifSira(siradaki);
    }
  };

  // Seçilen soruları ve değerlendirmeleri silip kurulum ekranına döner
  const mulakatiSifirla = async () => {
    setSifirlaAcik(false);
    setHata("");

    const { veri, hata: istekHatasi } = await istekAt(`/api/teknik-mulakat/${adayId}`, "DELETE");

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    setCevaplar([]);
    setDurum(veri.durum);
    setAdetler({});
    setAktifSira(0);
  };

  const mulakatiBitir = async () => {
    setIsleniyor(true);
    setHata("");

    const { veri, hata: istekHatasi } = await istekAt(`/api/teknik-mulakat/${adayId}/bitir`, "POST");

    setIsleniyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    setDurum(veri.durum);
  };

  const degerlendirilen = cevaplar.filter((cevap) => cevap.degerlendirme).length;
  const hepsiDegerlendirildi = cevaplar.length > 0 && degerlendirilen === cevaplar.length;
  const tamamlandi = durum === "Tamamlandı" && hepsiDegerlendirildi;
  const aktifCevap = cevaplar[aktifSira];

  // Sonuç ekranı için konulara göre gruplama
  const konuSonuclari = konularaGoreGrupla(cevaplar);

  const genelYuzde = yuzdeHesapla(cevaplar);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/mulakatlar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-marka"
      >
        <ArrowLeft size={16} />
        Mülakatlara dön
      </Link>

      <h1 className={`mt-4 ${stiller.sayfaBasligi}`}>
        Teknik Mülakat
      </h1>

      {aday && (
        <p className="mt-2 text-slate-600">
          {aday.adSoyad} · {aday.pozisyon.ad}
        </p>
      )}

      {hata && (
        <p className="mt-6 text-red-600">{hata}</p>
      )}

      {yukleniyor ? (
        <p className="mt-10 text-slate-600">Yükleniyor...</p>
      ) : cevaplar.length === 0 ? (
        /* ---------------- Kurulum ---------------- */
        <div className="mt-8">
          {konular.length === 0 ? (
            <BosDurum
              ikon={<BookOpen size={24} />}
              mesaj="Soru havuzunda henüz konu yok. Önce Soru Havuzu sayfasından konu ve soru ekleyin."
            />
          ) : (
            <div className={stiller.kart}>
              <h2 className="text-lg font-semibold text-slate-900">
                Hangi konulardan kaç soru sorulsun?
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Sorular her konunun havuzundan rastgele seçilip karışık bir sırayla gelecek.
              </p>

              <div className="mt-5 divide-y divide-slate-100">
                {konular.map((konu) => (
                  <div key={konu.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{konu.ad}</p>
                      <p className="text-sm text-slate-500">
                        Havuzda {konu.sorular.length} soru
                      </p>
                    </div>

                    <input
                      type="number"
                      min={0}
                      max={konu.sorular.length}
                      value={adetler[konu.id] || ""}
                      onChange={(e) => {
                        const adet = Math.min(
                          Math.max(Number(e.target.value) || 0, 0),
                          konu.sorular.length
                        );
                        setAdetler({ ...adetler, [konu.id]: adet ? String(adet) : "" });
                      }}
                      disabled={konu.sorular.length === 0}
                      placeholder="0"
                      aria-label={`${konu.ad} konusundan soru sayısı`}
                      className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-center text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20 disabled:bg-slate-100"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
                <p className="text-sm text-slate-600">
                  Toplam <span className="font-semibold text-slate-900">{toplamSoru}</span> soru
                </p>

                <button
                  onClick={mulakatiBaslat}
                  disabled={toplamSoru === 0 || isleniyor}
                  className={`${stiller.birincilDugme} disabled:opacity-50`}
                >
                  Mülakatı Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      ) : tamamlandi ? (
        /* ---------------- Sonuç ---------------- */
        <div className="mt-8 space-y-6">
          <div className={stiller.kart}>
            <p className="text-sm font-medium text-slate-500">Genel izlenim</p>

            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-bold text-slate-900">%{genelYuzde}</span>
              <span className="pb-1 text-lg font-medium text-slate-700">{izlenim(genelYuzde)}</span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${izlenimRengi(genelYuzde)}`}
                style={{ width: `${genelYuzde}%` }}
              />
            </div>

            <p className="mt-4 flex items-start gap-2 text-sm text-slate-500">
              <Info size={16} className="mt-0.5 shrink-0" />
              Bu puan işe alım kararı değildir; mülakatçıya fikir vermek için hesaplanır.
              Yeterli 2, Orta 1, Yetersiz 0 puan sayılır.
            </p>
          </div>

          <div className={stiller.kart}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Konulara göre</h2>

            <div className="space-y-4">
              {konuSonuclari.map(([konuAdi, liste]) => {
                const yuzde = yuzdeHesapla(liste);

                return (
                  <div key={konuAdi}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{konuAdi}</span>
                      <span className="text-slate-600">
                        %{yuzde} · {liste.length} soru
                      </span>
                    </div>

                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${izlenimRengi(yuzde)}`}
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={stiller.kart}>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Sorular</h2>

            <ol className="divide-y divide-slate-100">
              {cevaplar.map((cevap) => {
                const secenek = secenekler.find((s) => s.deger === cevap.degerlendirme);

                return (
                  <li key={cevap.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{cevap.konuAdi}</p>
                      <p className="text-slate-800">{cevap.soruMetni}</p>
                    </div>

                    {secenek && (
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${secenek.secili}`}
                      >
                        {secenek.ad}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : (
        /* ---------------- Mülakat ---------------- */
        aktifCevap && (
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Soru {aktifSira + 1} / {cevaplar.length}
              </span>
              <span>{degerlendirilen} soru değerlendirildi</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-marka transition-all"
                style={{ width: `${(degerlendirilen / cevaplar.length) * 100}%` }}
              />
            </div>

            <div className={`mt-6 ${stiller.kart}`}>
              <span className="rounded-full bg-marka-acik px-2.5 py-0.5 text-sm font-medium text-marka">
                {aktifCevap.konuAdi}
              </span>

              <p className="mt-4 text-xl font-medium leading-relaxed text-slate-900">
                {aktifCevap.soruMetni}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {secenekler.map((secenek) => (
                  <button
                    key={secenek.deger}
                    onClick={() => degerlendir(aktifCevap, secenek.deger)}
                    disabled={kaydediliyor}
                    className={`rounded-lg border-2 px-4 py-3 font-medium transition disabled:cursor-wait ${aktifCevap.degerlendirme === secenek.deger ? secenek.secili : secenek.renk
                      }`}
                  >
                    {secenek.ad}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorular arasında gezinme */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setAktifSira(aktifSira - 1)}
                disabled={aktifSira === 0}
                className={`${stiller.duzenleDugmesi} disabled:opacity-40`}
              >
                <ChevronLeft size={16} />
                Önceki
              </button>

              <div className="flex flex-wrap justify-center gap-1.5">
                {cevaplar.map((cevap, sira) => (
                  <button
                    key={cevap.id}
                    onClick={() => setAktifSira(sira)}
                    aria-label={`${sira + 1}. soruya git`}
                    className={`h-3 w-3 rounded-full transition ${sira === aktifSira
                      ? "ring-2 ring-marka ring-offset-2"
                      : ""
                      } ${cevap.degerlendirme ? "bg-marka" : "bg-slate-300"}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setAktifSira(aktifSira + 1)}
                disabled={aktifSira === cevaplar.length - 1}
                className={`${stiller.duzenleDugmesi} disabled:opacity-40`}
              >
                Sonraki
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={mulakatiBitir}
              disabled={!hepsiDegerlendirildi || isleniyor}
              className={`mt-8 ${stiller.kaydetDugmesi} disabled:cursor-not-allowed`}
            >
              {hepsiDegerlendirildi
                ? "Mülakatı Bitir"
                : `Bitirmek için ${cevaplar.length - degerlendirilen} soru daha değerlendirin`}
            </button>
          </div>
        )
      )}

      {cevaplar.length > 0 && (
        <div className="mt-10 border-t border-slate-200 pt-6">
          <button onClick={() => setSifirlaAcik(true)} className={stiller.silDugmesi}>
            <RotateCcw size={14} />
            Mülakatı sıfırla
          </button>

          <p className="mt-2 text-xs text-slate-500">
            Yanlış konu ya da soru sayısı seçildiyse mülakat baştan başlatılabilir.
          </p>
        </div>
      )}

      <OnayKutusu
        acik={sifirlaAcik}
        baslik="Mülakat sıfırlansın mı?"
        mesaj="Seçilen sorular ve verilen bütün değerlendirmeler silinecek. Mülakatçı ve tarih bilgisi korunur."
        onayYazisi="Sıfırla"
        onOnayla={mulakatiSifirla}
        onVazgec={() => setSifirlaAcik(false)}
      />
    </main>
  );
}
