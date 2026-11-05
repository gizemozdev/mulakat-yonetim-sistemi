"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type SifreAlaniProps = {
  id: string;
  value: string;
  onChange: (deger: string) => void;
  autoComplete: "current-password" | "new-password";
  // Girdinin görünüşü sayfadan gelir (giriş ekranı ile formlar farklı boyutta)
  sinif: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
};

// Sağında "Göster / Gizle" düğmesi olan şifre girdisi
export default function SifreAlani({ id, value, onChange, autoComplete, sinif, ...digerleri }: SifreAlaniProps) {
  const [gorunur, setGorunur] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={gorunur ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`${sinif} pr-24`}
        {...digerleri}
      />

      {/* type="button": formun içinde olduğu için basılınca formu göndermesin */}
      <button
        type="button"
        onClick={() => setGorunur(!gorunur)}
        aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
        aria-pressed={gorunur}
        className="absolute inset-y-0 right-0 flex items-center gap-1.5 px-3 text-sm font-medium text-slate-500 hover:text-marka"
      >
        {gorunur ? <EyeOff size={16} /> : <Eye size={16} />}
        {gorunur ? "Gizle" : "Göster"}
      </button>
    </div>
  );
}
