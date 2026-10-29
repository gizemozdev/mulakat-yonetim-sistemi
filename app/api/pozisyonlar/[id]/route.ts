import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type Baglam = {
    params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const ad = typeof body.ad === "string" ? body.ad.trim() : "";

        if (!ad) {
            return NextResponse.json(
                { error: "Pozisyon adı boş bırakılamaz." },
                { status: 400 }
            );
        }

        const pozisyon = Number.isInteger(id)
            ? await prisma.pozisyon.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!pozisyon) {
            return NextResponse.json(
                { error: "Pozisyon bulunamadı." },
                { status: 404 }
            );
        }

        const ayniAdliPozisyon = await prisma.pozisyon.findUnique({
            where: {
                ad,
            },
        });

        if (ayniAdliPozisyon && ayniAdliPozisyon.id !== id) {
            return NextResponse.json(
                { error: "Bu pozisyon zaten tanımlı." },
                { status: 409 }
            );
        }

        const guncelPozisyon = await prisma.pozisyon.update({
            where: {
                id,
            },
            data: {
                ad,
            },
        });

        return NextResponse.json(guncelPozisyon);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Pozisyon güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const pozisyon = Number.isInteger(id)
            ? await prisma.pozisyon.findUnique({
                where: {
                    id,
                },
                include: {
                    _count: {
                        select: {
                            adaylar: true,
                        },
                    },
                },
            })
            : null;

        if (!pozisyon) {
            return NextResponse.json(
                { error: "Pozisyon bulunamadı." },
                { status: 404 }
            );
        }

        // Adayı olan pozisyon silinemez
        if (pozisyon._count.adaylar > 0) {
            return NextResponse.json(
                {
                    error: `Bu pozisyona başvuran ${pozisyon._count.adaylar} aday olduğu için silinemez.`,
                },
                { status: 409 }
            );
        }

        await prisma.pozisyon.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Pozisyon silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
