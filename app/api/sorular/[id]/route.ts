import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type Baglam = {
    params: Promise<{ id: string }>;
};

const soruBul = (id: number) =>
    Number.isInteger(id)
        ? prisma.teknikSoru.findUnique({
            where: {
                id,
            },
        })
        : null;

export async function PUT(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);
        const body = await request.json();

        const metin = typeof body.metin === "string" ? body.metin.trim() : "";

        if (!metin) {
            return NextResponse.json(
                { error: "Soru metni boş bırakılamaz." },
                { status: 400 }
            );
        }

        if (!(await soruBul(id))) {
            return NextResponse.json(
                { error: "Soru bulunamadı." },
                { status: 404 }
            );
        }

        const soru = await prisma.teknikSoru.update({
            where: {
                id,
            },
            data: {
                metin,
            },
        });

        return NextResponse.json(soru);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Soru güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const id = Number((await params).id);

        if (!(await soruBul(id))) {
            return NextResponse.json(
                { error: "Soru bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.teknikSoru.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Soru silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
