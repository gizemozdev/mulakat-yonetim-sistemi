import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { csvOlustur } from "../../../../lib/csv";
import { teknikTamamlandi, yuzdeHesapla, Degerlendirme } from "../../../../components/teknikPuan";

const ikiHane = (sayi: number) => String(sayi).padStart(2, "0");

// "2026-10-27" -> "27.10.2026" (Excel'de Türkçe tarih gibi görünsün)
const tarihGoster = (tarih: string) => (tarih ? tarih.split("-").reverse().join(".") : "");

// Bütün adaylar ve iki mülakatlarının özeti, CSV dosyası olarak indirilir
export async function GET() {
    try {
        const adaylar = await prisma.aday.findMany({
            include: {
                pozisyon: true,
                mulakatlar: {
                    include: {
                        mulakatci: {
                            select: {
                                adSoyad: true,
                            },
                        },
                        teknikCevaplar: {
                            select: {
                                degerlendirme: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                adSoyad: "asc",
            },
        });

        const mulakatSutunlari = (tur: "ik" | "teknik") => {
            const ad = tur === "ik" ? "İK" : "Teknik";
            return [`${ad} durumu`, `${ad} tarihi`, `${ad} saati`, `${ad} mülakatçısı`];
        };

        const basliklar = [
            "Ad Soyad",
            "Yaş",
            "E-posta",
            "Telefon",
            "Pozisyon",
            "Karar",
            "Karar gerekçesi",
            ...mulakatSutunlari("ik"),
            ...mulakatSutunlari("teknik"),
            "Teknik puan (%)",
        ];

        const satirlar = adaylar.map((aday) => {
            const mulakatBilgisi = (tur: "ik" | "teknik") => {
                const mulakat = aday.mulakatlar.find((kayit) => kayit.tur === tur);

                return [
                    mulakat?.durum ?? "Planlanmadı",
                    tarihGoster(mulakat?.tarih ?? ""),
                    mulakat?.saat ?? "",
                    mulakat?.mulakatci?.adSoyad ?? "",
                ];
            };

            const teknik = aday.mulakatlar.find((kayit) => kayit.tur === "teknik");
            const cevaplar = (teknik?.teknikCevaplar ?? []) as { degerlendirme: Degerlendirme | null }[];

            return [
                aday.adSoyad,
                aday.yas,
                aday.eposta,
                aday.telefon,
                aday.pozisyon.ad,
                aday.karar,
                aday.kararNotu,
                ...mulakatBilgisi("ik"),
                ...mulakatBilgisi("teknik"),
                // Puan yalnızca tamamlanmış mülakatta; diğerlerinde boş
                teknikTamamlandi(teknik?.durum, cevaplar) ? yuzdeHesapla(cevaplar) : null,
            ];
        });

        const simdi = new Date();
        const dosyaAdi = `adaylar-${simdi.getFullYear()}-${ikiHane(simdi.getMonth() + 1)}-${ikiHane(simdi.getDate())}.csv`;

        return new NextResponse(csvOlustur(basliklar, satirlar), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
            },
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Adaylar dışa aktarılırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
