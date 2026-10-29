import prisma from "./prisma";

// Bir seçenek sonrakiSoruId'ye bağlanırsa akış sonsuz döngüye girer mi?
// Hedef sorudan başlayıp seçeneklerin gösterdiği sorular izlenir;
// seçeneğin ait olduğu soruya geri dönülebiliyorsa döngü vardır.
// haricSecenekId: güncellenen seçeneğin eski bağlantısı hesaba katılmaz.
const donguOlusturur = async (
    soruId: number,
    akisId: number,
    sonrakiSoruId: number,
    haricSecenekId?: number
) => {
    if (soruId === sonrakiSoruId) return true;

    const secenekler = await prisma.ikSecenek.findMany({
        where: {
            soru: {
                akisId,
            },
            sonrakiSoruId: {
                not: null,
            },
        },
    });

    // Soru -> gidilebilen sorular
    const baglantilar = new Map<number, number[]>();

    for (const secenek of secenekler) {
        if (secenek.id === haricSecenekId || secenek.sonrakiSoruId === null) continue;

        baglantilar.set(secenek.soruId, [
            ...(baglantilar.get(secenek.soruId) ?? []),
            secenek.sonrakiSoruId,
        ]);
    }

    const ziyaretEdilen = new Set<number>();
    const gidilecekler = [sonrakiSoruId];

    while (gidilecekler.length > 0) {
        const siradaki = gidilecekler.pop() as number;

        if (siradaki === soruId) return true;
        if (ziyaretEdilen.has(siradaki)) continue;

        ziyaretEdilen.add(siradaki);
        gidilecekler.push(...(baglantilar.get(siradaki) ?? []));
    }

    return false;
};

// Seçeneğin bağlanacağı soruyu denetler; sorun varsa hata mesajı, yoksa null döndürür
export const sonrakiSoruHatasi = async (
    soruId: number,
    sonrakiSoruId: number | null,
    haricSecenekId?: number
) => {
    // Boş bağlantı: bu seçenek akışı bitirir
    if (sonrakiSoruId === null) return null;

    const [soru, sonrakiSoru] = await Promise.all([
        prisma.ikSoru.findUnique({ where: { id: soruId } }),
        Number.isInteger(sonrakiSoruId)
            ? prisma.ikSoru.findUnique({ where: { id: sonrakiSoruId } })
            : null,
    ]);

    if (!soru || !sonrakiSoru) {
        return "Bağlanmak istenen soru bulunamadı.";
    }

    if (soru.akisId !== sonrakiSoru.akisId) {
        return "Bir seçenek yalnızca aynı akıştaki bir soruya bağlanabilir.";
    }

    if (await donguOlusturur(soruId, soru.akisId, sonrakiSoruId, haricSecenekId)) {
        return "Bu bağlantı döngü oluşturur; mülakat aynı sorulara geri dönerdi.";
    }

    return null;
};

// Gövdedeki sonrakiSoruId alanını sayıya ya da null'a çevirir
export const sonrakiSoruIdOku = (deger: unknown) =>
    deger === null || deger === undefined || deger === "" ? null : Number(deger);
