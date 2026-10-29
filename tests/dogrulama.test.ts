import { describe, expect, it } from "vitest";
import { kullaniciVerisiniDogrula, sifreHatasi } from "../lib/kullaniciDogrula";

describe("sifreHatasi", () => {
  it("6 karakterden kısa şifreyi reddeder", () => {
    expect(sifreHatasi("12345")).not.toBe("");
    expect(sifreHatasi("123456")).toBe("");
  });
});

describe("kullaniciVerisiniDogrula", () => {
  const gecerli = { adSoyad: " Elif Yıldız ", kullaniciAdi: " elif ", sifre: "gizli123" };

  it("geçerli veriyi kırpılmış haliyle döndürür", () => {
    expect(kullaniciVerisiniDogrula(gecerli)).toEqual({
      veri: { adSoyad: "Elif Yıldız", kullaniciAdi: "elif", sifre: "gizli123" },
    });
  });

  it("boş ad ya da kullanıcı adını reddeder", () => {
    expect(kullaniciVerisiniDogrula({ ...gecerli, adSoyad: "   " }).hata).toBeTruthy();
    expect(kullaniciVerisiniDogrula({ ...gecerli, kullaniciAdi: "" }).hata).toBeTruthy();
  });

  it("3 karakterden kısa ya da boşluk içeren kullanıcı adını reddeder", () => {
    expect(kullaniciVerisiniDogrula({ ...gecerli, kullaniciAdi: "ab" }).hata).toBeTruthy();
    expect(kullaniciVerisiniDogrula({ ...gecerli, kullaniciAdi: "elif yildiz" }).hata).toBeTruthy();
  });

  it("metin olmayan alanları boş sayar", () => {
    expect(kullaniciVerisiniDogrula({ adSoyad: 5, kullaniciAdi: ["x"], sifre: null }).hata).toBeTruthy();
  });
});
