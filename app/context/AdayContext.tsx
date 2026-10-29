"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Karar } from "../../components/karar";
import { istekAt } from "../../components/istekAt";

export type Aday = {
    id: number;
    adSoyad: string;
    yas: number;
    eposta: string;
    telefon: string;
    karar: Karar;
    kararNotu: string;
    // Yalnızca CV'nin bilgisi; dosyanın kendisi /api/adaylar/[id]/cv adresinden açılır
    cv: { dosyaAdi: string; boyut: number; yuklenme: string } | null;
    pozisyonId: number;
    pozisyon: {
        id: number;
        ad: string;
    };
    createdAt: string;
};

export type YeniAday = {
    adSoyad: string;
    yas: number;
    eposta: string;
    telefon: string;
    pozisyonId: number;
};

type AdayContextType = {
    adaylar: Aday[];
    yukleniyor: boolean;
    hata: string;
    adayEkle: (yeniAday: YeniAday) => Promise<string | null>;
    adayGuncelle: (id: number, aday: YeniAday) => Promise<string | null>;
    adaySil: (id: number) => Promise<string | null>;
    kararKaydet: (id: number, karar: Karar, kararNotu: string) => Promise<string | null>;
    cvYukle: (id: number, dosya: File) => Promise<string | null>;
    cvSil: (id: number) => Promise<string | null>;
    adaylariYenile: () => Promise<void>;
};

const AdayContext = createContext<AdayContextType | undefined>(undefined);

// Adayları sunucudan çeker; hata olursa mesajını döndürür
const adaylariCek = async (): Promise<{ adaylar: Aday[]; hata: string }> => {
    const { veri, hata } = await istekAt("/api/adaylar", "GET");

    return hata ? { adaylar: [], hata } : { adaylar: veri, hata: "" };
};

export function AdayProvider({ children }: { children: ReactNode }) {
    const [adaylar, setAdaylar] = useState<Aday[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState("");

    // Uygulama açıldığında adayları veritabanından getir
    useEffect(() => {
        const adaylariGetir = async () => {
            const sonuc = await adaylariCek();

            if (sonuc.hata) {
                setHata(sonuc.hata);
            } else {
                setAdaylar(sonuc.adaylar);
            }

            setYukleniyor(false);
        };

        adaylariGetir();
    }, []);

    // Listeyi yeniden çeker; pozisyon adı değişince aday kartları güncellensin diye
    const adaylariYenile = async () => {
        const sonuc = await adaylariCek();

        if (!sonuc.hata) {
            setAdaylar(sonuc.adaylar);
        }
    };

    // Sunucudan dönen güncel adayı listede yerine koyar
    const adayiYerineKoy = (guncel: Aday) =>
        setAdaylar((onceki) =>
            onceki.map((mevcut) => (mevcut.id === guncel.id ? guncel : mevcut))
        );

    // Yeni adayı kaydeder; hata olursa mesajını, başarılıysa null döndürür
    const adayEkle = async (yeniAday: YeniAday) => {
        const { veri, hata: istekHatasi } = await istekAt("/api/adaylar", "POST", yeniAday);

        if (istekHatasi) return istekHatasi;

        setAdaylar((onceki) => [veri, ...onceki]);

        return null;
    };

    // Adayın bilgilerini günceller; hata olursa mesajını, başarılıysa null döndürür
    const adayGuncelle = async (id: number, aday: YeniAday) => {
        const { veri, hata: istekHatasi } = await istekAt(`/api/adaylar/${id}`, "PUT", aday);

        if (istekHatasi) return istekHatasi;

        adayiYerineKoy(veri);

        return null;
    };

    // Adayın kararını ve gerekçesini kaydeder; hata olursa mesajını, başarılıysa null döndürür
    const kararKaydet = async (id: number, karar: Karar, kararNotu: string) => {
        const { veri, hata: istekHatasi } = await istekAt(`/api/adaylar/${id}/karar`, "PUT", {
            karar,
            kararNotu,
        });

        if (istekHatasi) return istekHatasi;

        adayiYerineKoy(veri);

        return null;
    };

    // CV yükler (varsa değiştirir); hata olursa mesajını, başarılıysa null döndürür
    const cvYukle = async (id: number, dosya: File) => {
        const form = new FormData();
        form.append("dosya", dosya);

        const { veri, hata: istekHatasi } = await istekAt(`/api/adaylar/${id}/cv`, "POST", form);

        if (istekHatasi) return istekHatasi;

        adayiYerineKoy(veri);

        return null;
    };

    const cvSil = async (id: number) => {
        const { veri, hata: istekHatasi } = await istekAt(`/api/adaylar/${id}/cv`, "DELETE");

        if (istekHatasi) return istekHatasi;

        adayiYerineKoy(veri);

        return null;
    };

    // Adayı siler; hata olursa mesajını, başarılıysa null döndürür
    const adaySil = async (id: number) => {
        const { hata: istekHatasi } = await istekAt(`/api/adaylar/${id}`, "DELETE");

        if (istekHatasi) return istekHatasi;

        setAdaylar((onceki) => onceki.filter((mevcut) => mevcut.id !== id));

        return null;
    };

    return (
        <AdayContext.Provider
            value={{
                adaylar,
                yukleniyor,
                hata,
                adayEkle,
                adayGuncelle,
                adaySil,
                kararKaydet,
                cvYukle,
                cvSil,
                adaylariYenile,
            }}
        >
            {children}
        </AdayContext.Provider>
    );
}

export function useAdaylar() {
    const context = useContext(AdayContext);

    if (!context) {
        throw new Error("useAdaylar, AdayProvider içerisinde kullanılmalıdır.");
    }

    return context;
}
