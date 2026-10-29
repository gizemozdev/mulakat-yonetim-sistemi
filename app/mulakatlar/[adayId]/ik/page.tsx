"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleCheck, MessageSquareText, RotateCcw, Undo2 } from "lucide-react";
import { useAdaylar } from "../../../context/AdayContext";
import { IkAkis } from "../../../../components/ikAkisTipleri";
import { istekAt } from "../../../../components/istekAt";
import { stiller } from "../../../../components/stiller";
import OnayKutusu from "../../../../components/OnayKutusu";

type IkCevap = {
  id: number;
  sira: number;
  akisAdi: string;
  soruMetni: string;
  secenekMetni: string | null;
  not: string;
};

type Oturum = {
  durum: string;
  baslatildi: boolean;
  akis: { id: number; ad: string } | null;
  genelNot: string;
  cevaplar: IkCevap[];
  guncelSoru: {
    id: number;
    metin: string;
    akisAdi: string;
    genel: boolean;
    secenekler: { id: number; metin: string }[];
  } | null;
};

const notAlaniSinifi =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20";

// Verilen cevapları sırasıyla, akış değiştikçe akış adıyla gösterir
function CevapListesi({ cevaplar }: { cevaplar: IkCevap[] }) {
  return (
    <ol className="divide-y divide-slate-100">
      {cevaplar.map((cevap, sira) => (
        <li key={cevap.id} className="py-3">
          {(sira === 0 || cevaplar[sira - 1].akisAdi !== cevap.akisAdi) && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-marka">
              {cevap.akisAdi}
            </p>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-slate-800">{cevap.soruMetni}</p>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {cevap.secenekMetni ?? "Devam"}
            </span>
          </div>

          {cevap.not && (
            <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
              <MessageSquareText size={16} className="mt-0.5 shrink-0 text-slate-400" />
              {cevap.not}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function IkMulakat() {
  const adayId = Number(useParams<{ adayId: string }>().adayId);
  const { adaylar } = useAdaylar();
  const aday = adaylar.find((mevcut) => mevcut.id === adayId);

  const [oturum, setOturum] = useState<Oturum | null>(null);
  const [akislar, setAkislar] = useState<IkAkis[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  // null: kullanıcı henüz seçmedi, önerilen akış kullanılır. "": yalnızca genel sorular.
  const [seciliAkis, setSeciliAkis] = useState<string | null>(null);
  const [not, setNot] = useState("");
  const [genelNot, setGenelNot] = useState("");

  // Art arda tıklamada aynı soruya iki cevap gitmesin
  const istekSuruyor = useRef(false);
  const [isleniyor, setIsleniyor] = useState(false);
  const [sifirlaAcik, setSifirlaAcik] = useState(false);

  useEffect(() => {
    const verileriGetir = async () => {
      const [oturumSonucu, akisSonucu] = await Promise.all([
        istekAt(`/api/ik-mulakat/${adayId}`, "GET"),
        istekAt("/api/ik-akislar", "GET"),
      ]);

      if (oturumSonucu.hata) {
        setHata(oturumSonucu.hata);
      } else {
        setOturum(oturumSonucu.veri);
      }

      if (!akisSonucu.hata) {
        setAkislar(akisSonucu.veri);
      }

      setYukleniyor(false);
    };

    verileriGetir();
  }, [adayId]);

  // Sunucuya istek atar ve dönen oturumu ekrana yansıtır
  const islem = async (adres: string, govde: object) => {
    if (istekSuruyor.current) return false;

    istekSuruyor.current = true;
    setIsleniyor(true);

    const { veri, hata: islemHatasi } = await istekAt(adres, "POST", govde);

    istekSuruyor.current = false;
    setIsleniyor(false);

    if (islemHatasi) {
      setHata(islemHatasi);
      return false;
    }

    setHata("");
    setOturum(veri);

    return true;
  };

  // Cevapları, akış seçimini ve genel notu silip akış seçim ekranına döner
  const mulakatiSifirla = async () => {
    setSifirlaAcik(false);

    const { veri, hata: sifirlamaHatasi } = await istekAt(`/api/ik-mulakat/${adayId}`, "DELETE");

    if (sifirlamaHatasi) {
      setHata(sifirlamaHatasi);
      return;
    }

    setHata("");
    setOturum(veri);
    setSeciliAkis(null);
    setNot("");
    setGenelNot("");
  };

  const genelAkis = akislar.find((akis) => akis.genel);
  const pozisyonAkislari = akislar.filter((akis) => !akis.genel);

  // Adayın pozisyonuna bağlı ilk akış önceden seçili gelir
  const onerilenAkis = pozisyonAkislari.find((akis) =>
    akis.pozisyonlar.some((pozisyon) => pozisyon.id === aday?.pozisyonId)
  );
  const secim = seciliAkis ?? (onerilenAkis ? String(onerilenAkis.id) : "");

  const cevapVer = async (secenekId: number | null) => {
    if (await islem(`/api/ik-mulakat/${adayId}/cevap`, { secenekId, not })) {
      setNot("");
    }
  };

  const tamamlandi = oturum?.durum === "Tamamlandı" && oturum.baslatildi;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/mulakatlar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-marka"
      >
        <ArrowLeft size={16} />
        Mülakatlara dön
      </Link>

      <h1 className={`mt-4 ${stiller.sayfaBasligi}`}>İK Mülakatı</h1>

      {aday && (
        <p className="mt-2 text-slate-600">
          {aday.adSoyad} · {aday.pozisyon.ad}
          {oturum?.akis && ` · ${oturum.akis.ad} akışı`}
        </p>
      )}

      {hata && <p className="mt-6 text-red-600">{hata}</p>}

      {yukleniyor || !oturum ? (
        !hata && <p className="mt-10 text-slate-600">Yükleniyor...</p>
      ) : !oturum.baslatildi ? (
        /* ---------------- Kurulum ---------------- */
        <div className={`mt-8 ${stiller.kart}`}>
          <h2 className="text-lg font-semibold text-slate-900">Hangi akış kullanılsın?</h2>

          <p className="mt-1 text-sm text-slate-600">
            Mülakat önce genel sorularla ({genelAkis?.sorular.length ?? 0} soru) başlar,
            ardından seçilen pozisyon akışının sorularıyla devam eder.
          </p>

          <div className="mt-5 space-y-2">
            {[
              { deger: "", ad: "Yalnızca genel sorular", alt: "Pozisyona özel soru sorulmaz", onerilen: false },
              ...pozisyonAkislari.map((akis) => ({
                deger: String(akis.id),
                ad: akis.ad,
                alt: `${akis.sorular.length} soru${akis.pozisyonlar.length ? ` · ${akis.pozisyonlar.map((p) => p.ad).join(", ")}` : ""}`,
                onerilen: akis.id === onerilenAkis?.id,
              })),
            ].map((secenek) => (
              <label
                key={secenek.deger}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${secim === secenek.deger
                  ? "border-marka bg-marka-acik"
                  : "border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <input
                  type="radio"
                  name="akis"
                  checked={secim === secenek.deger}
                  onChange={() => setSeciliAkis(secenek.deger)}
                  className="accent-marka"
                />

                <div className="flex-1">
                  <p className="font-medium text-slate-900">{secenek.ad}</p>
                  <p className="text-sm text-slate-500">{secenek.alt}</p>
                </div>

                {secenek.onerilen && (
                  <span className="rounded-full bg-marka px-2.5 py-0.5 text-xs font-medium text-white">
                    Adayın pozisyonu
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => islem(`/api/ik-mulakat/${adayId}`, { akisId: secim })}
              disabled={isleniyor}
              className={`${stiller.birincilDugme} disabled:opacity-50`}
            >
              Mülakatı Başlat
            </button>
          </div>
        </div>
      ) : tamamlandi ? (
        /* ---------------- Sonuç ---------------- */
        <div className="mt-8 space-y-6">
          <div className={stiller.kart}>
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CircleCheck size={20} />
              Mülakat tamamlandı
            </p>

            <p className="mt-3 text-sm font-medium text-slate-500">Genel değerlendirme</p>
            <p className="mt-1 whitespace-pre-line text-slate-800">
              {oturum.genelNot || "Genel not yazılmadı."}
            </p>
          </div>

          <div className={stiller.kart}>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Cevaplar ({oturum.cevaplar.length})
            </h2>
            <CevapListesi cevaplar={oturum.cevaplar} />
          </div>
        </div>
      ) : (
        /* ---------------- Mülakat ---------------- */
        <div className="mt-8 space-y-6">
          {oturum.guncelSoru ? (
            <div className={stiller.kart}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="rounded-full bg-marka-acik px-2.5 py-0.5 font-medium text-marka">
                  {oturum.guncelSoru.akisAdi}
                </span>
                <span className="text-slate-500">{oturum.cevaplar.length} soru cevaplandı</span>
              </div>

              <p className="mt-4 text-xl font-medium leading-relaxed text-slate-900">
                {oturum.guncelSoru.metin}
              </p>

              <label className={`mt-6 ${stiller.etiket}`}>Not (isteğe bağlı)</label>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                rows={2}
                placeholder="Adayın cevabıyla ilgili ayrıntı, ör. takım 7 kişiydi"
                className={notAlaniSinifi}
              />

              <p className="mb-2 mt-5 text-sm font-medium text-slate-800">Adayın cevabı</p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {oturum.guncelSoru.secenekler.length === 0 ? (
                  <button
                    onClick={() => cevapVer(null)}
                    disabled={isleniyor}
                    className={`${stiller.birincilDugme} justify-center disabled:opacity-50`}
                  >
                    Devam
                  </button>
                ) : (
                  oturum.guncelSoru.secenekler.map((secenek) => (
                    <button
                      key={secenek.id}
                      onClick={() => cevapVer(secenek.id)}
                      disabled={isleniyor}
                      className="rounded-lg border-2 border-marka/30 px-4 py-3 text-left font-medium text-slate-800 transition hover:border-marka hover:bg-marka-acik disabled:cursor-wait"
                    >
                      {secenek.metin}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={stiller.kart}>
              <p className="flex items-center gap-2 font-semibold text-slate-900">
                <CircleCheck size={20} className="text-emerald-600" />
                Bütün sorular cevaplandı
              </p>

              <label className={`mt-4 ${stiller.etiket}`}>Genel değerlendirme notu</label>
              <textarea
                value={genelNot}
                onChange={(e) => setGenelNot(e.target.value)}
                rows={4}
                placeholder="Adayla ilgili genel izleniminiz"
                className={notAlaniSinifi}
              />

              <button
                onClick={() => islem(`/api/ik-mulakat/${adayId}/bitir`, { genelNot })}
                disabled={isleniyor}
                className={`mt-4 ${stiller.kaydetDugmesi}`}
              >
                Mülakatı Bitir
              </button>
            </div>
          )}

          {oturum.cevaplar.length > 0 && (
            <div className={stiller.kart}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Verilen cevaplar</h2>

                <button
                  onClick={() => islem(`/api/ik-mulakat/${adayId}/geri-al`, {})}
                  disabled={isleniyor}
                  className={`${stiller.duzenleDugmesi} disabled:opacity-50`}
                >
                  <Undo2 size={14} />
                  Son cevabı geri al
                </button>
              </div>

              <CevapListesi cevaplar={oturum.cevaplar} />
            </div>
          )}

          {oturum.baslatildi && (
            <div className="border-t border-slate-200 pt-6">
              <button onClick={() => setSifirlaAcik(true)} className={stiller.silDugmesi}>
                <RotateCcw size={14} />
                Mülakatı sıfırla
              </button>

              <p className="mt-2 text-xs text-slate-500">
                Yanlış akış seçildiyse ya da mülakat baştan yapılacaksa bütün cevaplar silinip yeniden başlanabilir.
              </p>
            </div>
          )}
        </div>
      )}

      <OnayKutusu
        acik={sifirlaAcik}
        baslik="İK mülakatı sıfırlansın mı?"
        mesaj="Verilen bütün cevaplar, notlar, genel değerlendirme ve akış seçimi silinecek. Mülakatçı, tarih ve saat korunur."
        onayYazisi="Sıfırla"
        onOnayla={mulakatiSifirla}
        onVazgec={() => setSifirlaAcik(false)}
      />
    </main>
  );
}
