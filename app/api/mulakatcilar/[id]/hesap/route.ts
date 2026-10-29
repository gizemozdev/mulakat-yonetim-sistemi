import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

type Baglam = {
    params: Promise<{ id: string }>;
};

// Mülakatçıyı bir kullanıcı hesabına bağlar ya da bağlantıyı kaldırır (kullaniciId: null)
export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const kullaniciId =
            body.kullaniciId === null || body.kullaniciId === "" ? null : Number(body.kullaniciId);

        const mulakatci = Number.isInteger(id)
            ? await prisma.mulakatci.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!mulakatci) {
            return NextResponse.json(
                { error: "Mülakatçı bulunamadı." },
                { status: 404 }
            );
        }

        if (kullaniciId !== null) {
            const kullanici = Number.isInteger(kullaniciId)
                ? await prisma.kullanici.findUnique({
                    where: {
                        id: kullaniciId,
                    },
                })
                : null;

            if (!kullanici) {
                return NextResponse.json(
                    { error: "Seçilen hesap bulunamadı." },
                    { status: 400 }
                );
            }
        }

        const guncelMulakatci = await prisma.mulakatci.update({
            where: {
                id,
            },
            data: {
                kullaniciId,
            },
        });

        return NextResponse.json(guncelMulakatci);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Hesap bağlantısı kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
