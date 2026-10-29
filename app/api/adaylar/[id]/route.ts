import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { adayIcerigi } from "../../../../lib/adayIcerigi";
import { adayVerisiniDogrula } from "../../../../lib/adayDogrula";

type Baglam = {
    params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const dogrulama = await adayVerisiniDogrula(body);

        if (dogrulama.hata !== undefined) {
            return NextResponse.json(
                { error: dogrulama.hata },
                { status: 400 }
            );
        }

        const { adSoyad, yas, eposta, telefon, pozisyonId } = dogrulama.veri;

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
                adSoyad,
                yas,
                eposta,
                telefon,
                pozisyonId,
            },
            include: adayIcerigi,
        });

        return NextResponse.json(aday);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Aday güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Aday silinince mülakat kayıtları da birlikte silinir (şemada onDelete: Cascade)
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const aday = Number.isInteger(id)
            ? await prisma.aday.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!aday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.aday.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Aday silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
