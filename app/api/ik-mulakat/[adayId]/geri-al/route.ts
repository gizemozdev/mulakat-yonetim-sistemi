import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { ikMulakatiBul, ikOturumu } from "../../../../../lib/ikMulakat";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

// Son verilen cevabı siler ve mülakatı o soruya geri döndürür
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const mulakat = Number.isInteger(adayId) ? await ikMulakatiBul(adayId) : null;
        const sonCevap = mulakat?.ikCevaplar.at(-1);

        if (!mulakat || !sonCevap) {
            return NextResponse.json(
                { error: "Geri alınacak bir cevap yok." },
                { status: 400 }
            );
        }

        if (mulakat.durum === "Tamamlandı") {
            return NextResponse.json(
                { error: "Tamamlanmış bir mülakatta cevap geri alınamaz." },
                { status: 409 }
            );
        }

        const soru = sonCevap.soruId
            ? await prisma.ikSoru.findUnique({ where: { id: sonCevap.soruId } })
            : null;

        if (!soru) {
            return NextResponse.json(
                { error: "Bu soru akıştan silindiği için cevap geri alınamıyor." },
                { status: 409 }
            );
        }

        await prisma.$transaction([
            prisma.ikCevap.delete({
                where: {
                    id: sonCevap.id,
                },
            }),
            prisma.mulakat.update({
                where: {
                    id: mulakat.id,
                },
                data: {
                    ikGuncelSoruId: soru.id,
                },
            }),
        ]);

        return NextResponse.json(await ikOturumu(adayId));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Cevap geri alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
