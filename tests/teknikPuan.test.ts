import { describe, expect, it } from "vitest";
import {
  izlenim,
  konularaGoreGrupla,
  teknikTamamlandi,
  yuzdeHesapla,
} from "../components/teknikPuan";

describe("yuzdeHesapla", () => {
  it("Yeterli 2, Orta 1, Yetersiz 0 puan sayar", () => {
    expect(
      yuzdeHesapla([
        { degerlendirme: "yeterli" },
        { degerlendirme: "orta" },
        { degerlendirme: "yetersiz" },
        { degerlendirme: "yeterli" },
      ])
    ).toBe(63); // (2 + 1 + 0 + 2) / 8 = %62,5 -> 63
  });

  it("hepsi yeterliyse %100, hepsi yetersizse %0", () => {
    expect(yuzdeHesapla([{ degerlendirme: "yeterli" }, { degerlendirme: "yeterli" }])).toBe(100);
    expect(yuzdeHesapla([{ degerlendirme: "yetersiz" }])).toBe(0);
  });

  it("değerlendirilmemiş soru 0 puan sayılır, boş liste 0 döner", () => {
    expect(yuzdeHesapla([{ degerlendirme: "yeterli" }, { degerlendirme: null }])).toBe(50);
    expect(yuzdeHesapla([])).toBe(0);
  });
});

describe("izlenim", () => {
  it("sınır değerlerde doğru kademeyi verir", () => {
    expect(izlenim(75)).toBe("Güçlü");
    expect(izlenim(74)).toBe("Orta düzey");
    expect(izlenim(50)).toBe("Orta düzey");
    expect(izlenim(49)).toBe("Gelişmeye açık");
  });
});

describe("teknikTamamlandi", () => {
  const hepsiDegerlendirilmis = [{ degerlendirme: "orta" as const }, { degerlendirme: "yeterli" as const }];

  it("durum Tamamlandı ve bütün sorular değerlendirilmişse true", () => {
    expect(teknikTamamlandi("Tamamlandı", hepsiDegerlendirilmis)).toBe(true);
  });

  it("durum farklıysa, soru yoksa ya da bir soru değerlendirilmemişse false", () => {
    expect(teknikTamamlandi("Planlandı", hepsiDegerlendirilmis)).toBe(false);
    expect(teknikTamamlandi("Tamamlandı", [])).toBe(false);
    expect(teknikTamamlandi("Tamamlandı", undefined)).toBe(false);
    expect(teknikTamamlandi("Tamamlandı", [{ degerlendirme: "orta" }, { degerlendirme: null }])).toBe(false);
  });
});

describe("konularaGoreGrupla", () => {
  it("cevapları konuya göre gruplar, konular ilk görüldükleri sırada kalır", () => {
    const gruplar = konularaGoreGrupla([
      { konuAdi: "SQL", id: 1 },
      { konuAdi: "React", id: 2 },
      { konuAdi: "SQL", id: 3 },
    ]);

    expect(gruplar.map(([konu]) => konu)).toEqual(["SQL", "React"]);
    expect(gruplar[0][1].map((cevap) => cevap.id)).toEqual([1, 3]);
  });
});
