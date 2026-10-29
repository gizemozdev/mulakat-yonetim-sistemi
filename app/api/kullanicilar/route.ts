import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { mevcutKullanici, sifreOzetiOlustur } from "../../../lib/oturum";
import { kullaniciVerisiniDogrula } from "../../../lib/kullaniciDogrula";

// Kullanıcıları listeler; şifre özeti dışarı verilmez, giriş yapan kişi "ben" ile işaretlenir
export async function GET() {
    try {
        const ben = await mevcutKullanici();

        const kullanicilar = await prisma.kullanici.findMany({
            select: {
                id: true,
                kullaniciAdi: true,
                adSoyad: true,
                olusturulma: true,
            },
            orderBy: {
                adSoyad: "asc",
            },
        });

        return NextResponse.json(
            kullanicilar.map((kullanici) => ({
                ...kullanici,
                ben: kullanici.id === ben?.id,
            }))
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Kullanıcılar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// Giriş yapmış bir kullanıcı yeni hesap açar (dışarıdan kayıt yok); yeni kişiye oturum açılmaz
export async function POST(request: Request) {
    try {
        const dogrulama = kullaniciVerisiniDogrula(await request.json());

        if (dogrulama.hata !== undefined) {
            return NextResponse.json({ error: dogrulama.hata }, { status: 400 });
        }

        const veri = dogrulama.veri;

        const ayniKullanici = await prisma.kullanici.findUnique({
            where: {
                kullaniciAdi: veri.kullaniciAdi,
            },
        });

        if (ayniKullanici) {
            return NextResponse.json(
                { error: "Bu kullanıcı adı zaten kullanılıyor." },
                { status: 409 }
            );
        }

        const kullanici = await prisma.kullanici.create({
            data: {
                adSoyad: veri.adSoyad,
                kullaniciAdi: veri.kullaniciAdi,
                sifreOzeti: await sifreOzetiOlustur(veri.sifre),
            },
            select: {
                id: true,
                kullaniciAdi: true,
                adSoyad: true,
                olusturulma: true,
            },
        });

        return NextResponse.json({ ...kullanici, ben: false }, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Kullanıcı eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
