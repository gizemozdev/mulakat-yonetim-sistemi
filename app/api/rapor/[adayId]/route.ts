import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

// Sonuç raporu için adayın bilgileri ve iki mülakatının bütün ayrıntıları tek seferde
export async function GET(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);

        const aday = Number.isInteger(adayId)
            ? await prisma.aday.findUnique({
                where: {
                    id: adayId,
                },
                include: {
                    pozisyon: true,
                    mulakatlar: {
                        include: {
                            mulakatci: {
                                select: {
                                    adSoyad: true,
                                },
                            },
                            ikAkis: {
                                select: {
                                    ad: true,
                                },
                            },
                            ikCevaplar: {
                                orderBy: {
                                    sira: "asc",
                                },
                            },
                            teknikCevaplar: {
                                orderBy: {
                                    sira: "asc",
                                },
                            },
                        },
                    },
                },
            })
            : null;

        if (!aday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        const { mulakatlar, ...adayBilgisi } = aday;

        return NextResponse.json({
            aday: adayBilgisi,
            ik: mulakatlar.find((mulakat) => mulakat.tur === "ik") ?? null,
            teknik: mulakatlar.find((mulakat) => mulakat.tur === "teknik") ?? null,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Rapor alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
