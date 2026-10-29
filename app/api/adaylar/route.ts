import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { adayIcerigi } from "../../../lib/adayIcerigi";
import { adayVerisiniDogrula } from "../../../lib/adayDogrula";

export async function GET() {
    try {
        const adaylar = await prisma.aday.findMany({
            include: adayIcerigi,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(adaylar);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Adaylar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const dogrulama = await adayVerisiniDogrula(body);

        if (dogrulama.hata !== undefined) {
            return NextResponse.json(
                { error: dogrulama.hata },
                { status: 400 }
            );
        }

        const { adSoyad, yas, eposta, telefon, pozisyonId } = dogrulama.veri;

        const aday = await prisma.aday.create({
            data: {
                adSoyad,
                yas,
                eposta,
                telefon,
                pozisyonId,
            },
            include: adayIcerigi,
        });

        return NextResponse.json(aday, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Aday eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}