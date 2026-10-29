import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

const alanlar = ["ik", "teknik"];

export async function GET() {
    try {
        const mulakatcilar = await prisma.mulakatci.findMany({
            orderBy: {
                adSoyad: "asc",
            },
        });

        return NextResponse.json(mulakatcilar);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakatçılar alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const adSoyad =
            typeof body.adSoyad === "string" ? body.adSoyad.trim() : "";
        const alan = body.alan;

        if (!adSoyad) {
            return NextResponse.json(
                { error: "Ad Soyad alanı boş bırakılamaz." },
                { status: 400 }
            );
        }

        if (!alanlar.includes(alan)) {
            return NextResponse.json(
                { error: "Lütfen bir alan seçin." },
                { status: 400 }
            );
        }

        const mevcutMulakatci = await prisma.mulakatci.findUnique({
            where: {
                adSoyad_alan: {
                    adSoyad,
                    alan,
                },
            },
        });

        if (mevcutMulakatci) {
            return NextResponse.json(
                { error: "Bu mülakatçı bu alanda zaten tanımlı." },
                { status: 409 }
            );
        }

        const mulakatci = await prisma.mulakatci.create({
            data: {
                adSoyad,
                alan,
            },
        });

        return NextResponse.json(mulakatci, { status: 201 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Mülakatçı eklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
