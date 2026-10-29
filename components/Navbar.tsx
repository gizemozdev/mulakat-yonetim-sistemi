"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, LogOut, Menu, UserCog, X } from "lucide-react";
import { istekAt } from "./istekAt";

const baglantilar = [
  { href: "/", ad: "Ana Sayfa" },
  { href: "/adaylar", ad: "Adaylar" },
  { href: "/pozisyonlar", ad: "Pozisyonlar" },
  { href: "/mulakatcilar", ad: "Mülakatçılar" },
  { href: "/soru-havuzu", ad: "Soru Havuzu" },
  { href: "/ik-akislari", ad: "İK Akışları" },
  { href: "/mulakatlar", ad: "Mülakatlar" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuAcik, setMenuAcik] = useState(false);
  const [kullaniciAdi, setKullaniciAdi] = useState("");

  // Giriş yapmış kullanıcının adını getir (giriş ekranında menü zaten gösterilmiyor)
  useEffect(() => {
    if (pathname === "/giris") return;

    const kullaniciyiGetir = async () => {
      const { veri } = await istekAt("/api/oturum", "GET");

      if (veri) {
        setKullaniciAdi(veri.adSoyad);
      }
    };

    kullaniciyiGetir();
  }, [pathname]);

  const cikisYap = async () => {
    await istekAt("/api/cikis", "POST");
    window.location.replace("/giris");
  };

  if (pathname === "/giris") return null;

  // Sağdaki ikon bağlantıları (İstatistikler, Kullanıcılar); karşılaştırma da İstatistikler sayılır
  const ikonSinifi = (aktif: boolean) =>
    `rounded-lg border p-2 transition ${aktif
      ? "border-marka/30 bg-marka-acik text-marka"
      : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  // Bulunulan sayfanın bağlantısı vurgulanır
  const baglantiSinifi = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === href
      ? "bg-marka-acik text-marka"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marka text-white">
            <ClipboardList size={20} />
          </span>
          <span className="xl:inline lg:hidden">Mülakat Yönetim Sistemi</span>
        </Link>

        {/* Geniş ekran menüsü */}
        <div className="hidden items-center gap-1 lg:flex">
          {baglantilar.map((baglanti) => (
            <Link
              key={baglanti.href}
              href={baglanti.href}
              className={baglantiSinifi(baglanti.href)}
            >
              {baglanti.ad}
            </Link>
          ))}

          <Link
            href="/istatistikler"
            title="İstatistikler"
            aria-label="İstatistikler"
            className={`ml-2 ${ikonSinifi(pathname === "/istatistikler" || pathname === "/karsilastirma")}`}
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/kullanicilar"
            title="Kullanıcılar ve şifre"
            aria-label="Kullanıcılar ve şifre"
            className={ikonSinifi(pathname === "/kullanicilar")}
          >
            <UserCog size={18} />
          </Link>

          <button
            onClick={cikisYap}
            title={kullaniciAdi ? `${kullaniciAdi} · Çıkış yap` : "Çıkış yap"}
            aria-label="Çıkış yap"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Telefon menü düğmesi */}
        <button
          onClick={() => setMenuAcik(!menuAcik)}
          aria-label="Menüyü aç veya kapat"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {menuAcik ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuAcik && (
        <div className="flex flex-col gap-1 border-t border-slate-200 px-6 py-3 lg:hidden">
          {baglantilar.map((baglanti) => (
            <Link
              key={baglanti.href}
              href={baglanti.href}
              onClick={() => setMenuAcik(false)}
              className={baglantiSinifi(baglanti.href)}
            >
              {baglanti.ad}
            </Link>
          ))}

          <Link
            href="/istatistikler"
            onClick={() => setMenuAcik(false)}
            className={baglantiSinifi("/istatistikler")}
          >
            İstatistikler
          </Link>

          <Link
            href="/kullanicilar"
            onClick={() => setMenuAcik(false)}
            className={baglantiSinifi("/kullanicilar")}
          >
            Kullanıcılar ve şifre
          </Link>

          <button
            onClick={cikisYap}
            className="mt-2 flex items-center gap-2 rounded-lg border-t border-slate-200 px-3 pt-4 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <LogOut size={16} />
            Çıkış yap{kullaniciAdi && ` (${kullaniciAdi})`}
          </button>
        </div>
      )}
    </nav>
  );
}
