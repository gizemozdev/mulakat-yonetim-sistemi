import { describe, expect, it } from "vitest";
import { csvOlustur } from "../lib/csv";

// BOM'u ayırıp satırlara böler
const satirlar = (csv: string) => csv.slice(1).split("\r\n");

describe("csvOlustur", () => {
  it("UTF-8 BOM ile başlar ve ; ayıracı kullanır", () => {
    const csv = csvOlustur(["Ad", "Yaş"], [["Elif", 24]]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(satirlar(csv)).toEqual(["Ad;Yaş", "Elif;24"]);
  });

  it("boş değerleri boş hücre yapar", () => {
    expect(satirlar(csvOlustur(["A", "B"], [[null, ""]]))[1]).toBe(";");
  });

  it("ayıraç, tırnak ya da satır sonu içeren değeri tırnaklar, içteki tırnağı ikiler", () => {
    const [, satir] = satirlar(csvOlustur(["Not"], [['güçlü; "iyi" aday']]));

    expect(satir).toBe('"güçlü; ""iyi"" aday"');
  });

  it("formül gibi başlayan değerin başına ' ekler (CSV enjeksiyonu)", () => {
    const [, satir] = satirlar(csvOlustur(["A", "B", "C"], [["=1+1", "@SUM(A1)", "-cmd"]]));

    expect(satir).toBe("'=1+1;'@SUM(A1);'-cmd");
  });

  it("telefon ve negatif sayı gibi rakamla devam eden değerlere dokunmaz", () => {
    const [, satir] = satirlar(csvOlustur(["Tel", "Sayı"], [["+90 532 111 22 33", "-5"]]));

    expect(satir).toBe("+90 532 111 22 33;-5");
  });
});
