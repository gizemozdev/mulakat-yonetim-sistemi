import prisma from "./prisma";

export const ikMulakatiBul = (adayId: number) =>
    prisma.mulakat.findUnique({
        where: {
            adayId_tur: {
                adayId,
                tur: "ik",
            },
        },
        include: {
            ikAkis: {
                select: {
                    id: true,
                    ad: true,
                },
            },
            ikCevaplar: {
                orderBy: {
                    sira: "asc",
                },
            },
        },
    });

// Sayfanın ihtiyaç duyduğu bütün mülakat bilgisini tek nesnede toplar
export const ikOturumu = async (adayId: number) => {
    const mulakat = await ikMulakatiBul(adayId);

    const guncelSoru = mulakat?.ikGuncelSoruId
        ? await prisma.ikSoru.findUnique({
            where: {
                id: mulakat.ikGuncelSoruId,
            },
            include: {
                akis: true,
                secenekler: {
                    orderBy: {
                        id: "asc",
                    },
                },
            },
        })
        : null;

    const cevaplar = mulakat?.ikCevaplar ?? [];

    return {
        durum: mulakat?.durum ?? "Planlanmadı",
        baslatildi: cevaplar.length > 0 || Boolean(mulakat?.ikGuncelSoruId),
        akis: mulakat?.ikAkis ?? null,
        genelNot: mulakat?.genelNot ?? "",
        cevaplar,
        guncelSoru: guncelSoru
            ? {
                id: guncelSoru.id,
                metin: guncelSoru.metin,
                akisAdi: guncelSoru.akis.ad,
                genel: guncelSoru.akis.genel,
                secenekler: guncelSoru.secenekler.map((secenek) => ({
                    id: secenek.id,
                    metin: secenek.metin,
                })),
            }
            : null,
    };
};

// Seçilen seçeneğe göre sıradaki soruyu bulur.
// Seçenek akışı bitiriyorsa ve genel akıştaysak, seçilen pozisyon akışının ilk sorusuna geçilir.
export const sonrakiSoruIdBul = (
    sonrakiSoruId: number | null,
    genelAkistaMi: boolean,
    seciliAkisIlkSoruId: number | null
) => {
    if (sonrakiSoruId !== null) return sonrakiSoruId;

    return genelAkistaMi ? seciliAkisIlkSoruId : null;
};
