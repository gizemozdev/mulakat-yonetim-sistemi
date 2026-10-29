import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { adayIcerigi } from "../../../../../lib/adayIcerigi";
import { kararlar } from "../../../../../components/karar";

type Baglam = {
    params: Promise<{ id: string }>;
};

// Yalnızca kararı ve gerekçesini günceller; adayın diğer bilgilerini (ör. eksik iletişim) doğrulamaz
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const karar = body.karar;
        const kararNotu = typeof body.kararNotu === "string" ? body.kararNotu.trim() : "";

        if (!kararlar.includes(karar)) {
            return NextResponse.json(
                { error: "Geçersiz karar." },
                { status: 400 }
            );
        }

        const mevcutAday = Number.isInteger(id)
            ? await prisma.aday.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!mevcutAday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        const aday = await prisma.aday.update({
            where: {
                id,
            },
            data: {
                karar,
                kararNotu,
            },
            include: adayIcerigi,
        });

        return NextResponse.json(aday);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Karar kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
