"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardCheck, FileText, Mail, MessagesSquare, Phone, SearchX, Users } from "lucide-react";
import { useAdaylar } from "../context/AdayContext";
import AramaCubugu, { metinIceriyor } from "../../components/AramaCubugu";
import BosDurum from "../../components/BosDurum";
import MulakatKarti, {
    Durum,
    MulakatBilgisi,
    Mulakatci,
    DurumEtiketi,
} from "../../components/MulakatKarti";
import SonucOzeti, { IkSonuc, TeknikSonuc } from "../../components/SonucOzeti";
import KararKarti, { KararEtiketi } from "../../components/KararKarti";
import { Karar, kararlar, VARSAYILAN_KARAR } from "../../components/karar";
import { stiller } from "../../components/stiller";
import { istekAt } from "../../components/istekAt";
import { teknikTamamlandi, yuzdeHesapla } from "../../components/teknikPuan";

type Tur = "ik" | "teknik";

type Mulakatlar = Record<Tur, MulakatBilgisi>;

type MulakatKaydi = MulakatBilgisi & {
    id: number;
    adayId: number;
    tur: Tur;
    ikGuncelSoruId: number | null;
    genelNot: string;
    ikAkis: { ad: string } | null;
    teknikCevaplar: TeknikSonuc;
    _count: {
        teknikCevaplar: number;
        ikCevaplar: number;
    };
};

const varsayilanMulakat: MulakatBilgisi = {
    mulakatciId: null,
    tarih: "",
    saat: "",
    durum: "Planlanmadı",
};

function MulakatlarIcerigi() {
    const { adaylar, kararKaydet } = useAdaylar();

    // Ana sayfa takviminden "?aday=5" ile gelinirse o aday seçili açılır
    const adayParametresi = Number(useSearchParams().get("aday"));

    const [seciliAdayId, setSeciliAdayId] = useState<number | null>(
        Number.isInteger(adayParametresi) && adayParametresi > 0 ? adayParametresi : null
    );

    const [mulakatBilgileri, setMulakatBilgileri] = useState<
        Record<number, Mulakatlar>
    >({});

    const [mulakatcilar, setMulakatcilar] = useState<Mulakatci[]>([]);

    // Teknik mülakatı başlatılmış adaylar: adayId -> soru sayısı
    const [teknikSoruSayilari, setTeknikSoruSayilari] = useState<Record<number, number>>({});

    // İK mülakatı başlatılmış adaylar: adayId -> başlatıldı mı
    const [ikBaslatildi, setIkBaslatildi] = useState<Record<number, boolean>>({});

    // Sonuç özeti için ham veriler: adayId -> teknik cevaplar / İK özeti
    const [teknikSonuclari, setTeknikSonuclari] = useState<Record<number, TeknikSonuc>>({});
    const [ikSonuclari, setIkSonuclari] = useState<Record<number, IkSonuc>>({});

    const [hata, setHata] = useState("");

    const [arama, setArama] = useState("");
    const [pozisyonSuzgeci, setPozisyonSuzgeci] = useState("");
    const [durumSuzgeci, setDurumSuzgeci] = useState<Durum | "">("");
    const [kararSuzgeci, setKararSuzgeci] = useState<Karar | "">("");

    // Mülakatçı listesini veritabanından getir
    useEffect(() => {
        const mulakatcilariGetir = async () => {
            const { veri } = await istekAt("/api/mulakatcilar", "GET");

            if (veri) {
                setMulakatcilar(veri);
            }
        };

        mulakatcilariGetir();
    }, []);

    // Sayfa açıldığında kayıtlı mülakatları veritabanından getir
    useEffect(() => {
        const mulakatlariGetir = async () => {
            const { veri, hata: istekHatasi } = await istekAt("/api/mulakatlar", "GET");

            if (istekHatasi) {
                setHata(istekHatasi);
                return;
            }

            const bilgiler: Record<number, Mulakatlar> = {};
            const soruSayilari: Record<number, number> = {};
            const ikBaslayanlar: Record<number, boolean> = {};
            const teknikler: Record<number, TeknikSonuc> = {};
            const ikler: Record<number, IkSonuc> = {};

            (veri as MulakatKaydi[]).forEach((kayit) => {
                const mevcut = bilgiler[kayit.adayId] || {
                    ik: { ...varsayilanMulakat },
                    teknik: { ...varsayilanMulakat },
                };

                mevcut[kayit.tur] = {
                    mulakatciId: kayit.mulakatciId,
                    tarih: kayit.tarih,
                    saat: kayit.saat,
                    durum: kayit.durum,
                };

                bilgiler[kayit.adayId] = mevcut;

                if (kayit.tur === "teknik") {
                    soruSayilari[kayit.adayId] = kayit._count.teknikCevaplar;
                    teknikler[kayit.adayId] = kayit.teknikCevaplar;
                } else {
                    ikler[kayit.adayId] = {
                        akisAdi: kayit.ikAkis?.ad ?? null,
                        cevapSayisi: kayit._count.ikCevaplar,
                        genelNot: kayit.genelNot,
                    };

                    ikBaslayanlar[kayit.adayId] =
                        kayit._count.ikCevaplar > 0 || kayit.ikGuncelSoruId !== null;
                }
            });

            setMulakatBilgileri(bilgiler);
            setTeknikSoruSayilari(soruSayilari);
            setIkBaslatildi(ikBaslayanlar);
            setTeknikSonuclari(teknikler);
            setIkSonuclari(ikler);
        };

        mulakatlariGetir();
    }, []);

    const getMulakat = (adayId: number): Mulakatlar => {
        return (
            mulakatBilgileri[adayId] || {
                ik: { ...varsayilanMulakat },
                teknik: { ...varsayilanMulakat },
            }
        );
    };

    const mulakatYaz = (adayId: number, tur: Tur, bilgi: MulakatBilgisi) => {
        setMulakatBilgileri((onceki) => ({
            ...onceki,
            [adayId]: {
                ...(onceki[adayId] || {
                    ik: { ...varsayilanMulakat },
                    teknik: { ...varsayilanMulakat },
                }),
                [tur]: bilgi,
            },
        }));
    };

    // Değişikliği ekrana yansıtır ve veritabanına kaydeder
    const mulakatGuncelle = async (
        adayId: number,
        tur: Tur,
        degisiklik: Partial<MulakatBilgisi>
    ) => {
        const eskiBilgi = getMulakat(adayId)[tur];
        const yeniBilgi = { ...eskiBilgi, ...degisiklik };

        mulakatYaz(adayId, tur, yeniBilgi);
        setHata("");

        const { hata: istekHatasi } = await istekAt("/api/mulakatlar", "PUT", {
            adayId,
            tur,
            ...yeniBilgi,
        });

        // Kayıt başarısızsa ekrandaki değişiklik geri alınır
        if (istekHatasi) {
            mulakatYaz(adayId, tur, eskiBilgi);
            setHata(istekHatasi);
        }
    };

    const teknikDugmeYazisi = (adayId: number) => {
        if (!teknikSoruSayilari[adayId]) return "Teknik Mülakatı Başlat";

        return getMulakat(adayId).teknik.durum === "Tamamlandı"
            ? "Sonucu Gör"
            : "Mülakata Devam Et";
    };

    const ikDugmeYazisi = (adayId: number) => {
        if (!ikBaslatildi[adayId]) return "İK Mülakatını Başlat";

        return getMulakat(adayId).ik.durum === "Tamamlandı"
            ? "Sonucu Gör"
            : "Mülakata Devam Et";
    };

    // Tamamlanmış ve bütün soruları değerlendirilmiş teknik mülakatın cevapları, yoksa null
    const teknikSonucu = (adayId: number) => {
        const cevaplar = teknikSonuclari[adayId];

        return teknikTamamlandi(getMulakat(adayId).teknik.durum, cevaplar) ? cevaplar : null;
    };

    // Tamamlanmış ve en az bir cevabı olan İK mülakatının özeti, yoksa null
    const ikSonucu = (adayId: number) =>
        getMulakat(adayId).ik.durum === "Tamamlandı" && ikSonuclari[adayId]?.cevapSayisi > 0
            ? ikSonuclari[adayId]
            : null;

    const seciliAday = adaylar.find((aday) => aday.id === seciliAdayId);

    // Süzme seçeneği olarak yalnızca adayı olan pozisyonlar (ada göre sıralı, tekrarsız)
    const pozisyonlar = [
        ...new Map(adaylar.map((aday) => [aday.pozisyon.id, aday.pozisyon])).values(),
    ].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

    // İK ya da teknik mülakatından biri seçilen durumdaysa aday listede kalır
    const gorunenAdaylar = adaylar.filter((aday) => {
        const mulakat = getMulakat(aday.id);

        return (
            metinIceriyor(aday.adSoyad, arama) &&
            (!pozisyonSuzgeci || aday.pozisyon.id === Number(pozisyonSuzgeci)) &&
            (!durumSuzgeci ||
                mulakat.ik.durum === durumSuzgeci ||
                mulakat.teknik.durum === durumSuzgeci) &&
            (!kararSuzgeci || aday.karar === kararSuzgeci)
        );
    });

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div>
                <h1 className={stiller.sayfaBasligi}>
                    Mülakatlar
                </h1>

                <p className="mt-2 text-slate-600">
                    Kayıtlı adayların İK ve teknik mülakat süreçlerini buradan
                    yönetebilirsiniz.
                </p>
            </div>

            {hata && (
                <p className="mt-6 text-red-600">{hata}</p>
            )}

            {adaylar.length === 0 ? (
                <div className="mt-10">
                    <BosDurum ikon={<Users size={24} />} mesaj="Henüz kayıtlı aday bulunmuyor." />
                </div>
            ) : (
                <div className="mt-10">
                    <h2 className={stiller.bolumBasligi}>
                        Adaylar
                    </h2>

                    <AramaCubugu
                        arama={arama}
                        onAramaDegistir={setArama}
                        yerTutucu="Aday adı ile ara"
                        gosterilen={gorunenAdaylar.length}
                        toplam={adaylar.length}
                        onTemizle={() => {
                            setArama("");
                            setPozisyonSuzgeci("");
                            setDurumSuzgeci("");
                            setKararSuzgeci("");
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

                        <select
                            value={durumSuzgeci}
                            onChange={(e) => setDurumSuzgeci(e.target.value as Durum | "")}
                            aria-label="Mülakat durumuna göre süz"
                            className={stiller.suzmeSecimi}
                        >
                            <option value="">Tüm durumlar</option>
                            <option value="Planlanmadı">Planlanmadı</option>
                            <option value="Planlandı">Planlandı</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                            <option value="İptal">İptal</option>
                        </select>

                        <select
                            value={kararSuzgeci}
                            onChange={(e) => setKararSuzgeci(e.target.value as Karar | "")}
                            aria-label="Karara göre süz"
                            className={stiller.suzmeSecimi}
                        >
                            <option value="">Tüm kararlar</option>

                            {kararlar.map((karar) => (
                                <option key={karar} value={karar}>
                                    {karar}
                                </option>
                            ))}
                        </select>
                    </AramaCubugu>

                    {/* Aday Kartları */}
                    {gorunenAdaylar.length === 0 ? (
                        <BosDurum ikon={<SearchX size={24} />} mesaj="Aramaya uyan aday bulunamadı." />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {gorunenAdaylar.map((aday) => {
                                const mulakat = getMulakat(aday.id);

                                return (
                                    <button
                                        key={aday.id}
                                        onClick={() =>
                                            setSeciliAdayId(
                                                seciliAdayId === aday.id ? null : aday.id
                                            )
                                        }
                                        className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${seciliAdayId === aday.id
                                                ? "border-marka ring-2 ring-marka/30"
                                                : "border-slate-200"
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {aday.adSoyad}
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-600">
                                            {aday.yas} yaş
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {aday.pozisyon.ad}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            <DurumEtiketi
                                                durum={mulakat.ik.durum}
                                                yazi="İK"
                                                kucuk
                                            />

                                            <DurumEtiketi
                                                durum={mulakat.teknik.durum}
                                                yazi="Teknik"
                                                kucuk
                                            />

                                            {teknikSonucu(aday.id) && (
                                                <span className="rounded-full bg-marka-acik px-3 py-1 text-xs font-semibold text-marka">
                                                    %{yuzdeHesapla(teknikSonucu(aday.id) ?? [])}
                                                </span>
                                            )}

                                            {/* Varsayılan "Değerlendiriliyor" her kartta tekrarlanmasın diye gösterilmez */}
                                            {aday.karar !== VARSAYILAN_KARAR && (
                                                <KararEtiketi karar={aday.karar} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Detay */}
                    {seciliAday && (
                        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        {seciliAday.adSoyad}
                                    </h2>

                                    <div className="flex gap-2">
                                        {/* Mülakat sırasında CV'ye bakabilmek için */}
                                        {seciliAday.cv && (
                                            <a
                                                href={`/api/adaylar/${seciliAday.id}/cv`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={stiller.duzenleDugmesi}
                                            >
                                                <FileText size={14} />
                                                CV
                                            </a>
                                        )}

                                        <Link
                                            href={`/mulakatlar/${seciliAday.id}/rapor`}
                                            className={stiller.duzenleDugmesi}
                                        >
                                            <FileText size={14} />
                                            Rapor
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-4 text-slate-700">
                                    <span>{seciliAday.yas} yaş</span>
                                    <span>{seciliAday.pozisyon.ad}</span>

                                    {seciliAday.eposta && (
                                        <a href={`mailto:${seciliAday.eposta}`} className="inline-flex items-center gap-1.5 hover:text-marka">
                                            <Mail size={16} />
                                            {seciliAday.eposta}
                                        </a>
                                    )}

                                    {seciliAday.telefon && (
                                        <a href={`tel:${seciliAday.telefon}`} className="inline-flex items-center gap-1.5 hover:text-marka">
                                            <Phone size={16} />
                                            {seciliAday.telefon}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <MulakatKarti
                                    baslik="İK Mülakatı"
                                    mulakat={getMulakat(seciliAday.id).ik}
                                    mulakatcilar={mulakatcilar.filter(
                                        (mulakatci) => mulakatci.alan === "ik"
                                    )}
                                    onDegistir={(degisiklik) =>
                                        mulakatGuncelle(seciliAday.id, "ik", degisiklik)
                                    }
                                    ekIslem={
                                        <Link
                                            href={`/mulakatlar/${seciliAday.id}/ik`}
                                            className={`${stiller.birincilDugme} w-full justify-center`}
                                        >
                                            <MessagesSquare size={18} />
                                            {ikDugmeYazisi(seciliAday.id)}
                                        </Link>
                                    }
                                />

                                <MulakatKarti
                                    baslik="Teknik Mülakat"
                                    mulakat={getMulakat(seciliAday.id).teknik}
                                    mulakatcilar={mulakatcilar.filter(
                                        (mulakatci) => mulakatci.alan === "teknik"
                                    )}
                                    onDegistir={(degisiklik) =>
                                        mulakatGuncelle(
                                            seciliAday.id,
                                            "teknik",
                                            degisiklik
                                        )
                                    }
                                    ekIslem={
                                        <Link
                                            href={`/mulakatlar/${seciliAday.id}/teknik`}
                                            className={`${stiller.birincilDugme} w-full justify-center`}
                                        >
                                            <ClipboardCheck size={18} />
                                            {teknikDugmeYazisi(seciliAday.id)}
                                        </Link>
                                    }
                                />
                            </div>

                            <SonucOzeti
                                adayId={seciliAday.id}
                                teknik={teknikSonucu(seciliAday.id)}
                                ik={ikSonucu(seciliAday.id)}
                            />

                            <KararKarti
                                key={seciliAday.id}
                                karar={seciliAday.karar}
                                kararNotu={seciliAday.kararNotu}
                                onKaydet={(karar, kararNotu) =>
                                    kararKaydet(seciliAday.id, karar, kararNotu)
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}

// useSearchParams derlemede bir Suspense sınırı ister (node_modules/next/dist/docs: use-search-params)
export default function Mulakatlar() {
    return (
        <Suspense>
            <MulakatlarIcerigi />
        </Suspense>
    );
}
