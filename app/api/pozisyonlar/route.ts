import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
    try {
        const pozisyonlar = await prisma.pozisyon.findMany({
            orderBy: {
                ad: "asc",
            },
        });

        return NextResponse.json(pozisyonlar);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Pozisyonlar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const ad = typeof body.ad === "string" ? body.ad.trim() : "";

        if (!ad) {
            return NextResponse.json(
                { error: "Pozisyon adı boş bırakılamaz." },
                { status: 400 }
            );
        }

        const mevcutPozisyon = await prisma.pozisyon.findUnique({
            where: {
                ad,
            },
        });

        if (mevcutPozisyon) {
            return NextResponse.json(
                { error: "Bu pozisyon zaten tanımlı." },
                { status: 409 }
            );
        }

        const pozisyon = await prisma.pozisyon.create({
            data: {
                ad,
            },
        });

        return NextResponse.json(pozisyon, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Pozisyon eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
