"use client";

import { useEffect, useState } from "react";
import {
  GitBranch,
  ListChecks,
  Pencil,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import AkisAgaci from "../../components/AkisAgaci";
import BosDurum from "../../components/BosDurum";
import OnayKutusu from "../../components/OnayKutusu";
import { IkAkis, IkSoru, akisUyarilari, kisalt } from "../../components/ikAkisTipleri";
import { istekAt } from "../../components/istekAt";
import { stiller } from "../../components/stiller";

type Pozisyon = {
  id: number;
  ad: string;
};

// Aynı anda tek bir akış adı, soru ya da seçenek metni düzenlenebilir
type Duzenlenen = {
  tur: "akis" | "soru" | "secenek";
  id: number;
  metin: string;
};

type Silinecek = {
  tur: "akis" | "soru" | "secenek";
  id: number;
  ad: string;
};

// Bir sorunun altındaki "yeni seçenek" satırının içeriği
type YeniSecenek = {
  metin: string;
  sonrakiSoruId: string;
};

const silmeAdresi = {
  akis: "/api/ik-akislar",
  soru: "/api/ik-sorular",
  secenek: "/api/ik-secenekler",
};

const silmeMesaji = {
  akis: "akışı bütün soruları ve seçenekleriyle birlikte silinecek.",
  soru: "sorusu seçenekleriyle birlikte silinecek. Bu soruya giden seçenekler akışı bitirir hale gelir.",
  secenek: "seçeneği silinecek.",
};

export default function IkAkislari() {
  const [akislar, setAkislar] = useState<IkAkis[]>([]);
  const [pozisyonlar, setPozisyonlar] = useState<Pozisyon[]>([]);
  const [seciliAkisId, setSeciliAkisId] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  const [formAcik, setFormAcik] = useState(false);
  const [yeniAkisAdi, setYeniAkisAdi] = useState("");
  const [yeniAkisPozisyonlari, setYeniAkisPozisyonlari] = useState<number[]>([]);

  const [yeniSoru, setYeniSoru] = useState("");
  const [yeniSecenekler, setYeniSecenekler] = useState<Record<number, YeniSecenek>>({});

  const [duzenlenen, setDuzenlenen] = useState<Duzenlenen | null>(null);
  const [silinecek, setSilinecek] = useState<Silinecek | null>(null);

  // Sayfa açıldığında akışları ve pozisyonları getir
  useEffect(() => {
    const verileriGetir = async () => {
      const [akisSonucu, pozisyonSonucu] = await Promise.all([
        istekAt("/api/ik-akislar", "GET"),
        istekAt("/api/pozisyonlar", "GET"),
      ]);

      if (akisSonucu.hata) {
        setHata(akisSonucu.hata);
      } else {
        setAkislar(akisSonucu.veri);
        setSeciliAkisId(akisSonucu.veri[0]?.id ?? null);
      }

      if (!pozisyonSonucu.hata) {
        setPozisyonlar(pozisyonSonucu.veri);
      }

      setYukleniyor(false);
    };

    verileriGetir();
  }, []);

  // İç içe veride her değişiklikten sonra akışları sunucudan yeniden çeker
  const akislariYenile = async () => {
    const { veri, hata: yenilemeHatasi } = await istekAt("/api/ik-akislar", "GET");

    if (yenilemeHatasi) {
      setHata(yenilemeHatasi);
    } else {
      setAkislar(veri);
    }
  };

  // Bir isteği atar, başarılıysa listeyi yeniler; başarı durumunu döndürür
  const islemYap = async (adres: string, method: string, govde?: object) => {
    const { veri, hata: islemHatasi } = await istekAt(adres, method, govde);

    if (islemHatasi) {
      setHata(islemHatasi);
      return null;
    }

    setHata("");
    await akislariYenile();

    return veri;
  };

  const seciliAkis = akislar.find((akis) => akis.id === seciliAkisId);

  const akisEkle = async () => {
    if (!yeniAkisAdi.trim()) {
      setHata("Akış adı boş bırakılamaz.");
      return;
    }

    const akis = await islemYap("/api/ik-akislar", "POST", {
      ad: yeniAkisAdi,
      pozisyonIdleri: yeniAkisPozisyonlari,
    });

    if (akis) {
      setSeciliAkisId(akis.id);
      setYeniAkisAdi("");
      setYeniAkisPozisyonlari([]);
      setFormAcik(false);
    }
  };

  const pozisyonBagla = (akis: IkAkis, pozisyonId: number) => {
    const bagliIdler = akis.pozisyonlar.map((pozisyon) => pozisyon.id);

    const yeniIdler = bagliIdler.includes(pozisyonId)
      ? bagliIdler.filter((id) => id !== pozisyonId)
      : [...bagliIdler, pozisyonId];

    islemYap(`/api/ik-akislar/${akis.id}`, "PUT", { pozisyonIdleri: yeniIdler });
  };

  const soruEkle = async () => {
    if (!seciliAkis) return;

    if (!yeniSoru.trim()) {
      setHata("Soru metni boş bırakılamaz.");
      return;
    }

    if (await islemYap("/api/ik-sorular", "POST", { akisId: seciliAkis.id, metin: yeniSoru })) {
      setYeniSoru("");
    }
  };

  const secenekEkle = async (soru: IkSoru) => {
    const yeni = yeniSecenekler[soru.id] || { metin: "", sonrakiSoruId: "" };

    if (!yeni.metin.trim()) {
      setHata("Seçenek metni boş bırakılamaz.");
      return;
    }

    const secenek = await islemYap("/api/ik-secenekler", "POST", {
      soruId: soru.id,
      metin: yeni.metin,
      sonrakiSoruId: yeni.sonrakiSoruId,
    });

    if (secenek) {
      setYeniSecenekler({ ...yeniSecenekler, [soru.id]: { metin: "", sonrakiSoruId: "" } });
    }
  };

  const duzenlemeyiKaydet = async () => {
    if (!duzenlenen) return;

    const adresler = {
      akis: [`/api/ik-akislar/${duzenlenen.id}`, { ad: duzenlenen.metin }],
      soru: [`/api/ik-sorular/${duzenlenen.id}`, { metin: duzenlenen.metin }],
      secenek: [`/api/ik-secenekler/${duzenlenen.id}`, { metin: duzenlenen.metin }],
    } as const;

    const [adres, govde] = adresler[duzenlenen.tur];

    if (await islemYap(adres, "PUT", govde)) {
      setDuzenlenen(null);
    }
  };

  const sil = async (hedef: Silinecek) => {
    setSilinecek(null);

    if (await islemYap(`${silmeAdresi[hedef.tur]}/${hedef.id}`, "DELETE")) {
      if (hedef.tur === "akis") {
        setSeciliAkisId(akislar.find((akis) => akis.genel)?.id ?? null);
      }
    }
  };

  // Düzenlenen öğe buysa yerinde düzenleme alanını gösterir
  const duzenlemeAlani = (tur: Duzenlenen["tur"], id: number) =>
    duzenlenen?.tur === tur && duzenlenen.id === id ? (
      <div className="flex flex-1 items-center gap-2">
        <input
          type="text"
          value={duzenlenen.metin}
          onChange={(e) => setDuzenlenen({ ...duzenlenen, metin: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && duzenlemeyiKaydet()}
          className={stiller.duzenlemeGirdisi}
        />

        <button onClick={duzenlemeyiKaydet} className={stiller.kucukKaydetDugmesi}>
          Kaydet
        </button>

        <button onClick={() => setDuzenlenen(null)} className={stiller.vazgecDugmesi}>
          Vazgeç
        </button>
      </div>
    ) : null;

  const uyarilar = seciliAkis ? akisUyarilari(seciliAkis) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            İK Soru Akışları
          </h1>

          <p className="mt-2 text-slate-600">
            Cevaba göre dallanan İK sorularını düzenleyin. Genel sorular her mülakatta,
            pozisyon akışları seçildiğinde sorulur.
          </p>
        </div>

        <button onClick={() => setFormAcik(!formAcik)} className={stiller.birincilDugme}>
          <Plus size={18} />
          Akış Ekle
        </button>
      </div>

      {formAcik && (
        <div className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Pozisyon Akışı
          </h2>

          <label className={stiller.etiket}>Akış Adı</label>

          <input
            type="text"
            value={yeniAkisAdi}
            onChange={(e) => setYeniAkisAdi(e.target.value)}
            placeholder="Örneğin: Takım Lideri"
            className={stiller.girdi()}
          />

          <label className={`mt-5 ${stiller.etiket}`}>Bağlı Pozisyonlar (isteğe bağlı)</label>

          <div className="flex flex-wrap gap-2">
            {pozisyonlar.map((pozisyon) => {
              const secili = yeniAkisPozisyonlari.includes(pozisyon.id);

              return (
                <button
                  key={pozisyon.id}
                  onClick={() =>
                    setYeniAkisPozisyonlari(
                      secili
                        ? yeniAkisPozisyonlari.filter((id) => id !== pozisyon.id)
                        : [...yeniAkisPozisyonlari, pozisyon.id]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-sm transition ${secili
                    ? "border-marka bg-marka-acik text-marka"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {pozisyon.ad}
                </button>
              );
            })}
          </div>

          <button onClick={akisEkle} className={`mt-6 ${stiller.kaydetDugmesi}`}>
            Akışı Kaydet
          </button>
        </div>
      )}

      {hata && (
        <p className="mt-6 text-red-600">{hata}</p>
      )}

      {yukleniyor ? (
        <p className="mt-10 text-slate-600">Akışlar yükleniyor...</p>
      ) : (
        <>
          {/* Akış sekmeleri */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {akislar.map((akis) => (
              <button
                key={akis.id}
                onClick={() => {
                  setSeciliAkisId(akis.id);
                  setDuzenlenen(null);
                  setHata("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${akis.id === seciliAkisId
                  ? "bg-marka text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
              >
                {akis.ad}
                <span className="ml-2 opacity-70">{akis.sorular.length}</span>
              </button>
            ))}
          </div>

          {seciliAkis && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Akış bilgisi */}
                <div className={stiller.kart}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {duzenlemeAlani("akis", seciliAkis.id) ?? (
                      <>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-semibold text-slate-900">{seciliAkis.ad}</h2>
                          {seciliAkis.genel && (
                            <span className="rounded-full bg-marka-acik px-2.5 py-0.5 text-sm font-medium text-marka">
                              Genel
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setDuzenlenen({ tur: "akis", id: seciliAkis.id, metin: seciliAkis.ad })
                            }
                            className={stiller.duzenleDugmesi}
                          >
                            <Pencil size={14} />
                            Adı Düzenle
                          </button>

                          {!seciliAkis.genel && (
                            <button
                              onClick={() =>
                                setSilinecek({ tur: "akis", id: seciliAkis.id, ad: seciliAkis.ad })
                              }
                              className={stiller.silDugmesi}
                            >
                              <Trash2 size={14} />
                              Sil
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {seciliAkis.genel ? (
                    <p className="mt-3 text-sm text-slate-600">
                      Bu akış her İK mülakatının başında sorulur; pozisyona bağlanmaz.
                    </p>
                  ) : (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-slate-800">
                        Bağlı pozisyonlar
                        <span className="ml-1 font-normal text-slate-500">
                          (bu pozisyondaki adaylarda akış önceden seçili gelir)
                        </span>
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {pozisyonlar.map((pozisyon) => {
                          const bagli = seciliAkis.pozisyonlar.some((p) => p.id === pozisyon.id);

                          return (
                            <button
                              key={pozisyon.id}
                              onClick={() => pozisyonBagla(seciliAkis, pozisyon.id)}
                              className={`rounded-full border px-3 py-1 text-sm transition ${bagli
                                ? "border-marka bg-marka-acik text-marka"
                                : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                              {pozisyon.ad}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Uyarılar */}
                {uyarilar.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 font-medium text-amber-800">
                      <TriangleAlert size={18} />
                      Akışta dikkat edilmesi gerekenler
                    </p>

                    <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-800">
                      {uyarilar.map((uyari) => (
                        <li key={uyari}>{uyari}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sorular */}
                {seciliAkis.sorular.length === 0 && (
                  <BosDurum
                    ikon={<ListChecks size={24} />}
                    mesaj="Bu akışta henüz soru yok. Aşağıdan ilk soruyu ekleyin."
                  />
                )}

                {seciliAkis.sorular.map((soru, sira) => {
                  const yeni = yeniSecenekler[soru.id] || { metin: "", sonrakiSoruId: "" };
                  const digerSorular = seciliAkis.sorular.filter((s) => s.id !== soru.id);
                  const ilkSoru = seciliAkis.ilkSoruId === soru.id;

                  return (
                    <div key={soru.id} className={stiller.kart}>
                      {/* Soru başlığı */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {sira + 1}
                        </span>

                        {duzenlemeAlani("soru", soru.id) ?? (
                          <>
                            <p className="flex-1 pt-0.5 font-medium text-slate-900">{soru.metin}</p>

                            {ilkSoru ? (
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                <Star size={12} />
                                İlk soru
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  islemYap(`/api/ik-akislar/${seciliAkis.id}`, "PUT", {
                                    ilkSoruId: soru.id,
                                  })
                                }
                                className="shrink-0 rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 transition hover:bg-slate-100"
                              >
                                İlk soru yap
                              </button>
                            )}

                            <button
                              onClick={() => setDuzenlenen({ tur: "soru", id: soru.id, metin: soru.metin })}
                              aria-label="Soruyu düzenle"
                              className={stiller.ikonDugmesi}
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => setSilinecek({ tur: "soru", id: soru.id, ad: soru.metin })}
                              aria-label="Soruyu sil"
                              className={stiller.ikonSilDugmesi}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Seçenekler */}
                      <ul className="mt-4 space-y-2 pl-10">
                        {soru.secenekler.map((secenek) => (
                          <li key={secenek.id} className="flex flex-wrap items-center gap-2">
                            {duzenlemeAlani("secenek", secenek.id) ?? (
                              <>
                                <span className="min-w-24 rounded-lg bg-marka-acik px-3 py-1.5 text-sm font-medium text-marka">
                                  {secenek.metin}
                                </span>

                                <span className="text-sm text-slate-400">→</span>

                                <select
                                  value={secenek.sonrakiSoruId ?? ""}
                                  onChange={(e) =>
                                    islemYap(`/api/ik-secenekler/${secenek.id}`, "PUT", {
                                      sonrakiSoruId: e.target.value,
                                    })
                                  }
                                  aria-label={`${secenek.metin} seçilirse gidilecek soru`}
                                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                                >
                                  <option value="">Akış biter</option>
                                  {digerSorular.map((diger) => (
                                    <option key={diger.id} value={diger.id}>
                                      {kisalt(diger.metin)}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() =>
                                    setDuzenlenen({ tur: "secenek", id: secenek.id, metin: secenek.metin })
                                  }
                                  aria-label="Seçeneği düzenle"
                                  className={stiller.ikonDugmesi}
                                >
                                  <Pencil size={14} />
                                </button>

                                <button
                                  onClick={() =>
                                    setSilinecek({ tur: "secenek", id: secenek.id, ad: secenek.metin })
                                  }
                                  aria-label="Seçeneği sil"
                                  className={stiller.ikonSilDugmesi}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </li>
                        ))}

                        {/* Yeni seçenek */}
                        <li className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={yeni.metin}
                            onChange={(e) =>
                              setYeniSecenekler({
                                ...yeniSecenekler,
                                [soru.id]: { ...yeni, metin: e.target.value },
                              })
                            }
                            onKeyDown={(e) => e.key === "Enter" && secenekEkle(soru)}
                            placeholder="Yeni seçenek, ör. Evet"
                            className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                          />

                          <span className="text-sm text-slate-400">→</span>

                          <select
                            value={yeni.sonrakiSoruId}
                            onChange={(e) =>
                              setYeniSecenekler({
                                ...yeniSecenekler,
                                [soru.id]: { ...yeni, sonrakiSoruId: e.target.value },
                              })
                            }
                            aria-label="Yeni seçenek seçilirse gidilecek soru"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                          >
                            <option value="">Akış biter</option>
                            {digerSorular.map((diger) => (
                              <option key={diger.id} value={diger.id}>
                                {kisalt(diger.metin)}
                              </option>
                            ))}
                          </select>

                          <button onClick={() => secenekEkle(soru)} className={stiller.kucukKaydetDugmesi}>
                            Ekle
                          </button>
                        </li>
                      </ul>
                    </div>
                  );
                })}

                {/* Yeni soru */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={yeniSoru}
                    onChange={(e) => setYeniSoru(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && soruEkle()}
                    placeholder="Yeni soru yazın ve Enter'a basın"
                    className={stiller.duzenlemeGirdisi}
                  />

                  <button onClick={soruEkle} className={stiller.birincilDugme}>
                    <Plus size={18} />
                    Soru Ekle
                  </button>
                </div>
              </div>

              {/* Ağaç önizleme */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className={stiller.kart}>
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                    <GitBranch size={18} />
                    Akış Önizlemesi
                  </h2>

                  <AkisAgaci akis={seciliAkis} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <OnayKutusu
        acik={silinecek !== null}
        baslik="Silinsin mi?"
        mesaj={silinecek ? `"${kisalt(silinecek.ad)}" ${silmeMesaji[silinecek.tur]}` : ""}
        onOnayla={() => silinecek && sil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
