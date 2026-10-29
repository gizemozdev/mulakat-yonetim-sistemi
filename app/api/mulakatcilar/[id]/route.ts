import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const alanlar = ["ik", "teknik"];

type Baglam = {
    params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const adSoyad =
            typeof body.adSoyad === "string" ? body.adSoyad.trim() : "";
        const alan = body.alan;

        if (!adSoyad) {
            return NextResponse.json(
                { error: "Ad Soyad alanı boş bırakılamaz." },
                { status: 400 }
            );
        }

        if (!alanlar.includes(alan)) {
            return NextResponse.json(
                { error: "Lütfen bir alan seçin." },
                { status: 400 }
            );
        }

        const mulakatci = Number.isInteger(id)
            ? await prisma.mulakatci.findUnique({
                where: {
                    id,
                },
                include: {
                    _count: {
                        select: {
                            mulakatlar: true,
                        },
                    },
                },
            })
            : null;

        if (!mulakatci) {
            return NextResponse.json(
                { error: "Mülakatçı bulunamadı." },
                { status: 404 }
            );
        }

        // Atanmış mülakatı varken alan değişirse İK mülakatında teknik kişi kalırdı
        if (mulakatci.alan !== alan && mulakatci._count.mulakatlar > 0) {
            return NextResponse.json(
                {
                    error: "Bu mülakatçının atandığı mülakatlar olduğu için alanı değiştirilemez.",
                },
                { status: 409 }
            );
        }

        const ayniMulakatci = await prisma.mulakatci.findUnique({
            where: {
                adSoyad_alan: {
                    adSoyad,
                    alan,
                },
            },
        });

        if (ayniMulakatci && ayniMulakatci.id !== id) {
            return NextResponse.json(
                { error: "Bu mülakatçı bu alanda zaten tanımlı." },
                { status: 409 }
            );
        }

        const guncelMulakatci = await prisma.mulakatci.update({
            where: {
                id,
            },
            data: {
                adSoyad,
                alan,
            },
        });

        return NextResponse.json(guncelMulakatci);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakatçı güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Mülakatçı silinince mülakat kayıtları kalır, kişi alanı boşalır (onDelete: SetNull)
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const mulakatci = Number.isInteger(id)
            ? await prisma.mulakatci.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!mulakatci) {
            return NextResponse.json(
                { error: "Mülakatçı bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.mulakatci.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakatçı silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
