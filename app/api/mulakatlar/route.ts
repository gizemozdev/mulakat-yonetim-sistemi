import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

const turler = ["ik", "teknik"];
const durumlar = ["Planlanmadı", "Planlandı", "Tamamlandı", "İptal"];

export async function GET() {
    try {
        const mulakatlar = await prisma.mulakat.findMany({
            include: {
                _count: {
                    select: {
                        teknikCevaplar: true,
                        ikCevaplar: true,
                    },
                },
                // Mülakatlar sayfasındaki sonuç özeti için
                teknikCevaplar: {
                    select: {
                        konuAdi: true,
                        degerlendirme: true,
                    },
                },
                ikAkis: {
                    select: {
                        ad: true,
                    },
                },
            },
        });

        return NextResponse.json(mulakatlar);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakatlar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Adayın ilgili türdeki mülakatı yoksa oluşturur, varsa günceller
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        const adayId = Number(body.adayId);
        const tur = body.tur;
        const mulakatciId = body.mulakatciId ? Number(body.mulakatciId) : null;
        const tarih = typeof body.tarih === "string" ? body.tarih : "";
        const saat = typeof body.saat === "string" ? body.saat : "";
        const durum = body.durum;

        if (!Number.isInteger(adayId) || !turler.includes(tur)) {
            return NextResponse.json(
                { error: "Gerekli alanlar eksik." },
                { status: 400 }
            );
        }

        if (!durumlar.includes(durum)) {
            return NextResponse.json(
                { error: "Geçersiz mülakat durumu." },
                { status: 400 }
            );
        }

        if (tarih && !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
            return NextResponse.json(
                { error: "Geçersiz mülakat tarihi." },
                { status: 400 }
            );
        }

        // Saat isteğe bağlı; girilmişse "SS:DD" ve gerçek bir saat olmalı
        if (saat && !/^([01]\d|2[0-3]):[0-5]\d$/.test(saat)) {
            return NextResponse.json(
                { error: "Geçersiz mülakat saati." },
                { status: 400 }
            );
        }

        const aday = await prisma.aday.findUnique({
            where: {
                id: adayId,
            },
        });

        if (!aday) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        if (mulakatciId !== null) {
            const mulakatci = Number.isInteger(mulakatciId)
                ? await prisma.mulakatci.findUnique({
                    where: {
                        id: mulakatciId,
                    },
                })
                : null;

            // Mülakatçının alanı mülakatın türüyle aynı olmalı
            if (!mulakatci || mulakatci.alan !== tur) {
                return NextResponse.json(
                    { error: "Seçilen mülakatçı bu mülakat türü için uygun değil." },
                    { status: 400 }
                );
            }
        }

        const mulakat = await prisma.mulakat.upsert({
            where: {
                adayId_tur: {
                    adayId,
                    tur,
                },
            },
            update: {
                mulakatciId,
                tarih,
                saat,
                durum,
            },
            create: {
                adayId,
                tur,
                mulakatciId,
                tarih,
                saat,
                durum,
            },
        });

        return NextResponse.json(mulakat);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakat kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
