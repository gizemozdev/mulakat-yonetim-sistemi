// JSON (ya da dosya yüklemede FormData) isteği atar; başarılıysa veriyi, değilse sunucunun hata mesajını döndürür
export const istekAt = async (adres: string, method: string, govde?: object | FormData) => {
  try {
    // FormData'da Content-Type'ı tarayıcı kendisi koyar (dosya sınırlarıyla birlikte)
    const formMu = govde instanceof FormData;

    const yanit = await fetch(adres, {
      method,
      headers: formMu ? undefined : { "Content-Type": "application/json" },
      body: govde === undefined ? undefined : formMu ? govde : JSON.stringify(govde),
    });

    const veri = await yanit.json();

    return yanit.ok ? { veri, hata: "" } : { veri: null, hata: veri.error as string };
  } catch {
    return { veri: null, hata: "Sunucuya ulaşılamadı." };
  }
};
