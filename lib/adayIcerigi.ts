import type { Prisma } from "../generated/prisma/client";

// Adayı döndüren her API aynı alanları verir: pozisyon + CV'nin yalnızca bilgisi (dosya baytları değil).
// Ekranda aday yerine konan kopya eksik alanlı olmasın diye liste, ekleme, güncelleme ve karar aynı tanımı kullanır.
export const adayIcerigi = {
    pozisyon: true,
    cv: {
        select: {
            dosyaAdi: true,
            boyut: true,
            yuklenme: true,
        },
    },
} satisfies Prisma.AdayInclude;
