"use client";

import { useEffect, useState } from "react";
import { UserCheck, Pencil, Plus, Trash2 } from "lucide-react";
import BosDurum from "../../components/BosDurum";
import OnayKutusu from "../../components/OnayKutusu";
import { stiller } from "../../components/stiller";
import { istekAt } from "../../components/istekAt";

type Alan = "ik" | "teknik";

type Mulakatci = {
  id: number;
  adSoyad: string;
  alan: Alan;
  kullaniciId: number | null;
};

type Kullanici = {
  id: number;
  adSoyad: string;
  kullaniciAdi: string;
};

const alanAdi = (alan: Alan) => (alan === "ik" ? "İK" : "Teknik");

const alanRengi = (alan: Alan) =>
  alan === "ik"
    ? "bg-violet-100 text-violet-700"
    : "bg-sky-100 text-sky-700";

export default function Mulakatcilar() {
  const [formAcik, setFormAcik] = useState(false);
  const [adSoyad, setAdSoyad] = useState("");
  const [alan, setAlan] = useState("");

  const [mulakatcilar, setMulakatcilar] = useState<Mulakatci[]>([]);
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [listeHatasi, setListeHatasi] = useState("");

  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [duzenlenenAdSoyad, setDuzenlenenAdSoyad] = useState("");
  const [duzenlenenAlan, setDuzenlenenAlan] = useState<Alan>("ik");
  const [islemHatasi, setIslemHatasi] = useState("");
  const [silinecek, setSilinecek] = useState<Mulakatci | null>(null);
  const [hatalar, setHatalar] = useState({
    adSoyad: "",
    alan: "",
    genel: "",
  });

  // Sayfa açıldığında mülakatçıları veritabanından getir
  useEffect(() => {
    const mulakatcilariGetir = async () => {
      const { veri, hata } = await istekAt("/api/mulakatcilar", "GET");

      if (hata) {
        setListeHatasi(hata);
      } else {
        setMulakatcilar(veri);
      }

      setYukleniyor(false);
    };

    mulakatcilariGetir();
  }, []);

  // "Hesap" seçimi için uygulamadaki kullanıcılar
  useEffect(() => {
    const kullanicilariGetir = async () => {
      const { veri } = await istekAt("/api/kullanicilar", "GET");

      if (veri) {
        setKullanicilar(veri);
      }
    };

    kullanicilariGetir();
  }, []);

  // Mülakatçıyı bir hesaba bağlar; o hesap ana sayfada kendine atanan mülakatları görür
  const hesapBagla = async (mulakatci: Mulakatci, kullaniciId: string) => {
    const { veri, hata } = await istekAt(`/api/mulakatcilar/${mulakatci.id}/hesap`, "PUT", {
      kullaniciId: kullaniciId || null,
    });

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    setMulakatcilar(
      mulakatcilar.map((mevcut) => (mevcut.id === veri.id ? veri : mevcut))
    );
    setIslemHatasi("");
  };

  const mulakatciKaydet = async () => {
    const yeniHatalar = {
      adSoyad: "",
      alan: "",
      genel: "",
    };

    if (!adSoyad.trim()) {
      yeniHatalar.adSoyad = "Ad Soyad alanı boş bırakılamaz.";
    }

    if (!alan) {
      yeniHatalar.alan = "Lütfen bir alan seçin.";
    }

    setHatalar(yeniHatalar);

    if (Object.values(yeniHatalar).some((hata) => hata !== "")) {
      return;
    }

    setKaydediliyor(true);

    const { veri, hata } = await istekAt("/api/mulakatcilar", "POST", { adSoyad, alan });

    setKaydediliyor(false);

    if (hata) {
      setHatalar({ ...yeniHatalar, genel: hata });
      return;
    }

    const yeniListe = [...mulakatcilar, veri].sort((a, b) =>
      a.adSoyad.localeCompare(b.adSoyad, "tr")
    );

    setMulakatcilar(yeniListe);
    setAdSoyad("");
    setAlan("");
    setFormAcik(false);
  };

  const mulakatciGuncelle = async () => {
    if (!duzenlenenAdSoyad.trim()) {
      setIslemHatasi("Ad Soyad alanı boş bırakılamaz.");
      return;
    }

    const { veri, hata } = await istekAt(`/api/mulakatcilar/${duzenlenenId}`, "PUT", {
      adSoyad: duzenlenenAdSoyad,
      alan: duzenlenenAlan,
    });

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    const yeniListe = mulakatcilar
      .map((mulakatci) => (mulakatci.id === veri.id ? veri : mulakatci))
      .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));

    setMulakatcilar(yeniListe);
    setDuzenlenenId(null);
    setIslemHatasi("");
  };

  const mulakatciSil = async (mulakatci: Mulakatci) => {
    setSilinecek(null);

    const { hata } = await istekAt(`/api/mulakatcilar/${mulakatci.id}`, "DELETE");

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    setMulakatcilar(mulakatcilar.filter((mevcut) => mevcut.id !== mulakatci.id));
    setIslemHatasi("");
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            Mülakatçılar
          </h1>

          <p className="mt-2 text-slate-600">
            Mülakatları gerçekleştirecek kişiler burada listelenir.
          </p>
        </div>

        <button
          onClick={() => setFormAcik(!formAcik)}
          className={stiller.birincilDugme}
        >
          <Plus size={18} />
          Mülakatçı Ekle
        </button>
      </div>

      {formAcik && (
        <div className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Mülakatçı Ekle
          </h2>

          <div className="space-y-5">
            {/* Ad Soyad */}
            <div>
              <label className={stiller.etiket}>
                Ad Soyad
              </label>

              <input
                type="text"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                placeholder="Mülakatçının adını ve soyadını girin"
                className={stiller.girdi(hatalar.adSoyad)}
              />

              {hatalar.adSoyad && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.adSoyad}
                </p>
              )}
            </div>

            {/* Alan */}
            <div>
              <label className={stiller.etiket}>
                Mülakat Alanı
              </label>

              <select
                value={alan}
                onChange={(e) => setAlan(e.target.value)}
                className={stiller.girdi(hatalar.alan)}
              >
                <option value="">Alan seçin</option>
                <option value="ik">İK</option>
                <option value="teknik">Teknik</option>
              </select>

              {hatalar.alan && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.alan}
                </p>
              )}
            </div>

            {hatalar.genel && (
              <p className="text-sm text-red-600">
                {hatalar.genel}
              </p>
            )}

            <button
              onClick={mulakatciKaydet}
              disabled={kaydediliyor}
              className={stiller.kaydetDugmesi}
            >
              {kaydediliyor ? "Kaydediliyor..." : "Mülakatçıyı Kaydet"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className={stiller.bolumBasligi}>
          Tanımlı Mülakatçılar
        </h2>

        {islemHatasi && (
          <p className="mb-4 text-red-600">{islemHatasi}</p>
        )}

        {yukleniyor ? (
          <p className="text-slate-600">Mülakatçılar yükleniyor...</p>
        ) : listeHatasi ? (
          <p className="text-red-600">{listeHatasi}</p>
        ) : mulakatcilar.length === 0 ? (
          <BosDurum ikon={<UserCheck size={24} />} mesaj="Henüz tanımlı mülakatçı bulunmuyor." />
        ) : (
          <div className="space-y-4">
            {mulakatcilar.map((mulakatci) => (
              <div
                key={mulakatci.id}
                className={stiller.kart}
              >
                {duzenlenenId === mulakatci.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={duzenlenenAdSoyad}
                      onChange={(e) => setDuzenlenenAdSoyad(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && mulakatciGuncelle()}
                      className={stiller.duzenlemeGirdisi}
                    />

                    <select
                      value={duzenlenenAlan}
                      onChange={(e) => setDuzenlenenAlan(e.target.value as Alan)}
                      className={stiller.duzenlemeSecimi}
                    >
                      <option value="ik">İK</option>
                      <option value="teknik">Teknik</option>
                    </select>

                    <button
                      onClick={mulakatciGuncelle}
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
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {mulakatci.adSoyad}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${alanRengi(
                          mulakatci.alan
                        )}`}
                      >
                        {alanAdi(mulakatci.alan)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={mulakatci.kullaniciId ?? ""}
                        onChange={(e) => hesapBagla(mulakatci, e.target.value)}
                        aria-label={`${mulakatci.adSoyad} için uygulama hesabı`}
                        title="Bu mülakatçının uygulamadaki hesabı: atanan mülakatlar o hesabın ana sayfasında görünür"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                      >
                        <option value="">Hesap bağlı değil</option>

                        {kullanicilar.map((kullanici) => (
                          <option key={kullanici.id} value={kullanici.id}>
                            Hesap: {kullanici.adSoyad}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          setDuzenlenenId(mulakatci.id);
                          setDuzenlenenAdSoyad(mulakatci.adSoyad);
                          setDuzenlenenAlan(mulakatci.alan);
                          setIslemHatasi("");
                        }}
                        className={stiller.duzenleDugmesi}
                      >
                        <Pencil size={14} />
                        Düzenle
                      </button>

                      <button
                        onClick={() => setSilinecek(mulakatci)}
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
        baslik="Mülakatçı silinsin mi?"
        mesaj={`"${silinecek?.adSoyad}" silinecek. Atandığı mülakatlarda kişi alanı boşalır.`}
        onOnayla={() => silinecek && mulakatciSil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
