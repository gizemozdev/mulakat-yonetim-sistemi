import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type Baglam = {
    params: Promise<{ id: string }>;
};

const akisBul = (id: number) =>
    Number.isInteger(id) ? prisma.ikAkis.findUnique({ where: { id } }) : null;

// Akışın adını, bağlı pozisyonlarını ya da ilk sorusunu günceller.
// Gövdede hangi alan varsa yalnızca o değişir.
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const akis = await akisBul(id);

        if (!akis) {
            return NextResponse.json(
                { error: "Akış bulunamadı." },
                { status: 404 }
            );
        }

        const veri: {
            ad?: string;
            ilkSoruId?: number;
            pozisyonlar?: { set: { id: number }[] };
        } = {};

        if ("ad" in body) {
            const ad = typeof body.ad === "string" ? body.ad.trim() : "";

            if (!ad) {
                return NextResponse.json(
                    { error: "Akış adı boş bırakılamaz." },
                    { status: 400 }
                );
            }

            const ayniAdliAkis = await prisma.ikAkis.findUnique({ where: { ad } });

            if (ayniAdliAkis && ayniAdliAkis.id !== id) {
                return NextResponse.json(
                    { error: "Bu adda bir akış zaten var." },
                    { status: 409 }
                );
            }

            veri.ad = ad;
        }

        if ("pozisyonIdleri" in body) {
            if (akis.genel) {
                return NextResponse.json(
                    { error: "Genel akış pozisyonlara bağlanamaz; her mülakatta sorulur." },
                    { status: 400 }
                );
            }

            const pozisyonIdleri: number[] = Array.isArray(body.pozisyonIdleri)
                ? body.pozisyonIdleri.map(Number).filter(Number.isInteger)
                : [];

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

            // set: eski bağlantıları kaldırıp yalnızca bu pozisyonları bağlar
            veri.pozisyonlar = { set: pozisyonIdleri.map((pozisyonId) => ({ id: pozisyonId })) };
        }

        if ("ilkSoruId" in body) {
            const ilkSoruId = Number(body.ilkSoruId);

            const soru = Number.isInteger(ilkSoruId)
                ? await prisma.ikSoru.findUnique({ where: { id: ilkSoruId } })
                : null;

            if (!soru || soru.akisId !== id) {
                return NextResponse.json(
                    { error: "İlk soru bu akışın sorularından biri olmalıdır." },
                    { status: 400 }
                );
            }

            veri.ilkSoruId = ilkSoruId;
        }

        const guncelAkis = await prisma.ikAkis.update({
            where: {
                id,
            },
            data: veri,
            include: {
                pozisyonlar: {
                    select: {
                        id: true,
                        ad: true,
                    },
                },
            },
        });

        return NextResponse.json(guncelAkis);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Akış güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Akışı sorularıyla birlikte siler; genel akış silinemez
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const akis = await akisBul(id);

        if (!akis) {
            return NextResponse.json(
                { error: "Akış bulunamadı." },
                { status: 404 }
            );
        }

        if (akis.genel) {
            return NextResponse.json(
                { error: "Genel akış silinemez." },
                { status: 400 }
            );
        }

        await prisma.ikAkis.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Akış silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
