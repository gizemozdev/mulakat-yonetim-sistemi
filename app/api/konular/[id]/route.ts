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
                { error: "Konu adı boş bırakılamaz." },
                { status: 400 }
            );
        }

        const konu = Number.isInteger(id)
            ? await prisma.konu.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!konu) {
            return NextResponse.json(
                { error: "Konu bulunamadı." },
                { status: 404 }
            );
        }

        const ayniAdliKonu = await prisma.konu.findUnique({
            where: {
                ad,
            },
        });

        if (ayniAdliKonu && ayniAdliKonu.id !== id) {
            return NextResponse.json(
                { error: "Bu konu zaten tanımlı." },
                { status: 409 }
            );
        }

        const guncelKonu = await prisma.konu.update({
            where: {
                id,
            },
            data: {
                ad,
            },
        });

        return NextResponse.json(guncelKonu);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Konu güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const konu = Number.isInteger(id)
            ? await prisma.konu.findUnique({
                where: {
                    id,
                },
                include: {
                    _count: {
                        select: {
                            sorular: true,
                        },
                    },
                },
            })
            : null;

        if (!konu) {
            return NextResponse.json(
                { error: "Konu bulunamadı." },
                { status: 404 }
            );
        }

        // İçinde soru olan konu silinemez; sorular yanlışlıkla kaybolmasın
        if (konu._count.sorular > 0) {
            return NextResponse.json(
                {
                    error: `Bu konuda ${konu._count.sorular} soru olduğu için silinemez. Önce soruları silin.`,
                },
                { status: 409 }
            );
        }

        await prisma.konu.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Konu silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
