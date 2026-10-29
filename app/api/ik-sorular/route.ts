import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// Akışa yeni soru ekler; akışın ilk sorusu yoksa bu soru ilk soru olur
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const akisId = Number(body.akisId);
        const metin = typeof body.metin === "string" ? body.metin.trim() : "";

        if (!metin) {
            return NextResponse.json(
                { error: "Soru metni boş bırakılamaz." },
                { status: 400 }
            );
        }

        const akis = Number.isInteger(akisId)
            ? await prisma.ikAkis.findUnique({ where: { id: akisId } })
            : null;

        if (!akis) {
            return NextResponse.json(
                { error: "Akış bulunamadı." },
                { status: 404 }
            );
        }

        const soru = await prisma.$transaction(async (tx) => {
            const yeniSoru = await tx.ikSoru.create({
                data: {
                    akisId,
                    metin,
                },
                include: {
                    secenekler: true,
                },
            });

            if (akis.ilkSoruId === null) {
                await tx.ikAkis.update({
                    where: {
                        id: akisId,
                    },
                    data: {
                        ilkSoruId: yeniSoru.id,
                    },
                });
            }

            return yeniSoru;
        });

        return NextResponse.json(soru, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Soru eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
