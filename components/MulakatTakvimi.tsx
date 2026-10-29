"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TakvimMulakati = {
  tarih: string;
  tur: "ik" | "teknik";
};

type MulakatTakvimiProps = {
  mulakatlar: TakvimMulakati[];
  seciliGun: string;
  onGunSec: (gun: string) => void;
};

const gunAdlari = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const ikiHane = (sayi: number) => String(sayi).padStart(2, "0");

// Mülakat tarihleriyle aynı "YYYY-AA-GG" biçimi; toISOString saat dilimi yüzünden bir gün kaydırabilir
export const gunMetni = (tarih: Date) =>
  `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}`;

// Aylık takvim: mülakat olan günlerin altında türüne göre renkli nokta
export default function MulakatTakvimi({ mulakatlar, seciliGun, onGunSec }: MulakatTakvimiProps) {
  const bugun = gunMetni(new Date());

  // Gösterilen ay, seçili günün ayıyla başlar
  const [ay, setAy] = useState(() => {
    const [yil, ayNo] = seciliGun.split("-").map(Number);
    return new Date(yil, ayNo - 1, 1);
  });

  // Gün -> o gün hangi türde mülakat var
  const gunlukTurler = new Map<string, Set<string>>();

  mulakatlar.forEach((mulakat) => {
    if (!mulakat.tarih) return;

    const turler = gunlukTurler.get(mulakat.tarih) ?? new Set<string>();
    turler.add(mulakat.tur);
    gunlukTurler.set(mulakat.tarih, turler);
  });

  // Ayın ilk gününden önceki boş hücre sayısı (pazartesi = 0)
  const bosHucre = (ay.getDay() + 6) % 7;
  const gunSayisi = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();

  const gunler = Array.from(
    { length: gunSayisi },
    (_, i) => new Date(ay.getFullYear(), ay.getMonth(), i + 1)
  );

  const ayDegistir = (fark: number) =>
    setAy(new Date(ay.getFullYear(), ay.getMonth() + fark, 1));

  const bugunuSec = () => {
    const simdi = new Date();

    setAy(new Date(simdi.getFullYear(), simdi.getMonth(), 1));
    onGunSec(bugun);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => ayDegistir(-1)}
          aria-label="Önceki ay"
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ChevronLeft size={18} />
        </button>

        <h3 className="font-semibold capitalize text-slate-900">
          {ay.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
        </h3>

        <button
          onClick={() => ayDegistir(1)}
          aria-label="Sonraki ay"
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {gunAdlari.map((gunAdi) => (
          <span key={gunAdi} className="pb-1 text-xs font-medium text-slate-500">
            {gunAdi}
          </span>
        ))}

        {Array.from({ length: bosHucre }, (_, i) => (
          <span key={`bos-${i}`} />
        ))}

        {gunler.map((tarih) => {
          const gun = gunMetni(tarih);
          const turler = gunlukTurler.get(gun);
          const secili = gun === seciliGun;

          return (
            <button
              key={gun}
              onClick={() => onGunSec(gun)}
              aria-label={`${tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}${turler ? ", mülakat var" : ""}`}
              aria-pressed={secili}
              className={`flex h-11 flex-col items-center justify-center rounded-lg text-sm transition ${secili
                ? "bg-marka font-semibold text-white"
                : gun === bugun
                  ? "font-semibold text-marka ring-1 ring-marka/40 hover:bg-marka-acik"
                  : "text-slate-700 hover:bg-slate-100"
                }`}
            >
              {tarih.getDate()}

              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {turler?.has("ik") && (
                  <span className={`h-1.5 w-1.5 rounded-full ${secili ? "bg-white" : "bg-violet-500"}`} />
                )}

                {turler?.has("teknik") && (
                  <span className={`h-1.5 w-1.5 rounded-full ${secili ? "bg-white" : "bg-sky-500"}`} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            İK
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Teknik
          </span>
        </div>

        <button onClick={bugunuSec} className="font-medium text-marka hover:underline">
          Bugün
        </button>
      </div>
    </div>
  );
}
