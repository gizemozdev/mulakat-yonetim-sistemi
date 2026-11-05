import { describe, expect, it, vi } from "vitest";

// oturum.ts veritabanını ve Next'in çerez modülünü içe aktarır; şifre fonksiyonları ikisini de kullanmaz
vi.mock("../lib/prisma", () => ({ default: {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({}), headers: async () => new Headers() }));

const { bearerAnahtari, sifreDogrula, sifreOzetiOlustur } = await import("../lib/oturum");

describe("şifre özeti", () => {
  it("\"tuz:özet\" biçiminde saklanır, şifrenin kendisi içinde geçmez", async () => {
    const ozet = await sifreOzetiOlustur("gizli123");

    expect(ozet).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(ozet).not.toContain("gizli123");
  });

  it("aynı şifre her seferinde farklı tuzla farklı özet verir", async () => {
    expect(await sifreOzetiOlustur("gizli123")).not.toBe(await sifreOzetiOlustur("gizli123"));
  });

  it("doğru şifreyi kabul eder, yanlışını reddeder", async () => {
    const ozet = await sifreOzetiOlustur("gizli123");

    expect(await sifreDogrula("gizli123", ozet)).toBe(true);
    expect(await sifreDogrula("gizli124", ozet)).toBe(false);
  });

  it("bozuk kayıtlı özette hata fırlatmadan false döner", async () => {
    expect(await sifreDogrula("gizli123", "bozuk")).toBe(false);
  });
});

describe("bearerAnahtari", () => {
  it("\"Bearer <anahtar>\" başlığından anahtarı alır", () => {
    expect(bearerAnahtari("Bearer abc123")).toBe("abc123");
  });

  it("başlık yoksa, başka bir şemaysa ya da anahtar boşsa undefined döner", () => {
    expect(bearerAnahtari(null)).toBeUndefined();
    expect(bearerAnahtari("Basic abc123")).toBeUndefined();
    expect(bearerAnahtari("Bearer   ")).toBeUndefined();
  });
});
