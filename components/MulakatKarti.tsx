import { ReactNode } from "react";
import { stiller } from "./stiller";
export type Durum = "Planlanmadı" | "Planlandı" | "Tamamlandı" | "İptal";

export type Mulakatci = {
    id: number;
    adSoyad: string;
    alan: "ik" | "teknik";
};

export type MulakatBilgisi = {
    mulakatciId: number | null;
    tarih: string;
    saat: string;
    durum: Durum;
};

const durumRengi = (durum: Durum) => {
    switch (durum) {
        case "Planlanmadı":
            return "bg-amber-100 text-amber-700";

        case "Planlandı":
            return "bg-sky-100 text-sky-700";

        case "Tamamlandı":
            return "bg-emerald-100 text-emerald-700";

        case "İptal":
            return "bg-red-100 text-red-700";
    }
};

const durumNoktasi = (durum: Durum) => {
    switch (durum) {
        case "Planlanmadı":
            return "bg-amber-500";

        case "Planlandı":
            return "bg-sky-500";

        case "Tamamlandı":
            return "bg-emerald-500";

        case "İptal":
            return "bg-red-500";
    }
};

type DurumEtiketiProps = {
    durum: Durum;
    yazi: string;
    kucuk?: boolean;
};

// Mülakat durumunu renkli nokta ve yazıyla gösteren etiket
export function DurumEtiketi({ durum, yazi, kucuk }: DurumEtiketiProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${kucuk ? "text-xs" : "text-sm"
                } ${durumRengi(durum)}`}
        >
            <span className={`h-2 w-2 rounded-full ${durumNoktasi(durum)}`} />
            {yazi}
        </span>
    );
}

const tarihGoster = (tarih: string) => {
    if (!tarih) return "Tarih belirlenmedi";

    const [yil, ay, gun] = tarih.split("-");

    return `${gun}.${ay}.${yil}`;
};

type MulakatKartiProps = {
    baslik: string;
    mulakat: MulakatBilgisi;
    mulakatcilar: Mulakatci[];
    onDegistir: (degisiklik: Partial<MulakatBilgisi>) => void;
    ekIslem?: ReactNode;
};

export default function MulakatKarti({
    baslik,
    mulakat,
    mulakatcilar,
    onDegistir,
    ekIslem,
}: MulakatKartiProps) {
    const seciliMulakatci = mulakatcilar.find(
        (mulakatci) => mulakatci.id === mulakat.mulakatciId
    );

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                    {baslik}
                </h3>

                <DurumEtiketi durum={mulakat.durum} yazi={mulakat.durum} />
            </div>

            <div className="mt-5 space-y-4">
                <div>
                    <label className={stiller.etiket}>
                        Mülakatı Gerçekleştirecek Kişi
                    </label>

                    <select
                        value={mulakat.mulakatciId ?? ""}
                        onChange={(e) =>
                            onDegistir({
                                mulakatciId: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                    >
                        <option value="">Kişi seçin</option>

                        {mulakatcilar.map((mulakatci) => (
                            <option key={mulakatci.id} value={mulakatci.id}>
                                {mulakatci.adSoyad}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-[1fr_8rem] gap-3">
                    <div>
                        <label className={stiller.etiket}>
                            Mülakat Tarihi
                        </label>

                        <input
                            type="date"
                            value={mulakat.tarih}
                            onChange={(e) => onDegistir({ tarih: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                        />
                    </div>

                    <div>
                        <label className={stiller.etiket}>
                            Saat
                        </label>

                        <input
                            type="time"
                            value={mulakat.saat}
                            onChange={(e) => onDegistir({ saat: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                        />
                    </div>
                </div>

                <div>
                    <label className={stiller.etiket}>
                        Durum
                    </label>

                    <select
                        value={mulakat.durum}
                        onChange={(e) =>
                            onDegistir({ durum: e.target.value as Durum })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-marka focus:ring-2 focus:ring-marka/20"
                    >
                        <option value="Planlanmadı">Planlanmadı</option>
                        <option value="Planlandı">Planlandı</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                        <option value="İptal">İptal</option>
                    </select>
                </div>

                <div className="pt-1 text-sm text-slate-600">
                    <p>
                        Kişi:{" "}
                        <span className="font-medium text-slate-900">
                            {seciliMulakatci?.adSoyad || "Belirlenmedi"}
                        </span>
                    </p>

                    <p className="mt-1">
                        Tarih:{" "}
                        <span className="font-medium text-slate-900">
                            {tarihGoster(mulakat.tarih)}
                            {mulakat.tarih && mulakat.saat && `, ${mulakat.saat}`}
                        </span>
                    </p>
                </div>

                {/* Karta göre ek düğme, ör. teknik mülakatı başlat */}
                {ekIslem && <div className="pt-2">{ekIslem}</div>}
            </div>
        </div>
    );
}
