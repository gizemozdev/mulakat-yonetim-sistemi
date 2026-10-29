import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

// Bütün sorular değerlendirildiyse mülakatın durumunu Tamamlandı yapar
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const mulakat = Number.isInteger(adayId)
            ? await prisma.mulakat.findUnique({
                where: {
                    adayId_tur: {
                        adayId,
                        tur: "teknik",
                    },
                },
                include: {
                    teknikCevaplar: true,
                },
            })
            : null;

        if (!mulakat || mulakat.teknikCevaplar.length === 0) {
            return NextResponse.json(
                { error: "Başlatılmış bir teknik mülakat bulunamadı." },
                { status: 404 }
            );
        }

        const bosKalan = mulakat.teknikCevaplar.filter(
            (cevap) => !cevap.degerlendirme
        ).length;

        if (bosKalan > 0) {
            return NextResponse.json(
                { error: `Değerlendirilmemiş ${bosKalan} soru var.` },
                { status: 400 }
            );
        }

        const guncelMulakat = await prisma.mulakat.update({
            where: {
                id: mulakat.id,
            },
            data: {
                durum: "Tamamlandı",
            },
        });

        return NextResponse.json({ durum: guncelMulakat.durum });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakat bitirilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
