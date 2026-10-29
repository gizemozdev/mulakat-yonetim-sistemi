import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { ikMulakatiBul, ikOturumu } from "../../../../../lib/ikMulakat";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

// Sorular bittiyse genel notu kaydeder ve mülakatı Tamamlandı yapar
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);
        const body = await request.json();

        const genelNot = typeof body.genelNot === "string" ? body.genelNot.trim() : "";

        const mulakat = Number.isInteger(adayId) ? await ikMulakatiBul(adayId) : null;

        if (!mulakat || mulakat.ikCevaplar.length === 0) {
            return NextResponse.json(
                { error: "Başlatılmış bir İK mülakatı bulunamadı." },
                { status: 404 }
            );
        }

        if (mulakat.ikGuncelSoruId) {
            return NextResponse.json(
                { error: "Sorular bitmeden mülakat bitirilemez." },
                { status: 400 }
            );
        }

        await prisma.mulakat.update({
            where: {
                id: mulakat.id,
            },
            data: {
                durum: "Tamamlandı",
                genelNot,
            },
        });

        return NextResponse.json(await ikOturumu(adayId));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakat bitirilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
