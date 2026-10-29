import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import {
    digerOturumlariKapat,
    mevcutKullanici,
    sifreDogrula,
    sifreOzetiOlustur,
} from "../../../lib/oturum";
import { sifreHatasi } from "../../../lib/kullaniciDogrula";

// Giriş yapmış kullanıcı kendi şifresini değiştirir; mevcut şifresini bilmesi gerekir
export async function PUT(request: Request) {
    try {
        const ben = await mevcutKullanici();

        if (!ben) {
            return NextResponse.json(
                { error: "Oturum bulunamadı." },
                { status: 401 }
            );
        }

        const body = await request.json();

        const mevcutSifre = typeof body.mevcutSifre === "string" ? body.mevcutSifre : "";
        const yeniSifre = typeof body.yeniSifre === "string" ? body.yeniSifre : "";

        const hata = sifreHatasi(yeniSifre);

        if (hata) {
            return NextResponse.json({ error: hata }, { status: 400 });
        }

        const kullanici = await prisma.kullanici.findUnique({
            where: {
                id: ben.id,
            },
        });

        if (!kullanici || !(await sifreDogrula(mevcutSifre, kullanici.sifreOzeti))) {
            return NextResponse.json(
                { error: "Mevcut şifre hatalı." },
                { status: 400 }
            );
        }

        await prisma.kullanici.update({
            where: {
                id: ben.id,
            },
            data: {
                sifreOzeti: await sifreOzetiOlustur(yeniSifre),
            },
        });

        // Şifreyi bilen başka biri başka bir cihazda girmişse onun oturumu da kapanır
        await digerOturumlariKapat(ben.id);

        return NextResponse.json({ tamam: true });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Şifre değiştirilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
