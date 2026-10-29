import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// Konuları altlarındaki sorularla birlikte getirir
export async function GET() {
    try {
        const konular = await prisma.konu.findMany({
            orderBy: {
                ad: "asc",
            },
            include: {
                sorular: {
                    orderBy: {
                        id: "asc",
                    },
                },
            },
        });

        return NextResponse.json(konular);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Konular alınırken bir hata oluştu." },
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
                { error: "Konu adı boş bırakılamaz." },
                { status: 400 }
            );
        }

        const mevcutKonu = await prisma.konu.findUnique({
            where: {
                ad,
            },
        });

        if (mevcutKonu) {
            return NextResponse.json(
                { error: "Bu konu zaten tanımlı." },
                { status: 409 }
            );
        }

        const konu = await prisma.konu.create({
            data: {
                ad,
            },
            include: {
                sorular: true,
            },
        });

        return NextResponse.json(konu, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Konu eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
