"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CalendarX,
  CircleCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useAdaylar } from "./context/AdayContext";
import { stiller } from "../components/stiller";
import { istekAt } from "../components/istekAt";
import { DurumEtiketi, Durum, Mulakatci } from "../components/MulakatKarti";
import MulakatTakvimi, { gunMetni } from "../components/MulakatTakvimi";

type MulakatOzeti = {
  id: number;
  adayId: number;
  tur: "ik" | "teknik";
  mulakatciId: number | null;
  tarih: string;
  saat: string;
  durum: Durum;
};

type AtananMulakat = {
  id: number;
  adayId: number;
  tur: "ik" | "teknik";
  tarih: string;
  saat: string;
  aday: { adSoyad: string; pozisyon: { ad: string } };
};

// Ana sayfada gösterilen en fazla atanan mülakat sayısı
const ATANAN_SINIRI = 5;

// "2026-10-28" -> "28 Eki Çar"
const kisaTarih = (tarih: string) => {
  const [yil, ay, gun] = tarih.split("-").map(Number);

  return new Date(yil, ay - 1, gun).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
  });
};

// Saate göre sıralama; saati girilmemiş mülakatlar en sona ("~" her rakamdan büyük)
const saatSiralamasi = (saat: string) => saat || "~";

const sayfalar = [
  {
    href: "/adaylar",
    ad: "Adaylar",
    aciklama: "Aday ekleyin, bilgilerini düzenleyin.",
  },
  {
    href: "/pozisyonlar",
    ad: "Pozisyonlar",
    aciklama: "Açık pozisyonları tanımlayın.",
  },
  {
    href: "/mulakatcilar",
    ad: "Mülakatçılar",
    aciklama: "İK ve teknik mülakatçıları yönetin.",
  },
  {
    href: "/mulakatlar",
    ad: "Mülakatlar",
    aciklama: "Mülakat tarihlerini ve durumlarını takip edin.",
  },
];

export default function Home() {
  const { adaylar, yukleniyor: adaylarYukleniyor } = useAdaylar();

  const [pozisyonSayisi, setPozisyonSayisi] = useState(0);
  const [mulakatlar, setMulakatlar] = useState<MulakatOzeti[]>([]);
  const [ozetYukleniyor, setOzetYukleniyor] = useState(true);
  const [mulakatcilar, setMulakatcilar] = useState<Mulakatci[]>([]);

  // Giriş yapan kişiye atanmış yaklaşan mülakatlar; eslesmis: hesabı bir mülakatçıya bağlı mı
  const [atananlar, setAtananlar] = useState<{ eslesmis: boolean; mulakatlar: AtananMulakat[] }>({
    eslesmis: false,
    mulakatlar: [],
  });

  // Takvimde seçili gün; açılışta bugün
  const [seciliGun, setSeciliGun] = useState(() => gunMetni(new Date()));

  // Özet kartları için pozisyon ve mülakat verilerini getir
  useEffect(() => {
    const ozetiGetir = async () => {
      // Biri başarısız olsa bile diğerleri gösterilir
      const [pozisyonYaniti, mulakatYaniti, mulakatciYaniti, atananYaniti] = await Promise.all([
        istekAt("/api/pozisyonlar", "GET"),
        istekAt("/api/mulakatlar", "GET"),
        istekAt("/api/mulakatcilar", "GET"),
        istekAt("/api/mulakatlar/bana-atanan", "GET"),
      ]);

      if (pozisyonYaniti.veri) setPozisyonSayisi(pozisyonYaniti.veri.length);
      if (mulakatYaniti.veri) setMulakatlar(mulakatYaniti.veri);
      if (mulakatciYaniti.veri) setMulakatcilar(mulakatciYaniti.veri);
      if (atananYaniti.veri) setAtananlar(atananYaniti.veri);

      setOzetYukleniyor(false);
    };

    ozetiGetir();
  }, []);

  const yukleniyor = adaylarYukleniyor || ozetYukleniyor;

  const durumSayisi = (durum: string) =>
    mulakatlar.filter((mulakat) => mulakat.durum === durum).length;

  // Seçili gündeki mülakatlar; saate göre, saatsizler sonda, sonra İK önce ve aday adına göre
  const gununMulakatlari = mulakatlar
    .filter((mulakat) => mulakat.tarih === seciliGun)
    .map((mulakat) => ({
      ...mulakat,
      aday: adaylar.find((aday) => aday.id === mulakat.adayId),
      mulakatci: mulakatcilar.find((kisi) => kisi.id === mulakat.mulakatciId),
    }))
    .sort(
      (a, b) =>
        saatSiralamasi(a.saat).localeCompare(saatSiralamasi(b.saat)) ||
        a.tur.localeCompare(b.tur) ||
        (a.aday?.adSoyad ?? "").localeCompare(b.aday?.adSoyad ?? "", "tr")
    );

  const [seciliYil, seciliAy, seciliGunNo] = seciliGun.split("-").map(Number);
  const seciliGunBasligi = new Date(seciliYil, seciliAy - 1, seciliGunNo).toLocaleDateString(
    "tr-TR",
    { day: "numeric", month: "long", year: "numeric", weekday: "long" }
  );

  const ozetler = [
    {
      ad: "Toplam Aday",
      deger: adaylar.length,
      ikon: <Users size={22} />,
      renk: "bg-marka-acik text-marka",
    },
    {
      ad: "Pozisyon",
      deger: pozisyonSayisi,
      ikon: <Briefcase size={22} />,
      renk: "bg-amber-50 text-amber-600",
    },
    {
      ad: "Planlanan Mülakat",
      deger: durumSayisi("Planlandı"),
      ikon: <CalendarClock size={22} />,
      renk: "bg-sky-50 text-sky-600",
    },
    {
      ad: "Tamamlanan Mülakat",
      deger: durumSayisi("Tamamlandı"),
      ikon: <CircleCheck size={22} />,
      renk: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className={stiller.sayfaBasligi}>
        Mülakat Yönetim Sistemi
      </h1>

      <p className="mt-2 text-slate-600">
        Yüz Yüze Mülakat ve Aday Değerlendirme Platformu
      </p>

      {/* Özet Kartları */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ozetler.map((ozet) => (
          <div
            key={ozet.ad}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${ozet.renk}`}
            >
              {ozet.ikon}
            </span>

            {yukleniyor ? (

              <span className="mt-4 block h-9 w-14 animate-pulse rounded-md bg-slate-200" />

            ) : (

              <p className="mt-4 text-3xl font-bold text-slate-900">                {ozet.deger}              </p>

            )}

            <p className="mt-1 text-sm text-slate-600">
              {ozet.ad}
            </p>
          </div>
        ))}
      </div>

      {/* Size Atanan Mülakatlar */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">
        Size Atanan Mülakatlar
      </h2>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {yukleniyor ? (
          <span className="block h-12 animate-pulse rounded-lg bg-slate-100" />
        ) : !atananlar.eslesmis ? (
          <p className="flex items-center gap-3 text-sm text-slate-600">
            <UserCheck size={20} className="shrink-0 text-slate-400" />
            <span>
              Hesabınız henüz bir mülakatçıyla eşleşmedi.{" "}
              <Link href="/mulakatcilar" className="font-medium text-marka hover:underline">
                Mülakatçılar
              </Link>{" "}
              sayfasında kendi adınızın yanındaki &quot;Hesap&quot; seçiminden eşleştirebilirsiniz.
            </span>
          </p>
        ) : atananlar.mulakatlar.length === 0 ? (
          <p className="flex items-center gap-3 text-sm text-slate-600">
            <UserCheck size={20} className="shrink-0 text-slate-400" />
            Size atanmış yaklaşan bir mülakat yok.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {atananlar.mulakatlar.slice(0, ATANAN_SINIRI).map((mulakat) => (
              <li key={mulakat.id}>
                <Link
                  href={`/mulakatlar?aday=${mulakat.adayId}`}
                  className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                >
                  <span className="w-28 text-sm font-semibold text-slate-900">
                    {kisaTarih(mulakat.tarih)}
                    <span className="ml-1.5 font-normal tabular-nums text-slate-500">
                      {mulakat.saat}
                    </span>
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mulakat.tur === "ik" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}
                  >
                    {mulakat.tur === "ik" ? "İK" : "Teknik"}
                  </span>

                  <span className="flex-1 text-sm text-slate-700">
                    <span className="font-medium text-slate-900 group-hover:text-marka">
                      {mulakat.aday.adSoyad}
                    </span>
                    {" · "}
                    {mulakat.aday.pozisyon.ad}
                  </span>

                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-marka"
                  />
                </Link>
              </li>
            ))}

            {atananlar.mulakatlar.length > ATANAN_SINIRI && (
              <li className="pt-3 text-sm text-slate-500">
                ve {atananlar.mulakatlar.length - ATANAN_SINIRI} mülakat daha (takvimden görebilirsiniz)
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Mülakat Takvimi */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">
        Mülakat Takvimi
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
        <MulakatTakvimi
          mulakatlar={mulakatlar}
          seciliGun={seciliGun}
          onGunSec={setSeciliGun}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            {seciliGunBasligi}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {gununMulakatlari.length > 0
              ? `${gununMulakatlari.length} mülakat`
              : "Bu gün için mülakat yok."}
          </p>

          {yukleniyor ? (
            <span className="mt-4 block h-16 animate-pulse rounded-lg bg-slate-100" />
          ) : gununMulakatlari.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-6 text-center text-slate-400">
              <CalendarX size={32} />
              <p className="mt-2 text-sm">Takvimde noktalı bir gün seçin.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {gununMulakatlari.map((mulakat) => (
                <li key={mulakat.id}>
                  <Link
                    href={`/mulakatlar?aday=${mulakat.adayId}`}
                    className="group flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-marka hover:bg-marka-acik/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-11 shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                        {mulakat.saat || "--:--"}
                      </span>

                      <span
                        className={`h-9 w-1 rounded-full ${mulakat.tur === "ik" ? "bg-violet-500" : "bg-sky-500"}`}
                      />

                      <div>
                        <p className="font-medium text-slate-900">
                          {mulakat.aday?.adSoyad ?? "Silinmiş aday"}
                        </p>

                        <p className="text-sm text-slate-600">
                          {mulakat.tur === "ik" ? "İK" : "Teknik"} mülakatı
                          {mulakat.aday && ` · ${mulakat.aday.pozisyon.ad}`}
                          {mulakat.mulakatci && ` · ${mulakat.mulakatci.adSoyad}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DurumEtiketi durum={mulakat.durum} yazi={mulakat.durum} kucuk />

                      <ArrowRight
                        size={18}
                        className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-marka"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Hızlı Geçiş */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">
        Hızlı Geçiş
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sayfalar.map((sayfa) => (
          <Link
            key={sayfa.href}
            href={sayfa.href}
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-marka hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold text-slate-900">
                {sayfa.ad}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {sayfa.aciklama}
              </p>
            </div>

            <ArrowRight
              size={20}
              className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-marka"
            />
          </Link>
        ))}
      </div>
    </main>
  );
}
