import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { oturumAc, sifreOzetiOlustur } from "../../../lib/oturum";
import { kullaniciVerisiniDogrula } from "../../../lib/kullaniciDogrula";

// İlk kullanıcıyı oluşturur. Yalnızca sistemde hiç kullanıcı yokken çalışır.
export async function POST(request: Request) {
    try {
        if ((await prisma.kullanici.count()) > 0) {
            return NextResponse.json(
                { error: "İlk kullanıcı zaten oluşturulmuş. Lütfen giriş yapın." },
                { status: 403 }
            );
        }

        const dogrulama = kullaniciVerisiniDogrula(await request.json());

        if (dogrulama.hata !== undefined) {
            return NextResponse.json({ error: dogrulama.hata }, { status: 400 });
        }

        const veri = dogrulama.veri;

        const kullanici = await prisma.kullanici.create({
            data: {
                adSoyad: veri.adSoyad,
                kullaniciAdi: veri.kullaniciAdi,
                sifreOzeti: await sifreOzetiOlustur(veri.sifre),
            },
        });

        await oturumAc(kullanici.id);

        return NextResponse.json(
            { kullaniciAdi: kullanici.kullaniciAdi, adSoyad: kullanici.adSoyad },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Kullanıcı oluşturulurken bir hata oluştu." },
            { status: 500 }
        );
    }
}
