import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const degerlendirmeler = ["yeterli", "orta", "yetersiz"];

type Baglam = {
    params: Promise<{ id: string }>;
};

// Bir soruya verilen değerlendirmeyi (Yeterli / Orta / Yetersiz) kaydeder
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        if (!degerlendirmeler.includes(body.degerlendirme)) {
            return NextResponse.json(
                { error: "Geçersiz değerlendirme." },
                { status: 400 }
            );
        }

        const cevap = Number.isInteger(id)
            ? await prisma.teknikCevap.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!cevap) {
            return NextResponse.json(
                { error: "Soru bulunamadı." },
                { status: 404 }
            );
        }

        const guncelCevap = await prisma.teknikCevap.update({
            where: {
                id,
            },
            data: {
                degerlendirme: body.degerlendirme,
            },
        });

        return NextResponse.json(guncelCevap);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Değerlendirme kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
