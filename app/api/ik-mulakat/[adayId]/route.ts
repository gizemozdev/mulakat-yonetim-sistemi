import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { ikMulakatiBul, ikOturumu } from "../../../../lib/ikMulakat";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

const adayBul = (adayId: number) =>
    Number.isInteger(adayId) ? prisma.aday.findUnique({ where: { id: adayId } }) : null;

// Adayın İK mülakatının durumunu, sıradaki soruyu ve verilen cevapları getirir
export async function GET(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        if (!(await adayBul(adayId))) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        return NextResponse.json(await ikOturumu(adayId));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "İK mülakatı alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Mülakatı başlatır: önce genel akışın ilk sorusu, yoksa seçilen akışın ilk sorusu
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);
        const body = await request.json();

        const akisId =
            body.akisId === null || body.akisId === undefined || body.akisId === ""
                ? null
                : Number(body.akisId);

        if (!(await adayBul(adayId))) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        const oturum = await ikOturumu(adayId);

        if (oturum.baslatildi) {
            return NextResponse.json(
                { error: "Bu adayın İK mülakatı zaten başlatılmış." },
                { status: 409 }
            );
        }

        const genelAkis = await prisma.ikAkis.findFirst({ where: { genel: true } });

        const seciliAkis =
            akisId === null
                ? null
                : Number.isInteger(akisId)
                    ? await prisma.ikAkis.findUnique({ where: { id: akisId } })
                    : null;

        if (akisId !== null && (!seciliAkis || seciliAkis.genel)) {
            return NextResponse.json(
                { error: "Seçilen pozisyon akışı bulunamadı." },
                { status: 400 }
            );
        }

        const ilkSoruId = genelAkis?.ilkSoruId ?? seciliAkis?.ilkSoruId ?? null;

        if (ilkSoruId === null) {
            return NextResponse.json(
                { error: "Sorulacak soru yok. Genel akışa ya da seçilen akışa ilk soruyu ekleyin." },
                { status: 400 }
            );
        }

        await prisma.mulakat.upsert({
            where: {
                adayId_tur: {
                    adayId,
                    tur: "ik",
                },
            },
            update: {
                ikAkisId: seciliAkis?.id ?? null,
                ikGuncelSoruId: ilkSoruId,
            },
            create: {
                adayId,
                tur: "ik",
                ikAkisId: seciliAkis?.id ?? null,
                ikGuncelSoruId: ilkSoruId,
            },
        });

        return NextResponse.json(await ikOturumu(adayId), { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "İK mülakatı başlatılırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Yanlış başlatılan mülakatı sıfırlar: cevaplar silinir, akış seçimi ve genel not temizlenir.
// Tarih, saat ve mülakatçı kalır; tamamlanmışsa yeniden yapılacağı için durum "Planlandı" olur.
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const mulakat = Number.isInteger(adayId) ? await ikMulakatiBul(adayId) : null;

        if (!mulakat || (mulakat.ikCevaplar.length === 0 && !mulakat.ikGuncelSoruId)) {
            return NextResponse.json(
                { error: "Sıfırlanacak, başlatılmış bir İK mülakatı yok." },
                { status: 404 }
            );
        }

        await prisma.$transaction([
            prisma.ikCevap.deleteMany({
                where: {
                    mulakatId: mulakat.id,
                },
            }),
            prisma.mulakat.update({
                where: {
                    id: mulakat.id,
                },
                data: {
                    ikAkisId: null,
                    ikGuncelSoruId: null,
                    genelNot: "",
                    durum: mulakat.durum === "Tamamlandı" ? "Planlandı" : mulakat.durum,
                },
            }),
        ]);

        return NextResponse.json(await ikOturumu(adayId));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "İK mülakatı sıfırlanırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
