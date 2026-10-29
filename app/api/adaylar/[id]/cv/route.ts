import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { adayIcerigi } from "../../../../../lib/adayIcerigi";

type Baglam = {
    params: Promise<{ id: string }>;
};

const EN_FAZLA_BOYUT = 5 * 1024 * 1024;

// Her PDF dosyası "%PDF-" baytlarıyla başlar; yalnızca uzantıya ya da türe güvenilmez
const pdfMi = (baytlar: Uint8Array) =>
    new TextDecoder().decode(baytlar.subarray(0, 5)) === "%PDF-";

const adayBul = async (id: number) =>
    Number.isInteger(id) ? prisma.aday.findUnique({ where: { id } }) : null;

// CV'yi tarayıcıda açar (indirmeye zorlamaz)
export async function GET(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).id);

        const cv = Number.isInteger(adayId)
            ? await prisma.adayCv.findUnique({ where: { adayId } })
            : null;

        if (!cv) {
            return NextResponse.json(
                { error: "Bu adayın CV'si yok." },
                { status: 404 }
            );
        }

        return new NextResponse(Buffer.from(cv.icerik), {
            headers: {
                "Content-Type": "application/pdf",
                // Türkçe karakterli dosya adları için filename* (RFC 5987)
                "Content-Disposition": `inline; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(cv.dosyaAdi)}`,
                // Tarayıcı içeriği PDF'ten başka bir şey sanmasın
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "CV alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}

// CV yükler; adayın önceki CV'si varsa yerine geçer
export async function POST(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).id);

        if (!(await adayBul(adayId))) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        // Çok büyük gövde proxy'de kesilirse form çözülemez
        const form = await request.formData().catch(() => null);
        const dosya = form?.get("dosya");

        if (!(dosya instanceof File) || dosya.size === 0) {
            return NextResponse.json(
                { error: "Dosya okunamadı. Lütfen 5 MB'tan küçük bir PDF seçin." },
                { status: 400 }
            );
        }

        if (dosya.size > EN_FAZLA_BOYUT) {
            return NextResponse.json(
                { error: "CV en fazla 5 MB olabilir." },
                { status: 400 }
            );
        }

        const icerik = new Uint8Array(await dosya.arrayBuffer());

        if (!pdfMi(icerik)) {
            return NextResponse.json(
                { error: "Yalnızca PDF dosyası yüklenebilir." },
                { status: 400 }
            );
        }

        // Yoldan arındırılmış, kısaltılmış dosya adı (yalnızca gösterim ve indirme adı için)
        const dosyaAdi = (dosya.name.split(/[\\/]/).pop() || "cv.pdf").slice(0, 200);

        await prisma.adayCv.upsert({
            where: {
                adayId,
            },
            update: {
                dosyaAdi,
                boyut: dosya.size,
                icerik,
                yuklenme: new Date(),
            },
            create: {
                adayId,
                dosyaAdi,
                boyut: dosya.size,
                icerik,
            },
        });

        return NextResponse.json(
            await prisma.aday.findUnique({ where: { id: adayId }, include: adayIcerigi })
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "CV yüklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Baglam) {
    try {
        const adayId = Number((await params).id);

        if (!(await adayBul(adayId))) {
            return NextResponse.json(
                { error: "Aday bulunamadı." },
                { status: 404 }
            );
        }

        await prisma.adayCv.deleteMany({
            where: {
                adayId,
            },
        });

        return NextResponse.json(
            await prisma.aday.findUnique({ where: { id: adayId }, include: adayIcerigi })
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "CV silinirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
