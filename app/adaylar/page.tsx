"use client";

import { useEffect, useState } from "react";
import { Download, Users, Mail, Pencil, Phone, Plus, SearchX, Trash2 } from "lucide-react";
import AramaCubugu, { metinIceriyor } from "../../components/AramaCubugu";
import BosDurum from "../../components/BosDurum";
import CvAlani from "../../components/CvAlani";
import OnayKutusu from "../../components/OnayKutusu";
import { Aday, useAdaylar } from "../context/AdayContext";
import { stiller } from "../../components/stiller";
import { istekAt } from "../../components/istekAt";
import { KararEtiketi } from "../../components/KararKarti";
import { VARSAYILAN_KARAR } from "../../components/karar";

// "Elif Yıldız" -> "EY"
const basHarfler = (adSoyad: string) =>
  adSoyad
    .split(" ")
    .filter(Boolean)
    .map((kelime) => kelime[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr");

type Pozisyon = {
  id: number;
  ad: string;
};

export default function Adaylar() {
  const { adaylar, yukleniyor, hata, adayEkle, adayGuncelle, adaySil, cvYukle, cvSil } =
    useAdaylar();
  const [formAcik, setFormAcik] = useState(false);

  const [adSoyad, setAdSoyad] = useState("");
  const [yas, setYas] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [pozisyonId, setPozisyonId] = useState("");

  const [pozisyonlar, setPozisyonlar] = useState<Pozisyon[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [duzenlenen, setDuzenlenen] = useState({
    adSoyad: "",
    yas: "",
    eposta: "",
    telefon: "",
    pozisyonId: "",
  });
  const [islemHatasi, setIslemHatasi] = useState("");
  const [silinecek, setSilinecek] = useState<Aday | null>(null);

  const [arama, setArama] = useState("");
  const [pozisyonSuzgeci, setPozisyonSuzgeci] = useState("");

  // Ad, e-posta ya da telefonda geçen + seçili pozisyondaki adaylar
  const gorunenAdaylar = adaylar.filter(
    (aday) =>
      (metinIceriyor(aday.adSoyad, arama) ||
        metinIceriyor(aday.eposta, arama) ||
        metinIceriyor(aday.telefon, arama)) &&
      (!pozisyonSuzgeci || aday.pozisyonId === Number(pozisyonSuzgeci))
  );

  // Pozisyon listesini veritabanından getir
  useEffect(() => {
    const pozisyonlariGetir = async () => {
      const { veri } = await istekAt("/api/pozisyonlar", "GET");

      if (veri) {
        setPozisyonlar(veri);
      }
    };

    pozisyonlariGetir();
  }, []);

  const [hatalar, setHatalar] = useState({
    adSoyad: "",
    yas: "",
    eposta: "",
    telefon: "",
    pozisyon: "",
    genel: "",
  });

  const adayKaydet = async () => {
    const yeniHatalar = {
      adSoyad: "",
      yas: "",
      eposta: "",
      telefon: "",
      pozisyon: "",
      genel: "",
    };

    if (!adSoyad.trim()) {
      yeniHatalar.adSoyad = "Ad Soyad alanı boş bırakılamaz.";
    }

    const yasSayisi = Number(yas);

    if (!yas) {
      yeniHatalar.yas = "Yaş alanı boş bırakılamaz.";
    } else if (yasSayisi < 18 || yasSayisi > 70) {
      yeniHatalar.yas = "Yaş 18 ile 70 arasında olmalıdır.";
    }

    // Biçim denetimi sunucuda (lib/adayDogrula.ts); burada yalnızca boşluk kontrolü
    if (!eposta.trim()) {
      yeniHatalar.eposta = "E-posta alanı boş bırakılamaz.";
    }

    if (!telefon.trim()) {
      yeniHatalar.telefon = "Telefon alanı boş bırakılamaz.";
    }

    if (!pozisyonId) {
      yeniHatalar.pozisyon = "Lütfen bir pozisyon seçin.";
    }

    setHatalar(yeniHatalar);

    if (Object.values(yeniHatalar).some((hata) => hata !== "")) {
      return;
    }

    setKaydediliyor(true);

    const sunucuHatasi = await adayEkle({
      adSoyad: adSoyad.trim(),
      yas: yasSayisi,
      eposta: eposta.trim(),
      telefon: telefon.trim(),
      pozisyonId: Number(pozisyonId),
    });

    setKaydediliyor(false);

    if (sunucuHatasi) {
      setHatalar({ ...yeniHatalar, genel: sunucuHatasi });
      return;
    }

    setAdSoyad("");
    setYas("");
    setEposta("");
    setTelefon("");
    setPozisyonId("");

    setFormAcik(false);
  };

  const duzenlemeyiKaydet = async () => {
    const yasSayisi = Number(duzenlenen.yas);

    if (!duzenlenen.adSoyad.trim()) {
      setIslemHatasi("Ad Soyad alanı boş bırakılamaz.");
      return;
    }

    if (!duzenlenen.yas || yasSayisi < 18 || yasSayisi > 70) {
      setIslemHatasi("Yaş 18 ile 70 arasında olmalıdır.");
      return;
    }

    if (!duzenlenen.eposta.trim() || !duzenlenen.telefon.trim()) {
      setIslemHatasi("E-posta ve telefon boş bırakılamaz.");
      return;
    }

    const sunucuHatasi = await adayGuncelle(duzenlenenId as number, {
      adSoyad: duzenlenen.adSoyad.trim(),
      yas: yasSayisi,
      eposta: duzenlenen.eposta.trim(),
      telefon: duzenlenen.telefon.trim(),
      pozisyonId: Number(duzenlenen.pozisyonId),
    });

    if (sunucuHatasi) {
      setIslemHatasi(sunucuHatasi);
      return;
    }

    setDuzenlenenId(null);
    setIslemHatasi("");
  };

  const adayiSil = async (aday: Aday) => {
    setSilinecek(null);

    const sunucuHatasi = await adaySil(aday.id);

    setIslemHatasi(sunucuHatasi || "");
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            Adaylar
          </h1>

          <p className="mt-2 text-slate-600">
            Sistemde kayıtlı adaylar burada listelenir.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Sunucu dosyayı ek olarak gönderir; tarayıcı sayfadan çıkmadan indirir */}
          <a href="/api/disa-aktar/adaylar" className={stiller.ikincilDugme}>
            <Download size={18} />
            CSV&apos;ye aktar
          </a>

          <button
            onClick={() => setFormAcik(!formAcik)}
            className={stiller.birincilDugme}
          >
            <Plus size={18} />
            Aday Ekle
          </button>
        </div>
      </div>

      {formAcik && (
        <div className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Aday Ekle
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
                placeholder="Adayın adını ve soyadını girin"
                className={stiller.girdi(hatalar.adSoyad)}
              />

              {hatalar.adSoyad && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.adSoyad}
                </p>
              )}
            </div>

            {/* Yaş */}
            <div>
              <label className={stiller.etiket}>
                Yaş
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={yas}
                onChange={(e) => {
                  const deger = e.target.value;

                  // Sadece rakam girilmesine izin ver
                  if (/^\d*$/.test(deger)) {
                    setYas(deger);
                  }
                }}
                placeholder="Adayın yaşını girin"
                className={stiller.girdi(hatalar.yas)}
              />

              {hatalar.yas && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.yas}
                </p>
              )}
            </div>

            {/* E-posta */}
            <div>
              <label className={stiller.etiket}>
                E-posta
              </label>

              <input
                type="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@eposta.com"
                className={stiller.girdi(hatalar.eposta)}
              />

              {hatalar.eposta && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.eposta}
                </p>
              )}
            </div>

            {/* Telefon */}
            <div>
              <label className={stiller.etiket}>
                Telefon
              </label>

              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="05xx xxx xx xx"
                className={stiller.girdi(hatalar.telefon)}
              />

              {hatalar.telefon && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.telefon}
                </p>
              )}
            </div>

            {/* Pozisyon */}
            <div>
              <label className={stiller.etiket}>
                Başvurulan Pozisyon
              </label>

              <select
                value={pozisyonId}
                onChange={(e) => setPozisyonId(e.target.value)}
                className={stiller.girdi(hatalar.pozisyon)}
              >
                <option value="">Pozisyon seçin</option>

                {pozisyonlar.map((pozisyon) => (
                  <option key={pozisyon.id} value={pozisyon.id}>
                    {pozisyon.ad}
                  </option>
                ))}
              </select>

              {hatalar.pozisyon && (
                <p className="mt-1 text-sm text-red-600">
                  {hatalar.pozisyon}
                </p>
              )}
            </div>

            {hatalar.genel && (
              <p className="text-sm text-red-600">
                {hatalar.genel}
              </p>
            )}

            {/* Kaydet */}
            <button
              onClick={adayKaydet}
              disabled={kaydediliyor}
              className={stiller.kaydetDugmesi}
            >
              {kaydediliyor ? "Kaydediliyor..." : "Adayı Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Kayıtlı Adaylar */}
      <div className="mt-10">
        <h2 className={stiller.bolumBasligi}>
          Kayıtlı Adaylar
        </h2>

        {islemHatasi && (
          <p className="mb-4 text-red-600">{islemHatasi}</p>
        )}

        {yukleniyor ? (
          <p className="text-slate-600">Adaylar yükleniyor...</p>
        ) : hata ? (
          <p className="text-red-600">{hata}</p>
        ) : adaylar.length === 0 ? (
          <BosDurum ikon={<Users size={24} />} mesaj="Henüz kayıtlı aday bulunmuyor." />
        ) : (
          <>
            <AramaCubugu
              arama={arama}
              onAramaDegistir={setArama}
              yerTutucu="Ad, e-posta ya da telefon ile ara"
              gosterilen={gorunenAdaylar.length}
              toplam={adaylar.length}
              onTemizle={() => {
                setArama("");
                setPozisyonSuzgeci("");
              }}
            >
              <select
                value={pozisyonSuzgeci}
                onChange={(e) => setPozisyonSuzgeci(e.target.value)}
                aria-label="Pozisyona göre süz"
                className={stiller.suzmeSecimi}
              >
                <option value="">Tüm pozisyonlar</option>

                {pozisyonlar.map((pozisyon) => (
                  <option key={pozisyon.id} value={pozisyon.id}>
                    {pozisyon.ad}
                  </option>
                ))}
              </select>
            </AramaCubugu>

            {gorunenAdaylar.length === 0 ? (
              <BosDurum ikon={<SearchX size={24} />} mesaj="Aramaya uyan aday bulunamadı." />
            ) : (
              <div className="space-y-4">
                {gorunenAdaylar.map((aday) => (
                  <div
                    key={aday.id}
                    className={stiller.kart}
                  >
                    {duzenlenenId === aday.id ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          value={duzenlenen.adSoyad}
                          onChange={(e) =>
                            setDuzenlenen({ ...duzenlenen, adSoyad: e.target.value })
                          }
                          onKeyDown={(e) => e.key === "Enter" && duzenlemeyiKaydet()}
                          className={stiller.duzenlemeGirdisi}
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          value={duzenlenen.yas}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              setDuzenlenen({ ...duzenlenen, yas: e.target.value });
                            }
                          }}
                          onKeyDown={(e) => e.key === "Enter" && duzenlemeyiKaydet()}
                          className="w-20 rounded-lg border border-slate-400 px-4 py-2 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                        />

                        <input
                          type="email"
                          value={duzenlenen.eposta}
                          onChange={(e) =>
                            setDuzenlenen({ ...duzenlenen, eposta: e.target.value })
                          }
                          onKeyDown={(e) => e.key === "Enter" && duzenlemeyiKaydet()}
                          placeholder="E-posta"
                          className={stiller.duzenlemeGirdisi}
                        />

                        <input
                          type="tel"
                          value={duzenlenen.telefon}
                          onChange={(e) =>
                            setDuzenlenen({ ...duzenlenen, telefon: e.target.value })
                          }
                          onKeyDown={(e) => e.key === "Enter" && duzenlemeyiKaydet()}
                          placeholder="Telefon"
                          className="w-44 rounded-lg border border-slate-400 px-4 py-2 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                        />

                        <select
                          value={duzenlenen.pozisyonId}
                          onChange={(e) =>
                            setDuzenlenen({
                              ...duzenlenen,
                              pozisyonId: e.target.value,
                            })
                          }
                          className={stiller.duzenlemeSecimi}
                        >
                          {pozisyonlar.map((pozisyon) => (
                            <option key={pozisyon.id} value={pozisyon.id}>
                              {pozisyon.ad}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={duzenlemeyiKaydet}
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
                      <div className={stiller.sayfaUstu}>
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marka-acik font-semibold text-marka">
                            {basHarfler(aday.adSoyad)}
                          </span>

                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {aday.adSoyad}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                              <span>{aday.yas} yaş</span>

                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                                {aday.pozisyon.ad}
                              </span>

                              {aday.karar !== VARSAYILAN_KARAR && (
                                <KararEtiketi karar={aday.karar} />
                              )}
                            </div>

                            {aday.eposta || aday.telefon ? (
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                <a href={`mailto:${aday.eposta}`} className="inline-flex items-center gap-1.5 hover:text-marka">
                                  <Mail size={14} />
                                  {aday.eposta}
                                </a>

                                <a href={`tel:${aday.telefon}`} className="inline-flex items-center gap-1.5 hover:text-marka">
                                  <Phone size={14} />
                                  {aday.telefon}
                                </a>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-amber-700">
                                İletişim bilgisi eksik. Düzenle ile ekleyin.
                              </p>
                            )}

                            <CvAlani
                              adayId={aday.id}
                              cv={aday.cv}
                              onYukle={(dosya) => cvYukle(aday.id, dosya)}
                              onSil={() => cvSil(aday.id)}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setDuzenlenenId(aday.id);
                              setDuzenlenen({
                                adSoyad: aday.adSoyad,
                                yas: String(aday.yas),
                                eposta: aday.eposta,
                                telefon: aday.telefon,
                                pozisyonId: String(aday.pozisyonId),
                              });
                              setIslemHatasi("");
                            }}
                            className={stiller.duzenleDugmesi}
                          >
                            <Pencil size={14} />
                            Düzenle
                          </button>

                          <button
                            onClick={() => setSilinecek(aday)}
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
          </>
        )}
      </div>
      <OnayKutusu
        acik={silinecek !== null}
        baslik="Aday silinsin mi?"
        mesaj={`"${silinecek?.adSoyad}" silinecek. Adayın mülakat kayıtları da silinir.`}
        onOnayla={() => silinecek && adayiSil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
