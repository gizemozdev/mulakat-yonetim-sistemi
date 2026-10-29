type KullaniciVerisi = {
    adSoyad: string;
    kullaniciAdi: string;
    sifre: string;
};

export const SIFRE_EN_AZ = 6;

// Şifre kuralı hem kullanıcı eklemede hem şifre değiştirmede kullanılır
export const sifreHatasi = (sifre: string) =>
    sifre.length < SIFRE_EN_AZ ? `Şifre en az ${SIFRE_EN_AZ} karakter olmalıdır.` : "";

// İlk kurulum ve kullanıcı eklemede ortak doğrulama.
// Sorun varsa Türkçe hata mesajını, yoksa temizlenmiş veriyi döndürür.
export const kullaniciVerisiniDogrula = (
    body: Record<string, unknown>
): { hata: string; veri?: undefined } | { hata?: undefined; veri: KullaniciVerisi } => {
    const adSoyad = typeof body.adSoyad === "string" ? body.adSoyad.trim() : "";
    const kullaniciAdi =
        typeof body.kullaniciAdi === "string" ? body.kullaniciAdi.trim() : "";
    const sifre = typeof body.sifre === "string" ? body.sifre : "";

    if (!adSoyad || !kullaniciAdi) {
        return { hata: "Ad soyad ve kullanıcı adı boş bırakılamaz." };
    }

    if (kullaniciAdi.length < 3 || /\s/.test(kullaniciAdi)) {
        return { hata: "Kullanıcı adı en az 3 karakter olmalı ve boşluk içermemelidir." };
    }

    const hata = sifreHatasi(sifre);

    if (hata) {
        return { hata };
    }

    return { veri: { adSoyad, kullaniciAdi, sifre } };
};
