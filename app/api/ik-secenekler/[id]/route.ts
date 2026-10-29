import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { sonrakiSoruHatasi, sonrakiSoruIdOku } from "../../../../lib/ikAkis";

type Baglam = {
    params: Promise<{ id: string }>;
};

const secenekBul = (id: number) =>
    Number.isInteger(id) ? prisma.ikSecenek.findUnique({ where: { id } }) : null;

// Seçeneğin metnini ve/veya bağlandığı sonraki soruyu günceller
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const secenek = await secenekBul(id);

        if (!secenek) {
            return NextResponse.json(
                { error: "Seçenek bulunamadı." },
                { status: 404 }
            );
        }

        const veri: { metin?: string; sonrakiSoruId?: number | null } = {};

        if ("metin" in body) {
            const metin = typeof body.metin === "string" ? body.metin.trim() : "";

            if (!metin) {
                return NextResponse.json(
                    { error: "Seçenek metni boş bırakılamaz." },
                    { status: 400 }
                );
            }

            veri.metin = metin;
        }

        if ("sonrakiSoruId" in body) {
            const sonrakiSoruId = sonrakiSoruIdOku(body.sonrakiSoruId);

            // Seçeneğin eski bağlantısı hesaba katılmaz, yerine yenisi gelecek
            const baglantiHatasi = await sonrakiSoruHatasi(secenek.soruId, sonrakiSoruId, id);

            if (baglantiHatasi) {
                return NextResponse.json(
                    { error: baglantiHatasi },
                    { status: 409 }
                );
            }

            veri.sonrakiSoruId = sonrakiSoruId;
        }

        const guncelSecenek = await prisma.ikSecenek.update({
            where: {
                id,
            },
            data: veri,
        });

        return NextResponse.json(guncelSecenek);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Seçenek güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        if (!(await secenekBul(id))) {
            return NextResponse.json(
                { error: "Seçenek bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.ikSecenek.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Seçenek silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
