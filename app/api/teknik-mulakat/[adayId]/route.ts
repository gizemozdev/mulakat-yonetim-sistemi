import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

type Secim = {
    konuId: number;
    adet: number;
};

// Fisher-Yates: listeyi yerinde değil, kopyası üzerinde rastgele karıştırır
const karistir = <T,>(liste: T[]): T[] => {
    const kopya = [...liste];

    for (let i = kopya.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
    }

    return kopya;
};

const oturumuGetir = (adayId: number) =>
    prisma.mulakat.findUnique({
        where: {
            adayId_tur: {
                adayId,
                tur: "teknik",
            },
        },
        include: {
            teknikCevaplar: {
                orderBy: {
                    sira: "asc",
                },
            },
        },
    });

// Adayın teknik mülakatını ve sorulan soruları getirir
export async function GET(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const aday = Number.isInteger(adayId)
            ? await prisma.aday.findUnique({
                where: {
                    id: adayId,
                },
            })
            : null;

        if (!aday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        const mulakat = await oturumuGetir(adayId);

        return NextResponse.json({
            durum: mulakat?.durum ?? "Planlanmadı",
            cevaplar: mulakat?.teknikCevaplar ?? [],
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Teknik mülakat alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Mülakatı başlatır: her konudan istenen sayıda soruyu rastgele seçer ve karıştırır
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);
        const body = await request.json();

        const secimler: Secim[] = Array.isArray(body.secimler)
            ? body.secimler
                .map((secim: Secim) => ({
                    konuId: Number(secim.konuId),
                    adet: Number(secim.adet),
                }))
                .filter((secim: Secim) => Number.isInteger(secim.adet) && secim.adet > 0)
            : [];

        if (secimler.length === 0) {
            return NextResponse.json(
                { error: "En az bir konudan soru seçmelisiniz." },
                { status: 400 }
            );
        }

        const aday = Number.isInteger(adayId)
            ? await prisma.aday.findUnique({
                where: {
                    id: adayId,
                },
            })
            : null;

        if (!aday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        const mevcut = await oturumuGetir(adayId);

        if (mevcut && mevcut.teknikCevaplar.length > 0) {
            return NextResponse.json(
                { error: "Bu adayın teknik mülakatı zaten başlatılmış." },
                { status: 409 }
            );
        }

        // Her konudan istenen sayıda soruyu seç
        const secilenSorular: { konuAdi: string; soruMetni: string }[] = [];

        for (const secim of secimler) {
            const konu = await prisma.konu.findUnique({
                where: {
                    id: secim.konuId,
                },
                include: {
                    sorular: true,
                },
            });

            if (!konu) {
                return NextResponse.json(
                    { error: "Seçilen konulardan biri bulunamadı." },
                    { status: 404 }
                );
            }

            if (secim.adet > konu.sorular.length) {
                return NextResponse.json(
                    {
                        error: `${konu.ad} konusunda yalnızca ${konu.sorular.length} soru var.`,
                    },
                    { status: 400 }
                );
            }

            karistir(konu.sorular)
                .slice(0, secim.adet)
                .forEach((soru) =>
                    secilenSorular.push({ konuAdi: konu.ad, soruMetni: soru.metin })
                );
        }

        // Konulardan gelen soruları birbirine karıştır ve sırayla kaydet
        await prisma.$transaction(async (tx) => {
            const mulakat = await tx.mulakat.upsert({
                where: {
                    adayId_tur: {
                        adayId,
                        tur: "teknik",
                    },
                },
                update: {},
                create: {
                    adayId,
                    tur: "teknik",
                },
            });

            await tx.teknikCevap.createMany({
                data: karistir(secilenSorular).map((soru, sira) => ({
                    mulakatId: mulakat.id,
                    sira: sira + 1,
                    konuAdi: soru.konuAdi,
                    soruMetni: soru.soruMetni,
                })),
            });
        });

        const mulakat = await oturumuGetir(adayId);

        return NextResponse.json(
            {
                durum: mulakat?.durum ?? "Planlanmadı",
                cevaplar: mulakat?.teknikCevaplar ?? [],
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Teknik mülakat başlatılırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Mülakatı sıfırlar: seçilen sorular ve değerlendirmeler silinir, mülakat yeniden başlatılabilir.
// Mülakatçı ve tarih korunur; tamamlanmış mülakatın durumu Planlandı'ya döner.
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const mulakat = Number.isInteger(adayId) ? await oturumuGetir(adayId) : null;

        if (!mulakat || mulakat.teknikCevaplar.length === 0) {
            return NextResponse.json(
                { error: "Sıfırlanacak, başlatılmış bir teknik mülakat yok." },
                { status: 404 }
            );
        }

        const [, guncelMulakat] = await prisma.$transaction([
            prisma.teknikCevap.deleteMany({
                where: {
                    mulakatId: mulakat.id,
                },
            }),
            prisma.mulakat.update({
                where: {
                    id: mulakat.id,
                },
                data: {
                    durum: mulakat.durum === "Tamamlandı" ? "Planlandı" : mulakat.durum,
                },
            }),
        ]);

        return NextResponse.json({ durum: guncelMulakat.durum, cevaplar: [] });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Teknik mülakat sıfırlanırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
