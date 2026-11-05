"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import BosDurum from "../../components/BosDurum";
import OnayKutusu from "../../components/OnayKutusu";
import SifreAlani from "../../components/SifreAlani";
import { istekAt } from "../../components/istekAt";
import { stiller } from "../../components/stiller";

type Kullanici = {
  id: number;
  kullaniciAdi: string;
  adSoyad: string;
  olusturulma: string;
  ben: boolean;
};

export default function Kullanicilar() {
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [listeHatasi, setListeHatasi] = useState("");
  const [islemHatasi, setIslemHatasi] = useState("");
  const [silinecek, setSilinecek] = useState<Kullanici | null>(null);

  // Yeni kullanıcı formu
  const [formAcik, setFormAcik] = useState(false);
  const [adSoyad, setAdSoyad] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [formHatasi, setFormHatasi] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Şifre değiştirme formu
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [sifreHatasi, setSifreHatasi] = useState("");
  const [sifreMesaji, setSifreMesaji] = useState("");
  const [sifreGonderiliyor, setSifreGonderiliyor] = useState(false);

  // Başkasının şifresini sıfırlama (kartın içinde açılır)
  const [sifirlanacakId, setSifirlanacakId] = useState<number | null>(null);
  const [geciciSifre, setGeciciSifre] = useState("");
  const [sifirlamaHatasi, setSifirlamaHatasi] = useState("");
  const [sifirlamaMesaji, setSifirlamaMesaji] = useState("");

  useEffect(() => {
    const kullanicilariGetir = async () => {
      const { veri, hata } = await istekAt("/api/kullanicilar", "GET");

      if (hata) {
        setListeHatasi(hata);
      } else {
        setKullanicilar(veri);
      }

      setYukleniyor(false);
    };

    kullanicilariGetir();
  }, []);

  const kullaniciKaydet = async (e: React.FormEvent) => {
    e.preventDefault();

    setKaydediliyor(true);
    setFormHatasi("");

    const { veri, hata } = await istekAt("/api/kullanicilar", "POST", {
      adSoyad,
      kullaniciAdi,
      sifre,
    });

    setKaydediliyor(false);

    if (hata) {
      setFormHatasi(hata);
      return;
    }

    setKullanicilar(
      [...kullanicilar, veri].sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"))
    );
    setAdSoyad("");
    setKullaniciAdi("");
    setSifre("");
    setFormAcik(false);
  };

  const kullaniciSil = async (kullanici: Kullanici) => {
    setSilinecek(null);

    const { hata } = await istekAt(`/api/kullanicilar/${kullanici.id}`, "DELETE");

    if (hata) {
      setIslemHatasi(hata);
      return;
    }

    setKullanicilar(kullanicilar.filter((mevcut) => mevcut.id !== kullanici.id));
    setIslemHatasi("");
  };

  const sifirlamayiAc = (kullanici: Kullanici) => {
    setSifirlanacakId(kullanici.id);
    setGeciciSifre("");
    setSifirlamaHatasi("");
    setSifirlamaMesaji("");
  };

  const sifreSifirla = async (e: React.FormEvent, kullanici: Kullanici) => {
    e.preventDefault();

    const { hata } = await istekAt(`/api/kullanicilar/${kullanici.id}/sifre`, "PUT", {
      yeniSifre: geciciSifre,
    });

    if (hata) {
      setSifirlamaHatasi(hata);
      return;
    }

    setSifirlanacakId(null);
    setSifirlamaMesaji(`${kullanici.adSoyad} için yeni geçici şifre kaydedildi. Şifreyi kişiye iletin; giriş yaptıktan sonra kendi şifresini belirleyebilir.`);
  };

  const sifreDegistir = async (e: React.FormEvent) => {
    e.preventDefault();

    setSifreMesaji("");

    if (yeniSifre !== yeniSifreTekrar) {
      setSifreHatasi("Yeni şifreler birbiriyle aynı değil.");
      return;
    }

    setSifreGonderiliyor(true);
    setSifreHatasi("");

    const { hata } = await istekAt("/api/sifre", "PUT", { mevcutSifre, yeniSifre });

    setSifreGonderiliyor(false);

    if (hata) {
      setSifreHatasi(hata);
      return;
    }

    setMevcutSifre("");
    setYeniSifre("");
    setYeniSifreTekrar("");
    setSifreMesaji("Şifreniz değiştirildi.");
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className={stiller.sayfaUstu}>
        <div>
          <h1 className={stiller.sayfaBasligi}>
            Kullanıcılar
          </h1>

          <p className="mt-2 text-slate-600">
            Sisteme giriş yapabilecek kişiler. Yeni hesabı burada açıp kişiye kullanıcı adını ve geçici şifresini iletin.
          </p>
        </div>

        <button
          onClick={() => setFormAcik(!formAcik)}
          className={stiller.birincilDugme}
        >
          <Plus size={18} />
          Kullanıcı Ekle
        </button>
      </div>

      {formAcik && (
        <form onSubmit={kullaniciKaydet} className={stiller.formPaneli}>
          <h2 className={stiller.formBasligi}>
            Yeni Kullanıcı Ekle
          </h2>

          <div className="space-y-5">
            <div>
              <label htmlFor="adSoyad" className={stiller.etiket}>Ad Soyad</label>
              <input
                id="adSoyad"
                type="text"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                placeholder="Kullanıcının adını ve soyadını girin"
                autoComplete="off"
                required
                className={stiller.girdi()}
              />
            </div>

            <div>
              <label htmlFor="kullaniciAdi" className={stiller.etiket}>Kullanıcı adı</label>
              <input
                id="kullaniciAdi"
                type="text"
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
                placeholder="En az 3 karakter, boşluksuz"
                autoComplete="off"
                required
                className={stiller.girdi()}
              />
            </div>

            <div>
              <label htmlFor="sifre" className={stiller.etiket}>Geçici şifre</label>
              <SifreAlani
                id="sifre"
                value={sifre}
                onChange={setSifre}
                placeholder="En az 6 karakter"
                autoComplete="new-password"
                required
                sinif={stiller.girdi()}
              />
              <p className="mt-1 text-xs text-slate-500">
                Kişi giriş yaptıktan sonra bu sayfadan kendi şifresini değiştirebilir.
              </p>
            </div>

            {formHatasi && (
              <p className="text-sm text-red-600">{formHatasi}</p>
            )}

            <button
              type="submit"
              disabled={kaydediliyor}
              className={stiller.kaydetDugmesi}
            >
              {kaydediliyor ? "Kaydediliyor..." : "Kullanıcıyı Kaydet"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-10">
        <h2 className={stiller.bolumBasligi}>
          Kayıtlı Kullanıcılar
        </h2>

        {islemHatasi && (
          <p className="mb-4 text-red-600">{islemHatasi}</p>
        )}

        {sifirlamaMesaji && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{sifirlamaMesaji}</p>
        )}

        {yukleniyor ? (
          <p className="text-slate-600">Kullanıcılar yükleniyor...</p>
        ) : listeHatasi ? (
          <p className="text-red-600">{listeHatasi}</p>
        ) : kullanicilar.length === 0 ? (
          <BosDurum ikon={<Users size={24} />} mesaj="Henüz kayıtlı kullanıcı bulunmuyor." />
        ) : (
          <div className="space-y-4">
            {kullanicilar.map((kullanici) => (
              <div key={kullanici.id} className={stiller.kart}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {kullanici.adSoyad}
                      </h3>

                      {kullanici.ben && (
                        <span className="rounded-full bg-marka-acik px-3 py-1 text-sm font-medium text-marka">
                          Siz
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {kullanici.kullaniciAdi}
                    </p>
                  </div>

                  {/* Kendi hesabını silmek ve kendi şifreni buradan sıfırlamak sunucuda da engelli; düğmeler gösterilmez */}
                  {!kullanici.ben && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => sifirlamayiAc(kullanici)}
                        className={stiller.duzenleDugmesi}
                      >
                        <RotateCcw size={14} />
                        Şifre sıfırla
                      </button>

                      <button
                        onClick={() => setSilinecek(kullanici)}
                        className={stiller.silDugmesi}
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </div>
                  )}
                </div>

                {sifirlanacakId === kullanici.id && (
                  <form
                    onSubmit={(e) => sifreSifirla(e, kullanici)}
                    className="mt-4 space-y-3 border-t border-slate-200 pt-4"
                  >
                    <label htmlFor={`geciciSifre-${kullanici.id}`} className={stiller.etiket}>
                      Yeni geçici şifre
                    </label>

                    <SifreAlani
                      id={`geciciSifre-${kullanici.id}`}
                      value={geciciSifre}
                      onChange={setGeciciSifre}
                      placeholder="En az 6 karakter"
                      autoComplete="new-password"
                      required
                      autoFocus
                      sinif={stiller.girdi()}
                    />

                    <p className="text-xs text-slate-500">
                      Kaydedince kişinin hesap kilidi açılır ve açık oturumları kapanır.
                    </p>

                    {sifirlamaHatasi && <p className="text-sm text-red-600">{sifirlamaHatasi}</p>}

                    <div className="flex gap-3">
                      <button type="submit" className={stiller.kucukKaydetDugmesi}>
                        Şifreyi Kaydet
                      </button>
                      <button type="button" onClick={() => setSifirlanacakId(null)} className={stiller.vazgecDugmesi}>
                        Vazgeç
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={sifreDegistir} className={stiller.formPaneli}>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900">
          <KeyRound size={20} className="text-slate-500" />
          Şifremi Değiştir
        </h2>

        <div className="space-y-5">
          <div>
            <label htmlFor="mevcutSifre" className={stiller.etiket}>Mevcut şifre</label>
            <SifreAlani
              id="mevcutSifre"
              value={mevcutSifre}
              onChange={setMevcutSifre}
              autoComplete="current-password"
              required
              sinif={stiller.girdi()}
            />
          </div>

          <div>
            <label htmlFor="yeniSifre" className={stiller.etiket}>Yeni şifre</label>
            <SifreAlani
              id="yeniSifre"
              value={yeniSifre}
              onChange={setYeniSifre}
              placeholder="En az 6 karakter"
              autoComplete="new-password"
              required
              sinif={stiller.girdi()}
            />
          </div>

          <div>
            <label htmlFor="yeniSifreTekrar" className={stiller.etiket}>Yeni şifre (tekrar)</label>
            <SifreAlani
              id="yeniSifreTekrar"
              value={yeniSifreTekrar}
              onChange={setYeniSifreTekrar}
              autoComplete="new-password"
              required
              sinif={stiller.girdi()}
            />
          </div>

          {sifreHatasi && (
            <p className="text-sm text-red-600">{sifreHatasi}</p>
          )}

          {sifreMesaji && (
            <p className="text-sm text-emerald-700">{sifreMesaji}</p>
          )}

          <button
            type="submit"
            disabled={sifreGonderiliyor}
            className={stiller.kaydetDugmesi}
          >
            {sifreGonderiliyor ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </div>
      </form>

      <OnayKutusu
        acik={silinecek !== null}
        baslik="Kullanıcı silinsin mi?"
        mesaj={`"${silinecek?.adSoyad}" hesabı silinecek ve açık oturumları kapanacak. Bu kişi artık giriş yapamaz.`}
        onOnayla={() => silinecek && kullaniciSil(silinecek)}
        onVazgec={() => setSilinecek(null)}
      />
    </main>
  );
}
