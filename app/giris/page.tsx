"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Info, LogIn, UserPlus } from "lucide-react";
import { istekAt } from "../../components/istekAt";
import SifreAlani from "../../components/SifreAlani";

const girdiSinifi =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20";

const etiketSinifi = "mb-1 block text-sm font-medium text-slate-800";

export default function Giris() {
  // null: henüz bilinmiyor; true: hiç kullanıcı yok, ilk kullanıcı oluşturulacak
  const [kurulumGerekli, setKurulumGerekli] = useState<boolean | null>(null);

  const [adSoyad, setAdSoyad] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");

  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [unuttumAcik, setUnuttumAcik] = useState(false);

  useEffect(() => {
    const durumuGetir = async () => {
      const { veri, hata: durumHatasi } = await istekAt("/api/giris", "GET");

      if (durumHatasi) {
        setHata(durumHatasi);
      } else {
        setKurulumGerekli(veri.kurulumGerekli);
      }
    };

    durumuGetir();
  }, []);

  // Form gönderilince sayfanın yenilenmesini engeller ve giriş ya da kurulum isteği atar
  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (kurulumGerekli && sifre !== sifreTekrar) {
      setHata("Şifreler birbiriyle aynı değil.");
      return;
    }

    setGonderiliyor(true);
    setHata("");

    const { hata: istekHatasi } = kurulumGerekli
      ? await istekAt("/api/kurulum", "POST", { adSoyad, kullaniciAdi, sifre })
      : await istekAt("/api/giris", "POST", { kullaniciAdi, sifre });

    if (istekHatasi) {
      setHata(istekHatasi);
      setGonderiliyor(false);
      return;
    }

    // Tam sayfa yenilemesi: ortak aday verisi oturumla birlikte baştan yüklensin
    window.location.replace("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-marka text-white">
            <ClipboardList size={26} />
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Mülakat Yönetim Sistemi
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {kurulumGerekli
              ? "İlk kullanım: yönetici hesabını oluşturun"
              : "Devam etmek için giriş yapın"}
          </p>
        </div>

        <form
          onSubmit={gonder}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {kurulumGerekli && (
            <div>
              <label htmlFor="adSoyad" className={etiketSinifi}>Ad Soyad</label>
              <input
                id="adSoyad"
                type="text"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                autoComplete="name"
                required
                className={girdiSinifi}
              />
            </div>
          )}

          <div>
            <label htmlFor="kullaniciAdi" className={etiketSinifi}>Kullanıcı adı</label>
            <input
              id="kullaniciAdi"
              type="text"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className={girdiSinifi}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="sifre" className="block text-sm font-medium text-slate-800">Şifre</label>

              {kurulumGerekli === false && (
                <button
                  type="button"
                  onClick={() => setUnuttumAcik(!unuttumAcik)}
                  aria-expanded={unuttumAcik}
                  className="text-sm font-medium text-marka hover:underline"
                >
                  Şifremi unuttum
                </button>
              )}
            </div>
            <SifreAlani
              id="sifre"
              value={sifre}
              onChange={setSifre}
              autoComplete={kurulumGerekli ? "new-password" : "current-password"}
              required
              sinif={girdiSinifi}
            />
            {kurulumGerekli && (
              <p className="mt-1 text-xs text-slate-500">En az 6 karakter.</p>
            )}
          </div>

          {kurulumGerekli && (
            <div>
              <label htmlFor="sifreTekrar" className={etiketSinifi}>Şifre (tekrar)</label>
              <SifreAlani
                id="sifreTekrar"
                value={sifreTekrar}
                onChange={setSifreTekrar}
                autoComplete="new-password"
                required
                sinif={girdiSinifi}
              />
            </div>
          )}

          {/* E-posta gönderimi olmadığı için şifre sistemi bilen biri tarafından sıfırlanır */}
          {unuttumAcik && (
            <div className="flex gap-3 rounded-lg bg-marka-acik p-4 text-sm text-slate-700">
              <Info size={18} className="mt-0.5 shrink-0 text-marka" />
              <div className="space-y-1.5">
                <p>
                  Hesabı olan bir yöneticiye başvurun; <span className="font-medium">Kullanıcılar</span>{" "}
                  sayfasından size yeni geçici şifre verebilir.
                </p>
                <p className="text-slate-500">
                  Kimse giriş yapamıyorsa, uygulamanın kurulu olduğu bilgisayarda{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-xs">npm run sifre-sifirla</code>{" "}
                  komutuyla şifre sıfırlanabilir.
                </p>
              </div>
            </div>
          )}

          {hata && <p className="text-sm text-red-600">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor || kurulumGerekli === null}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-marka px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-marka-koyu disabled:opacity-60"
          >
            {kurulumGerekli ? <UserPlus size={18} /> : <LogIn size={18} />}
            {kurulumGerekli ? "Hesabı Oluştur" : "Giriş Yap"}
          </button>
        </form>
      </div>
    </main>
  );
}
