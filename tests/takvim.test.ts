import { describe, expect, it } from "vitest";
import { gunMetni } from "../components/MulakatTakvimi";

describe("gunMetni", () => {
  it("tarihi veritabanındaki \"YYYY-AA-GG\" biçimine çevirir, tek haneleri sıfırla doldurur", () => {
    expect(gunMetni(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("gece yarısını yerel güne göre verir (toISOString gibi bir önceki güne kaymaz)", () => {
    expect(gunMetni(new Date(2026, 9, 27, 0, 30))).toBe("2026-10-27");
  });
});
