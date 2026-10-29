import { beforeEach, describe, expect, it, vi } from "vitest";
import { akisUyarilari, IkAkis } from "../components/ikAkisTipleri";

// sonrakiSoruHatasi veritabanını okur; testte Prisma yerine elle kurulan sahte veri kullanılır
const sahte = vi.hoisted(() => ({
  sorular: [] as { id: number; akisId: number }[],
  secenekler: [] as { id: number; soruId: number; sonrakiSoruId: number | null }[],
}));

vi.mock("../lib/prisma", () => ({
  default: {
    ikSoru: {
      findUnique: async ({ where }: { where: { id: number } }) =>
        sahte.sorular.find((soru) => soru.id === where.id) ?? null,
    },
    ikSecenek: {
      // Test verisi tek akışlı; sorgudaki akış ve null süzgeci burada elle uygulanır
      findMany: async () => sahte.secenekler.filter((secenek) => secenek.sonrakiSoruId !== null),
    },
  },
}));

const { sonrakiSoruHatasi } = await import("../lib/ikAkis");

describe("sonrakiSoruHatasi (döngü denetimi)", () => {
  // Akış: 1 -> 2 -> 3 (seçenek 10: 1->2, seçenek 20: 2->3, seçenek 30: 3 bitirir). 9 başka akışta.
  beforeEach(() => {
    sahte.sorular = [
      { id: 1, akisId: 1 },
      { id: 2, akisId: 1 },
      { id: 3, akisId: 1 },
      { id: 9, akisId: 2 },
    ];
    sahte.secenekler = [
      { id: 10, soruId: 1, sonrakiSoruId: 2 },
      { id: 20, soruId: 2, sonrakiSoruId: 3 },
      { id: 30, soruId: 3, sonrakiSoruId: null },
    ];
  });

  it("akışı bitiren (boş) bağlantıya izin verir", async () => {
    expect(await sonrakiSoruHatasi(3, null)).toBeNull();
  });

  it("ileriye doğru bağlantıya izin verir", async () => {
    expect(await sonrakiSoruHatasi(1, 3)).toBeNull();
  });

  it("sorunun kendisine bağlanmasını döngü sayar", async () => {
    expect(await sonrakiSoruHatasi(2, 2)).toMatch(/döngü/);
  });

  it("dolaylı geri dönüşü döngü sayar (3 -> 1, oysa 1 -> 2 -> 3)", async () => {
    expect(await sonrakiSoruHatasi(3, 1)).toMatch(/döngü/);
  });

  it("güncellenen seçeneğin eski bağlantısını hesaba katmaz", async () => {
    // Seçenek 20 (2 -> 3) 2 -> 1'e çevriliyor: eski 2 -> 3 sayılsa da sayılmasa da 1 -> 2 olduğu için döngü
    expect(await sonrakiSoruHatasi(2, 1, 20)).toMatch(/döngü/);
    // Seçenek 10 (1 -> 2) 1 -> 3'e çevriliyor: döngü yok
    expect(await sonrakiSoruHatasi(1, 3, 10)).toBeNull();
  });

  it("başka akıştaki soruya bağlanmayı reddeder", async () => {
    expect(await sonrakiSoruHatasi(1, 9)).toMatch(/aynı akış/);
  });

  it("olmayan soruya bağlanmayı reddeder", async () => {
    expect(await sonrakiSoruHatasi(1, 99)).toMatch(/bulunamadı/);
  });
});

describe("akisUyarilari", () => {
  const akis = (degisiklik: Partial<IkAkis>): IkAkis => ({
    id: 1,
    ad: "Deneme",
    genel: false,
    ilkSoruId: 1,
    pozisyonlar: [],
    sorular: [
      { id: 1, akisId: 1, metin: "Birinci", secenekler: [{ id: 10, soruId: 1, metin: "Evet", sonrakiSoruId: 2 }] },
      { id: 2, akisId: 1, metin: "İkinci", secenekler: [{ id: 20, soruId: 2, metin: "Tamam", sonrakiSoruId: null }] },
    ],
    ...degisiklik,
  });

  it("sorunsuz akışta uyarı vermez", () => {
    expect(akisUyarilari(akis({}))).toEqual([]);
  });

  it("ilk soru seçilmemişse uyarır", () => {
    expect(akisUyarilari(akis({ ilkSoruId: null }))[0]).toMatch(/İlk soru/);
  });

  it("ulaşılamayan ve seçeneği olmayan soruları ayrı ayrı bildirir", () => {
    const uyarilar = akisUyarilari(
      akis({
        sorular: [
          { id: 1, akisId: 1, metin: "Birinci", secenekler: [{ id: 10, soruId: 1, metin: "Evet", sonrakiSoruId: null }] },
          { id: 3, akisId: 1, metin: "Yetim", secenekler: [] },
        ],
      })
    );

    expect(uyarilar).toHaveLength(2);
    expect(uyarilar[0]).toMatch(/"Yetim" sorusuna hiçbir seçenekten ulaşılamıyor/);
    expect(uyarilar[1]).toMatch(/"Yetim" sorusunun hiç seçeneği yok/);
  });
});
