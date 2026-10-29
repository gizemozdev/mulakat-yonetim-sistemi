import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { oturumAc, sifreDogrula } from "../../../lib/oturum";

// Art arda bu kadar yanlış şifreden sonra hesap bir süre kilitlenir (tahminle şifre bulmayı yavaşlatır)
const EN_FAZLA_DENEME = 5;
const KILIT_SURESI_DAKIKA = 15;

// 429: çok fazla istek
const kilitliMesaji = (kilitBitis: Date) => {
    const kalanDakika = Math.ceil((kilitBitis.getTime() - Date.now()) / 60000);

    return NextResponse.json(
        {
            error: `Çok fazla hatalı deneme yapıldı. ${kalanDakika} dakika sonra tekrar deneyin.`,
        },
        { status: 429 }
    );
};

// Henüz hiç kullanıcı yoksa giriş sayfası ilk kullanıcıyı oluşturma formunu gösterir
export async function GET() {
    try {
        const kullaniciSayisi = await prisma.kullanici.count();

        return NextResponse.json({ kurulumGerekli: kullaniciSayisi === 0 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Giriş bilgisi alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const kullaniciAdi =
            typeof body.kullaniciAdi === "string" ? body.kullaniciAdi.trim() : "";
        const sifre = typeof body.sifre === "string" ? body.sifre : "";

        if (!kullaniciAdi || !sifre) {
            return NextResponse.json(
                { error: "Kullanıcı adı ve şifre boş bırakılamaz." },
                { status: 400 }
            );
        }

        const kullanici = await prisma.kullanici.findUnique({
            where: {
                kullaniciAdi,
            },
        });

        const hataMesaji = NextResponse.json(
            { error: "Kullanıcı adı ya da şifre hatalı." },
            { status: 401 }
        );

        // Kullanıcı adının mı şifrenin mi yanlış olduğu bilerek söylenmez
        if (!kullanici) {
            return hataMesaji;
        }

        // Kilitliyken şifreye hiç bakılmaz; doğru şifre de kilidi açmaz
        if (kullanici.kilitBitis && kullanici.kilitBitis > new Date()) {
            return kilitliMesaji(kullanici.kilitBitis);
        }

        if (!(await sifreDogrula(sifre, kullanici.sifreOzeti))) {
            // Süresi dolmuş bir kilitten sonra sayım baştan başlar
            const hataliDeneme = (kullanici.kilitBitis ? 0 : kullanici.hataliDeneme) + 1;
            const kilitBitis =
                hataliDeneme >= EN_FAZLA_DENEME
                    ? new Date(Date.now() + KILIT_SURESI_DAKIKA * 60 * 1000)
                    : null;

            await prisma.kullanici.update({
                where: {
                    id: kullanici.id,
                },
                data: {
                    hataliDeneme,
                    kilitBitis,
                },
            });

            return kilitBitis ? kilitliMesaji(kilitBitis) : hataMesaji;
        }

        // Başarılı girişte sayaç ve kilit sıfırlanır
        if (kullanici.hataliDeneme > 0 || kullanici.kilitBitis) {
            await prisma.kullanici.update({
                where: {
                    id: kullanici.id,
                },
                data: {
                    hataliDeneme: 0,
                    kilitBitis: null,
                },
            });
        }

        await oturumAc(kullanici.id);

        return NextResponse.json({
            kullaniciAdi: kullanici.kullaniciAdi,
            adSoyad: kullanici.adSoyad,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Giriş yapılırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
