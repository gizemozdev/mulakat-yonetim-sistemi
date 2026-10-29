import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// Akışları soruları, seçenekleri ve bağlı pozisyonlarıyla getirir; genel akış en başta
export async function GET() {
    try {
        const akislar = await prisma.ikAkis.findMany({
            orderBy: [{ genel: "desc" }, { ad: "asc" }],
            include: {
                pozisyonlar: {
                    select: {
                        id: true,
                        ad: true,
                    },
                },
                sorular: {
                    orderBy: {
                        id: "asc",
                    },
                    include: {
                        secenekler: {
                            orderBy: {
                                id: "asc",
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(akislar);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Akışlar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Yeni pozisyon akışı oluşturur
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const ad = typeof body.ad === "string" ? body.ad.trim() : "";
        const pozisyonIdleri: number[] = Array.isArray(body.pozisyonIdleri)
            ? body.pozisyonIdleri.map(Number).filter(Number.isInteger)
            : [];

        if (!ad) {
            return NextResponse.json(
                { error: "Akış adı boş bırakılamaz." },
                { status: 400 }
            );
        }

        if (await prisma.ikAkis.findUnique({ where: { ad } })) {
            return NextResponse.json(
                { error: "Bu adda bir akış zaten var." },
                { status: 409 }
            );
        }

        const pozisyonSayisi = await prisma.pozisyon.count({
            where: {
                id: {
                    in: pozisyonIdleri,
                },
            },
        });

        if (pozisyonSayisi !== pozisyonIdleri.length) {
            return NextResponse.json(
                { error: "Seçilen pozisyonlardan biri bulunamadı." },
                { status: 400 }
            );
        }

        const akis = await prisma.ikAkis.create({
            data: {
                ad,
                pozisyonlar: {
                    connect: pozisyonIdleri.map((id) => ({ id })),
                },
            },
            include: {
                pozisyonlar: {
                    select: {
                        id: true,
                        ad: true,
                    },
                },
                sorular: true,
            },
        });

        return NextResponse.json(akis, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Akış eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
