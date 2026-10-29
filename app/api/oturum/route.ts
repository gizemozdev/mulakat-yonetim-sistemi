import { NextResponse } from "next/server";
import { mevcutKullanici } from "../../../lib/oturum";

// Giriş yapmış kullanıcının adını döndürür (üst menüde gösterilir)
export async function GET() {
    try {
        const kullanici = await mevcutKullanici();

        if (!kullanici) {
            return NextResponse.json(
                { error: "Oturum bulunamadı." },
                { status: 401 }
            );
        }

        return NextResponse.json({
            kullaniciAdi: kullanici.kullaniciAdi,
            adSoyad: kullanici.adSoyad,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Oturum bilgisi alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
