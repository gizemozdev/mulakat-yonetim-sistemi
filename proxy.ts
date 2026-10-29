import { NextResponse, type NextRequest } from "next/server";
import { OTURUM_CEREZI, oturumKullanicisi } from "./lib/oturum";

// Giriş yapmadan erişilebilen adresler
const acikYollar = ["/giris", "/api/giris", "/api/kurulum"];

// Her istekten önce çalışır: geçerli oturum yoksa sayfalar giriş ekranına yönlenir, API'ler 401 döner
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const kullanici = await oturumKullanicisi(request.cookies.get(OTURUM_CEREZI)?.value);

    if (kullanici) {
        // Giriş yapmış biri giriş ekranını açarsa ana sayfaya gönderilir
        if (pathname === "/giris") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        return NextResponse.next();
    }

    if (acikYollar.includes(pathname)) {
        return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
        return NextResponse.json(
            { error: "Bu işlem için giriş yapmalısınız." },
            { status: 401 }
        );
    }

    return NextResponse.redirect(new URL("/giris", request.url));
}

// Next.js'in kendi dosyaları ve resimler hariç her adreste çalışır
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
