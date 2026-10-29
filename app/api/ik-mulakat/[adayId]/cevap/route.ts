import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { ikMulakatiBul, ikOturumu, sonrakiSoruIdBul } from "../../../../../lib/ikMulakat";

type Baglam = {
    params: Promise<{ adayId: string }>;
};

// Sıradaki soruya verilen cevabı ve notu kaydeder, mülakatı bir sonraki soruya taşır
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).adayId);
        const body = await request.json();

        const secenekId =
            body.secenekId === null || body.secenekId === undefined
                ? null
                : Number(body.secenekId);
        const not = typeof body.not === "string" ? body.not.trim() : "";

        const mulakat = Number.isInteger(adayId) ? await ikMulakatiBul(adayId) : null;

        if (!mulakat || !mulakat.ikGuncelSoruId) {
            return NextResponse.json(
                { error: "Cevaplanacak bir soru yok." },
                { status: 400 }
            );
        }

        const soru = await prisma.ikSoru.findUnique({
            where: {
                id: mulakat.ikGuncelSoruId,
            },
            include: {
                akis: true,
                secenekler: true,
            },
        });

        if (!soru) {
            return NextResponse.json(
                { error: "Sıradaki soru akıştan silinmiş." },
                { status: 409 }
            );
        }

        const secenek = soru.secenekler.find((mevcut) => mevcut.id === secenekId) ?? null;

        // Seçeneği olan soruda seçim zorunlu; seçeneği olmayan soruda "Devam" ile geçilir
        if (soru.secenekler.length > 0 && !secenek) {
            return NextResponse.json(
                { error: "Lütfen adayın cevabına uyan seçeneği seçin." },
                { status: 400 }
            );
        }

        const seciliAkis = mulakat.ikAkisId
            ? await prisma.ikAkis.findUnique({ where: { id: mulakat.ikAkisId } })
            : null;

        const sonrakiSoruId = sonrakiSoruIdBul(
            secenek?.sonrakiSoruId ?? null,
            soru.akis.genel,
            seciliAkis?.ilkSoruId ?? null
        );

        await prisma.$transaction([
            prisma.ikCevap.create({
                data: {
                    mulakatId: mulakat.id,
                    sira: mulakat.ikCevaplar.length + 1,
                    soruId: soru.id,
                    akisAdi: soru.akis.ad,
                    soruMetni: soru.metin,
                    secenekMetni: secenek?.metin ?? null,
                    not,
                },
            }),
            prisma.mulakat.update({
                where: {
                    id: mulakat.id,
                },
                data: {
                    ikGuncelSoruId: sonrakiSoruId,
                },
            }),
        ]);

        return NextResponse.json(await ikOturumu(adayId));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Cevap kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
