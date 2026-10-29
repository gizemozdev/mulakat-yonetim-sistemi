import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { sonrakiSoruHatasi, sonrakiSoruIdOku } from "../../../lib/ikAkis";

// Soruya yeni cevap seçeneği ekler
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const soruId = Number(body.soruId);
        const metin = typeof body.metin === "string" ? body.metin.trim() : "";
        const sonrakiSoruId = sonrakiSoruIdOku(body.sonrakiSoruId);

        if (!metin) {
            return NextResponse.json(
                { error: "Seçenek metni boş bırakılamaz." },
                { status: 400 }
            );
        }

        const soru = Number.isInteger(soruId)
            ? await prisma.ikSoru.findUnique({ where: { id: soruId } })
            : null;

        if (!soru) {
            return NextResponse.json(
                { error: "Soru bulunamadı." },
                { status: 404 }
            );
        }

        const baglantiHatasi = await sonrakiSoruHatasi(soruId, sonrakiSoruId);

        if (baglantiHatasi) {
            return NextResponse.json(
                { error: baglantiHatasi },
                { status: 409 }
            );
        }

        const secenek = await prisma.ikSecenek.create({
            data: {
                soruId,
                metin,
                sonrakiSoruId,
            },
        });

        return NextResponse.json(secenek, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Seçenek eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
