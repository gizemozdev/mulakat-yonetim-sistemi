import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// Bir konunun altına yeni teknik soru ekler
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const konuId = Number(body.konuId);
        const metin = typeof body.metin === "string" ? body.metin.trim() : "";

        if (!metin) {
            return NextResponse.json(
                { error: "Soru metni boş bırakılamaz." },
                { status: 400 }
            );
        }

        const konu = Number.isInteger(konuId)
            ? await prisma.konu.findUnique({
                where: {
                    id: konuId,
                },
            })
            : null;

        if (!konu) {
            return NextResponse.json(
                { error: "Konu bulunamadı." },
                { status: 404 }
            );
        }

        const soru = await prisma.teknikSoru.create({
            data: {
                konuId,
                metin,
            },
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
