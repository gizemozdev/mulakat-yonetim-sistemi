import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { mevcutKullanici } from "../../../../lib/oturum";

const ikiHane = (sayi: number) => String(sayi).padStart(2, "0");

// Giriş yapan kişinin mülakatçı kayıtlarına atanmış, bugün ya da sonrasındaki planlanmış mülakatlar
export async function GET() {
    try {
        const ben = await mevcutKullanici();

        if (!ben) {
            return NextResponse.json(
                { error: "Oturum bulunamadı." },
                { status: 401 }
            );
        }

        const eslesmeSayisi = await prisma.mulakatci.count({
            where: {
                kullaniciId: ben.id,
            },
        });

        // Tarihler "YYYY-AA-GG" metni olduğu için metin karşılaştırması tarih sırasıyla aynı
        const simdi = new Date();
        const bugun = `${simdi.getFullYear()}-${ikiHane(simdi.getMonth() + 1)}-${ikiHane(simdi.getDate())}`;

        const mulakatlar = await prisma.mulakat.findMany({
            where: {
                durum: "Planlandı",
                tarih: {
                    gte: bugun,
                },
                mulakatci: {
                    kullaniciId: ben.id,
                },
            },
            include: {
                aday: {
                    select: {
                        adSoyad: true,
                        pozisyon: {
                            select: {
                                ad: true,
                            },
                        },
                    },
                },
            },
        });

        // Tarih, sonra saat; saati girilmemiş olanlar o günün sonunda
        mulakatlar.sort(
            (a, b) =>
                a.tarih.localeCompare(b.tarih) || (a.saat || "~").localeCompare(b.saat || "~")
        );

        return NextResponse.json({
            eslesmis: eslesmeSayisi > 0,
            mulakatlar,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Atanan mülakatlar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
