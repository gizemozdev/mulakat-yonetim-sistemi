import { NextResponse } from "next/server";
import { oturumuKapat } from "../../../lib/oturum";

export async function POST() {
    try {
        await oturumuKapat();

        return NextResponse.json({ cikisYapildi: true });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Çıkış yapılırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
