"use client";

import { useEffect, useState } from "react";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import BosDurum from "../../components/BosDurum";
import OnayKutusu from "../../components/OnayKutusu";
import { useAdaylar } from "../context/AdayContext";
import { stiller } from "../../components/stiller";
import { istekAt } from "../../components/istekAt";

type Pozisyon = {
  id: number;
  ad: string;
};

export default function Pozisyonlar() {
  const { adaylar, adaylariYenile } = useAdaylar();

  const adaySayisi = (pozisyonId: number) =>
    adaylar.filter((aday) => aday.pozisyonId === pozisyonId).length;

  const [formAcik, setFormAcik] = useState(false);
  const [pozisyonAdi, setPozisyonAdi] = useState("");

  const [pozisyonlar, setPozisyonlar] = useState<Pozisyon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [listeHatasi, setListeHatasi] = useState("");
  const [formHatasi, setFormHatasi] = useState("");

  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [duzenlenenAd, setDuzenlenenAd] = useState("");
  const [islemHatasi, setIslemHatasi] = useState("");
  const [silinecek, setSilinecek] = useState<Pozisyon | null>(null);

  // Sayfa açıldığında pozisyonları veritabanından getir
  useEffect(() => {
    const pozisyonlariGetir = async () => {
      const { veri, hata } = await istekAt("/api/pozisyonlar", "GET");

      if (hata) {
        setListeHatasi(hata);
      } else {
        setPozisyonlar(veri);
      }

      setYukleniyor(false);
    };

    pozisyonlariGetir();
  }, []);

  const pozisyonKaydet = async () => {
    if (!pozisyonAdi.trim()) {
      setFormHatasi("Lütfen pozisyon adını girin.");
      return;
    }

    setKaydediliyor(true);
    setFormHatasi("");

    const { veri, hata } = await istekAt("/api/pozisyonlar", "POST", { ad: pozisyonAdi });

    setKaydediliyor(false);

    if (hata) {
      setFormHatasi(hata);
      return;
    }

    const yeniListe = [...pozisyonlar, veri].sort((a, b) =>
      a.ad.localeCompare(b.ad, "tr")
    );

    setPozisyonlar(yeniListe);
    setPozisyonAdi("");
    setFormAcik(false);
  };

  const pozisyonGuncelle = async () => {
    if (!duzenlenenAd.trim()) {
      setIslemHatasi("Pozisyon adı boş bırakılamaz.");
      return;
    }

    const { veri, hata } = await istekAt(`/api/pozisyonlar/${duzenlenenId}`, "PUT", {
      ad: duzenlenenAd,
    });

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    const yeniListe = pozisyonlar
      .map((pozisyon) => (pozisyon.id === veri.id ? veri : pozisyon))
      .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

    setPozisyonlar(yeniListe);
    setDuzenlenenId(null);
    setIslemHatasi("");

    // Aday kartlarında pozisyonun yeni adı görünsün
    adaylariYenile();
  };

  const pozisyonSil = async (pozisyon: Pozisyon) => {
    setSilinecek(null);

    const { hata } = await istekAt(`/api/pozisyonlar/${pozisyon.id}`, "DELETE");

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    setPozisyonlar(pozisyonlar.filter((mevcut) => mevcut.id !== pozisyon.id));
    setIslemHatasi("");
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            Pozisyonlar
          </h1>

          <p className="mt-2 text-slate-600">
            Sistemde tanımlı pozisyonlar burada listelenir.
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
          Pozisyon Ekle
        </button>
      </div>

      {formAcik && (
        <div className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Pozisyon Ekle
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Pozisyon Adı
            </label>

            <input
              type="text"
              value={pozisyonAdi}
              onChange={(e) => setPozisyonAdi(e.target.value)}
              placeholder="Örneğin: Software Engineer"
              className={stiller.girdi(formHatasi)}
            />

            {formHatasi && (
              <p className="mt-1 text-sm text-red-600">
                {formHatasi}
              </p>
            )}
          </div>

          <button
            onClick={pozisyonKaydet}
            disabled={kaydediliyor}
            className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {kaydediliyor ? "Kaydediliyor..." : "Pozisyonu Kaydet"}
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className={stiller.bolumBasligi}>
          Tanımlı Pozisyonlar
        </h2>

        {islemHatasi && (
          <p className="mb-4 text-red-600">{islemHatasi}</p>
        )}

        {yukleniyor ? (
          <p className="text-slate-600">Pozisyonlar yükleniyor...</p>
        ) : listeHatasi ? (
          <p className="text-red-600">{listeHatasi}</p>
        ) : pozisyonlar.length === 0 ? (
          <BosDurum ikon={<Briefcase size={24} />} mesaj="Henüz tanımlı pozisyon bulunmuyor." />
        ) : (
          <div className="space-y-4">
            {pozisyonlar.map((pozisyon) => (
              <div
                key={pozisyon.id}
                className={stiller.kart}
              >
                {duzenlenenId === pozisyon.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={duzenlenenAd}
                      onChange={(e) => setDuzenlenenAd(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && pozisyonGuncelle()}
                      className={stiller.duzenlemeGirdisi}
                    />

                    <button
                      onClick={pozisyonGuncelle}
                      className={stiller.kucukKaydetDugmesi}
                    >
                      Kaydet
                    </button>

                    <button
                      onClick={() => setDuzenlenenId(null)}
                      className={stiller.vazgecDugmesi}
                    >
                      Vazgeç
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {pozisyon.ad}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-600">
                        {adaySayisi(pozisyon.id)} aday
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDuzenlenenId(pozisyon.id);
                          setDuzenlenenAd(pozisyon.ad);
                          setIslemHatasi("");
                        }}
                        className={stiller.duzenleDugmesi}
                      >
                        <Pencil size={14} />
                        Düzenle
                      </button>

                      <button
                        onClick={() => setSilinecek(pozisyon)}
                        className={stiller.silDugmesi}
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <OnayKutusu
        acik={silinecek !== null}
        baslik="Pozisyon silinsin mi?"
        mesaj={`"${silinecek?.ad}" pozisyonu kalıcı olarak silinecek.`}
        onOnayla={() => silinecek && pozisyonSil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
