import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { mevcutKullanici, sifreOzetiOlustur } from "../../../../../lib/oturum";
import { sifreHatasi } from "../../../../../lib/kullaniciDogrula";

type Baglam = {
    params: Promise<{ id: string }>;
};

// Şifresini unutan bir kullanıcıya, giriş yapmış başka biri yeni geçici şifre verir.
// Hesap kilidi açılır ve kişinin açık oturumları kapanır (eski şifreyle açılmış oturum kalmasın).
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();
        const yeniSifre = typeof body.yeniSifre === "string" ? body.yeniSifre : "";

        const ben = await mevcutKullanici();

        // Kendi şifresi için mevcut şifreyi soran /api/sifre kullanılır; bu yol onu atlatmasın
        if (ben?.id === id) {
            return NextResponse.json(
                { error: "Kendi şifrenizi Şifremi Değiştir bölümünden değiştirin." },
                { status: 409 }
            );
        }

        const hata = sifreHatasi(yeniSifre);

        if (hata) {
            return NextResponse.json({ error: hata }, { status: 400 });
        }

        const kullanici = Number.isInteger(id)
            ? await prisma.kullanici.findUnique({ where: { id } })
            : null;

        if (!kullanici) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.$transaction([
            prisma.kullanici.update({
                where: {
                    id,
                },
                data: {
                    sifreOzeti: await sifreOzetiOlustur(yeniSifre),
                    hataliDeneme: 0,
                    kilitBitis: null,
                },
            }),
            prisma.oturum.deleteMany({
                where: {
                    kullaniciId: id,
                },
            }),
        ]);

        return NextResponse.json({ tamam: true });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Şifre sıfırlanırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
