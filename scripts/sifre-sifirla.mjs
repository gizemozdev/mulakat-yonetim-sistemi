// Kimse giriş yapamadığında (ör. yönetici şifresini unuttu) bilgisayardan şifre sıfırlama.
// Kullanım: npm run sifre-sifirla
// Şifre terminalde gizli yazılır; veritabanına yalnızca scrypt özeti kaydedilir (lib/oturum.ts ile aynı biçim).

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";
import "dotenv/config";
import Database from "better-sqlite3";

const dosya = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const db = new Database(dosya);

const arayuz = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

// Şifre yazılırken ekranda harf yerine * görünsün
let gizli = false;
const yaz = arayuz._writeToOutput.bind(arayuz);
arayuz._writeToOutput = (metin) => yaz(gizli && !metin.includes("\n") ? "*" : metin);

const sor = (soru, gizliMi = false) =>
    new Promise((cevapla) => {
        gizli = false;
        process.stdout.write(soru);
        gizli = gizliMi;
        arayuz.question("", (cevap) => {
            gizli = false;
            if (gizliMi) process.stdout.write("\n");
            cevapla(cevap);
        });
    });

const kullanicilar = db.prepare("SELECT kullaniciAdi, adSoyad FROM Kullanici ORDER BY id").all();

if (kullanicilar.length === 0) {
    console.log("Sistemde hiç kullanıcı yok; uygulamayı açınca ilk hesap oluşturma ekranı gelir.");
    process.exit(0);
}

console.log("Kayıtlı kullanıcılar:");
kullanicilar.forEach((k) => console.log(`  - ${k.kullaniciAdi} (${k.adSoyad})`));

const kullaniciAdi = (await sor("Şifresi sıfırlanacak kullanıcı adı: ")).trim();

if (!kullanicilar.some((k) => k.kullaniciAdi === kullaniciAdi)) {
    console.log("Bu kullanıcı adı bulunamadı.");
    process.exit(1);
}

const sifre = await sor("Yeni şifre (en az 6 karakter): ", true);
const tekrar = await sor("Yeni şifre (tekrar): ", true);

if (sifre.length < 6) {
    console.log("Şifre en az 6 karakter olmalıdır. Hiçbir şey değiştirilmedi.");
    process.exit(1);
}

if (sifre !== tekrar) {
    console.log("Şifreler birbiriyle aynı değil. Hiçbir şey değiştirilmedi.");
    process.exit(1);
}

const tuz = randomBytes(16).toString("hex");
const ozet = scryptSync(sifre, tuz, 64).toString("hex");

// Kilit ve yanlış deneme sayacı da sıfırlanır; eski oturumlar kapatılır
db.prepare("UPDATE Kullanici SET sifreOzeti = ?, hataliDeneme = 0, kilitBitis = NULL WHERE kullaniciAdi = ?").run(
    `${tuz}:${ozet}`,
    kullaniciAdi
);
db.prepare("DELETE FROM Oturum WHERE kullaniciId = (SELECT id FROM Kullanici WHERE kullaniciAdi = ?)").run(kullaniciAdi);

console.log(`"${kullaniciAdi}" kullanıcısının şifresi değiştirildi. Yeni şifreyle giriş yapabilirsiniz.`);
arayuz.close();
