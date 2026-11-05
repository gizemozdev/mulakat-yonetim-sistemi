import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import prisma from "./prisma";

export const OTURUM_CEREZI = "oturum";

const OTURUM_SURESI_GUN = 7;

const scryptAsync = promisify(scrypt) as (
    sifre: string,
    tuz: string,
    uzunluk: number
) => Promise<Buffer>;

// Şifreyi rastgele bir tuzla scrypt'ten geçirir; "tuz:özet" biçiminde saklanır
export const sifreOzetiOlustur = async (sifre: string) => {
    const tuz = randomBytes(16).toString("hex");
    const ozet = await scryptAsync(sifre, tuz, 64);

    return `${tuz}:${ozet.toString("hex")}`;
};

// Girilen şifreyi kayıtlı özetle karşılaştırır; süre farkından bilgi sızmasın diye timingSafeEqual
export const sifreDogrula = async (sifre: string, kayitliOzet: string) => {
    const [tuz, ozetHex] = kayitliOzet.split(":");

    if (!tuz || !ozetHex) return false;

    const beklenen = Buffer.from(ozetHex, "hex");
    const hesaplanan = await scryptAsync(sifre, tuz, beklenen.length);

    return beklenen.length === hesaplanan.length && timingSafeEqual(beklenen, hesaplanan);
};

// Veritabanında çerezdeki anahtarın kendisi değil, özeti tutulur
const anahtarOzeti = (anahtar: string) => createHash("sha256").update(anahtar).digest("hex");

// Mobil uygulama anahtarı çerez yerine "Authorization: Bearer <anahtar>" başlığıyla gönderir
export const bearerAnahtari = (yetkiBasligi: string | null) =>
    yetkiBasligi?.startsWith("Bearer ") ? yetkiBasligi.slice(7).trim() || undefined : undefined;

// Route Handler'da isteğin oturum anahtarı: önce Bearer başlığı (mobil), yoksa çerez (web)
const istekAnahtari = async () =>
    bearerAnahtari((await headers()).get("authorization")) ??
    (await cookies()).get(OTURUM_CEREZI)?.value;

// Yeni oturum açar ve anahtarı döndürür. Web'de anahtar tarayıcıya httpOnly çerez olarak bırakılır;
// mobilde çerez kullanılmaz, anahtar cevapla birlikte uygulamaya verilir ve orada şifreli saklanır.
export const oturumAc = async (kullaniciId: number, mobil = false) => {
    const anahtar = randomBytes(32).toString("hex");
    const bitis = new Date(Date.now() + OTURUM_SURESI_GUN * 24 * 60 * 60 * 1000);

    await prisma.oturum.create({
        data: {
            anahtarOzeti: anahtarOzeti(anahtar),
            kullaniciId,
            bitis,
        },
    });

    if (!mobil) {
        (await cookies()).set(OTURUM_CEREZI, anahtar, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: bitis,
        });
    }

    return anahtar;
};

// Çerezdeki anahtara ait geçerli oturumun kullanıcısını döndürür, yoksa null
export const oturumKullanicisi = async (anahtar: string | undefined) => {
    if (!anahtar) return null;

    const oturum = await prisma.oturum.findUnique({
        where: {
            anahtarOzeti: anahtarOzeti(anahtar),
        },
        include: {
            kullanici: {
                select: {
                    id: true,
                    kullaniciAdi: true,
                    adSoyad: true,
                },
            },
        },
    });

    if (!oturum) return null;

    if (oturum.bitis < new Date()) {
        await prisma.oturum.delete({ where: { id: oturum.id } }).catch(() => null);
        return null;
    }

    return oturum.kullanici;
};

// Route Handler'larda o anki kullanıcıyı Bearer başlığından ya da çerezden bulur
export const mevcutKullanici = async () => oturumKullanicisi(await istekAnahtari());

// Kullanıcının bu cihazdaki oturumu dışındaki bütün oturumlarını siler (şifre değişince)
export const digerOturumlariKapat = async (kullaniciId: number) => {
    const anahtar = await istekAnahtari();

    await prisma.oturum.deleteMany({
        where: {
            kullaniciId,
            ...(anahtar && { anahtarOzeti: { not: anahtarOzeti(anahtar) } }),
        },
    });
};

// Oturumu veritabanından siler ve (web'de) çerezi temizler
export const oturumuKapat = async () => {
    const cerezler = await cookies();
    const anahtar = await istekAnahtari();

    if (anahtar) {
        await prisma.oturum.deleteMany({
            where: {
                anahtarOzeti: anahtarOzeti(anahtar),
            },
        });
    }

    cerezler.delete(OTURUM_CEREZI);
};
