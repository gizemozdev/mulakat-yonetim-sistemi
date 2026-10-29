import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { mevcutKullanici } from "../../../../lib/oturum";

type Baglam = {
    params: Promise<{ id: string }>;
};

// Kullanıcı silinince açık oturumları da silinir (onDelete: Cascade), yani hemen dışarı düşer
export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        const kullanici = Number.isInteger(id)
            ? await prisma.kullanici.findUnique({
                where: {
                    id,
                },
            })
            : null;

        if (!kullanici) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı." },
                { status: 404 }
            );
        }

        // Kendi hesabını silmek yasak; bu sayede sistemde en az bir kullanıcı (silen kişi) hep kalır
        const ben = await mevcutKullanici();

        if (ben?.id === id) {
            return NextResponse.json(
                { error: "Kendi hesabınızı silemezsiniz." },
                { status: 409 }
            );
        }

        await prisma.kullanici.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Kullanıcı silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
