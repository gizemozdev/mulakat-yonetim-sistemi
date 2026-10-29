"use client";

import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import BosDurum from "../../components/BosDurum";
import OnayKutusu from "../../components/OnayKutusu";
import { istekAt } from "../../components/istekAt";
import { stiller } from "../../components/stiller";

type Soru = {
  id: number;
  konuId: number;
  metin: string;
};

type Konu = {
  id: number;
  ad: string;
  sorular: Soru[];
};

// Aynı anda tek bir konu adı ya da tek bir soru düzenlenebilir
type Duzenlenen = {
  tur: "konu" | "soru";
  id: number;
  metin: string;
};

type Silinecek = {
  tur: "konu" | "soru";
  id: number;
  ad: string;
};

const adaGoreSirala = (liste: Konu[]) =>
  [...liste].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

export default function SoruHavuzu() {
  const [konular, setKonular] = useState<Konu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [listeHatasi, setListeHatasi] = useState("");
  const [islemHatasi, setIslemHatasi] = useState("");

  const [formAcik, setFormAcik] = useState(false);
  const [yeniKonu, setYeniKonu] = useState("");
  const [formHatasi, setFormHatasi] = useState("");

  // Her konunun altındaki "yeni soru" kutusunun içeriği, konu numarasına göre
  const [yeniSorular, setYeniSorular] = useState<Record<number, string>>({});

  const [duzenlenen, setDuzenlenen] = useState<Duzenlenen | null>(null);
  const [silinecek, setSilinecek] = useState<Silinecek | null>(null);

  // Sayfa açıldığında konuları ve sorularını getir
  useEffect(() => {
    const konulariGetir = async () => {
      const { veri, hata } = await istekAt("/api/konular", "GET");

      if (hata) {
        setListeHatasi(hata);
      } else {
        setKonular(veri);
      }

      setYukleniyor(false);
    };

    konulariGetir();
  }, []);

  const konuEkle = async () => {
    if (!yeniKonu.trim()) {
      setFormHatasi("Konu adı boş bırakılamaz.");
      return;
    }

    const { veri, hata } = await istekAt("/api/konular", "POST", { ad: yeniKonu });

    if (hata) {
      setFormHatasi(hata);
      return;
    }

    setKonular(adaGoreSirala([...konular, veri]));
    setYeniKonu("");
    setFormHatasi("");
    setFormAcik(false);
  };

  const soruEkle = async (konuId: number) => {
    const metin = (yeniSorular[konuId] || "").trim();

    if (!metin) {
      setIslemHatasi("Soru metni boş bırakılamaz.");
      return;
    }

    const { veri, hata } = await istekAt("/api/sorular", "POST", { konuId, metin });

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    setKonular(
      konular.map((konu) =>
        konu.id === konuId ? { ...konu, sorular: [...konu.sorular, veri] } : konu
      )
    );
    setYeniSorular({ ...yeniSorular, [konuId]: "" });
    setIslemHatasi("");
  };

  const duzenlemeyiKaydet = async () => {
    if (!duzenlenen) return;

    if (!duzenlenen.metin.trim()) {
      setIslemHatasi("Bu alan boş bırakılamaz.");
      return;
    }

    if (duzenlenen.tur === "konu") {
      const { veri, hata } = await istekAt(`/api/konular/${duzenlenen.id}`, "PUT", {
        ad: duzenlenen.metin,
      });

      if (hata) {
        setIslemHatasi(hata);
        return;
      }

      setKonular(
        adaGoreSirala(
          konular.map((konu) => (konu.id === veri.id ? { ...konu, ad: veri.ad } : konu))
        )
      );
    } else {
      const { veri, hata } = await istekAt(`/api/sorular/${duzenlenen.id}`, "PUT", {
        metin: duzenlenen.metin,
      });

      if (hata) {
        setIslemHatasi(hata);
        return;
      }

      setKonular(
        konular.map((konu) => ({
          ...konu,
          sorular: konu.sorular.map((soru) => (soru.id === veri.id ? veri : soru)),
        }))
      );
    }

    setDuzenlenen(null);
    setIslemHatasi("");
  };

  const sil = async (hedef: Silinecek) => {
    setSilinecek(null);

    const adres =
      hedef.tur === "konu" ? `/api/konular/${hedef.id}` : `/api/sorular/${hedef.id}`;

    const { hata } = await istekAt(adres, "DELETE");

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    if (hedef.tur === "konu") {
      setKonular(konular.filter((konu) => konu.id !== hedef.id));
    } else {
      setKonular(
        konular.map((konu) => ({
          ...konu,
          sorular: konu.sorular.filter((soru) => soru.id !== hedef.id),
        }))
      );
    }

    setIslemHatasi("");
  };

  const duzenlemeAlani = () => (
    <div className="flex flex-1 items-center gap-3">
      <input
        type="text"
        value={duzenlenen?.metin ?? ""}
        onChange={(e) =>
          duzenlenen && setDuzenlenen({ ...duzenlenen, metin: e.target.value })
        }
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
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            Soru Havuzu
          </h1>

          <p className="mt-2 text-slate-600">
            Teknik mülakatlarda sorulacak soruları konu başlıkları altında toplayın.
          </p>
        </div>

        <button
          onClick={() => {
            setFormAcik(!formAcik);
            setFormHatasi("");
          }}
          className={stiller.birincilDugme}
        >
          <Plus size={18} />
          Konu Ekle
        </button>
      </div>

      {formAcik && (
        <div className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Konu Ekle
          </h2>

          <label className={stiller.etiket}>
            Konu Adı
          </label>

          <input
            type="text"
            value={yeniKonu}
            onChange={(e) => setYeniKonu(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && konuEkle()}
            placeholder="Örneğin: React, SQL, Nesne Yönelimli Programlama"
            className={stiller.girdi(formHatasi)}
          />

          {formHatasi && (
            <p className="mt-1 text-sm text-red-600">
              {formHatasi}
            </p>
          )}

          <button onClick={konuEkle} className={`mt-5 ${stiller.kaydetDugmesi}`}>
            Konuyu Kaydet
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className={stiller.bolumBasligi}>
          Konular
        </h2>

        {islemHatasi && (
          <p className="mb-4 text-red-600">{islemHatasi}</p>
        )}

        {yukleniyor ? (
          <p className="text-slate-600">Konular yükleniyor...</p>
        ) : listeHatasi ? (
          <p className="text-red-600">{listeHatasi}</p>
        ) : konular.length === 0 ? (
          <BosDurum
            ikon={<BookOpen size={24} />}
            mesaj="Henüz konu eklenmemiş. Önce bir konu ekleyip altına sorularını yazın."
          />
        ) : (
          <div className="space-y-6">
            {konular.map((konu) => (
              <div key={konu.id} className={stiller.kart}>
                {/* Konu başlığı */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  {duzenlenen?.tur === "konu" && duzenlenen.id === konu.id ? (
                    duzenlemeAlani()
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {konu.ad}
                        </h3>

                        <span className="rounded-full bg-marka-acik px-2.5 py-0.5 text-sm font-medium text-marka">
                          {konu.sorular.length} soru
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setDuzenlenen({ tur: "konu", id: konu.id, metin: konu.ad });
                            setIslemHatasi("");
                          }}
                          className={stiller.duzenleDugmesi}
                        >
                          <Pencil size={14} />
                          Düzenle
                        </button>

                        <button
                          onClick={() => setSilinecek({ tur: "konu", id: konu.id, ad: konu.ad })}
                          className={stiller.silDugmesi}
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Sorular */}
                {konu.sorular.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">
                    Bu konuda henüz soru yok.
                  </p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {konu.sorular.map((soru, sira) => (
                      <li key={soru.id} className="flex items-center gap-3 py-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {sira + 1}
                        </span>

                        {duzenlenen?.tur === "soru" && duzenlenen.id === soru.id ? (
                          duzenlemeAlani()
                        ) : (
                          <>
                            <p className="flex-1 text-slate-800">
                              {soru.metin}
                            </p>

                            <button
                              onClick={() => {
                                setDuzenlenen({ tur: "soru", id: soru.id, metin: soru.metin });
                                setIslemHatasi("");
                              }}
                              aria-label="Soruyu düzenle"
                              className={stiller.ikonDugmesi}
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() =>
                                setSilinecek({ tur: "soru", id: soru.id, ad: soru.metin })
                              }
                              aria-label="Soruyu sil"
                              className={stiller.ikonSilDugmesi}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Yeni soru */}
                <div className="mt-2 flex gap-3 border-t border-slate-200 pt-4">
                  <input
                    type="text"
                    value={yeniSorular[konu.id] || ""}
                    onChange={(e) =>
                      setYeniSorular({ ...yeniSorular, [konu.id]: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && soruEkle(konu.id)}
                    placeholder="Yeni soru yazın ve Enter'a basın"
                    className={stiller.duzenlemeGirdisi}
                  />

                  <button
                    onClick={() => soruEkle(konu.id)}
                    className={stiller.kucukKaydetDugmesi}
                  >
                    Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OnayKutusu
        acik={silinecek !== null}
        baslik={silinecek?.tur === "konu" ? "Konu silinsin mi?" : "Soru silinsin mi?"}
        mesaj={`"${silinecek?.ad}" kalıcı olarak silinecek.`}
        onOnayla={() => silinecek && sil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
