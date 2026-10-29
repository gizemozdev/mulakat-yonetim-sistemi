import { ReactNode } from "react";

type BosDurumProps = {
  ikon: ReactNode;
  mesaj: string;
};

// Liste boşken gösterilen bilgilendirme kutusu
export default function BosDurum({ ikon, mesaj }: BosDurumProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {ikon}
      </span>

      <p className="mt-4 text-slate-600">
        {mesaj}
      </p>
    </div>
  );
}
