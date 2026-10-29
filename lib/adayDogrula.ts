import prisma from "./prisma";

type AdayVerisi = {
    adSoyad: string;
    yas: number;
    eposta: string;
    telefon: string;
    pozisyonId: number;
};

// "ad@alan.uzanti" biçimi; boşluk ve ikinci @ olamaz
const epostaGecerli = (eposta: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);

// Rakam, boşluk, +, -, ( ) kabul edilir; rakam sayısı 10-13 (alan kodlu ya da +90'lı)
const telefonGecerli = (telefon: string) =>
    /^[\d\s+()-]+$/.test(telefon) && /^\d{10,13}$/.test(telefon.replace(/\D/g, ""));

// Aday ekleme ve güncellemede ortak doğrulama.
// Sorun varsa Türkçe hata mesajını, yoksa temizlenmiş veriyi döndürür.
export const adayVerisiniDogrula = async (
    body: Record<string, unknown>
): Promise<{ hata: string; veri?: undefined } | { hata?: undefined; veri: AdayVerisi }> => {
    const adSoyad = typeof body.adSoyad === "string" ? body.adSoyad.trim() : "";
    const yas = Number(body.yas);
    const pozisyonId = Number(body.pozisyonId);
    const eposta = typeof body.eposta === "string" ? body.eposta.trim() : "";
    const telefon = typeof body.telefon === "string" ? body.telefon.trim() : "";

    if (!adSoyad || !body.yas || !body.pozisyonId || !eposta || !telefon) {
        return { hata: "Gerekli alanlar eksik." };
    }

    if (!Number.isInteger(yas) || yas < 18 || yas > 70) {
        return { hata: "Yaş 18 ile 70 arasında olmalıdır." };
    }

    if (!epostaGecerli(eposta)) {
        return { hata: "Geçerli bir e-posta adresi girin." };
    }

    if (!telefonGecerli(telefon)) {
        return { hata: "Geçerli bir telefon numarası girin (en az 10 rakam)." };
    }

    const pozisyon = Number.isInteger(pozisyonId)
        ? await prisma.pozisyon.findUnique({
            where: {
                id: pozisyonId,
            },
        })
        : null;

    if (!pozisyon) {
        return { hata: "Seçilen pozisyon bulunamadı." };
    }

    return { veri: { adSoyad, yas, eposta, telefon, pozisyonId } };
};
