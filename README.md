# Mülakat Yönetim Sistemi

Yüz yüze mülakat ve aday değerlendirme platformu. Pozisyonlar ve adaylar tanımlanır, her aday için bir **İK mülakatı** ve bir **teknik mülakat** planlanır, yapılır ve sonuçları tek ekranda özetlenir.

Pidata'da staj projesi olarak geliştirilmiştir.

## Özellikler

- **Pozisyonlar, adaylar, mülakatçılar:** ekleme, düzenleme, silme. Mülakatçıların İK ya da Teknik alanı vardır; her mülakatta yalnızca ilgili alandaki kişiler seçilebilir.
- **Teknik mülakat**
  - Konu başlıkları altında bir **soru havuzu**.
  - Mülakat başlatılırken her konudan kaç soru sorulacağı seçilir; sorular havuzdan rastgele seçilip karıştırılır ve mülakat boyunca sabit kalır.
  - Her soru **Yeterli / Orta / Yetersiz** olarak değerlendirilir.
  - Sonunda genel yüzde ve konu bazında dağılım görünür. Bu puan **işe alım kararı değil, fikir** vermek içindir.
  - Yanlış başlatılan bir mülakat sıfırlanabilir.
- **İK mülakatı**
  - Her mülakatta sorulan **Genel Sorular** akışı ve pozisyona özel, adı verilmiş akışlar (ör. "Takım Lideri").
  - Sorular cevaba göre dallanır: her seçenek bir sonraki soruya bağlanır. Döngü kuran bağlantılar engellenir.
  - Düzenleme ekranında akış, girintili bir ağaç olarak önizlenir; ulaşılamayan ya da seçeneği olmayan sorular için uyarı verilir.
  - Mülakatta her soruya not, sonunda genel değerlendirme yazılır; son cevap geri alınabilir, yanlış başlatılan mülakat sıfırlanabilir.
- **Giriş:** kullanıcı adı ve şifreyle giriş. Şifreler tuzlanmış scrypt özeti olarak saklanır; oturum 7 gün geçerli, httpOnly bir çerezle tutulur. Giriş yapılmadan hiçbir sayfa ve API kullanılamaz. Dışarıdan kayıt yoktur: yeni hesapları giriş yapmış biri **Kullanıcılar** sayfasından açar, herkes kendi şifresini aynı sayfadan değiştirebilir. Şifresini unutan birine aynı sayfadan yeni geçici şifre verilir (hesap kilidi açılır, açık oturumları kapanır); kimse giriş yapamıyorsa bilgisayarda `npm run sifre-sifirla` kullanılır. Mobil uygulama için oturum anahtarı `Authorization: Bearer` başlığıyla da kabul edilir.
- **Sonuç özeti ve rapor:** Mülakatlar sayfasında aday kartlarında teknik yüzde, aday seçilince iki mülakatın özeti. Her aday için iletişim bilgileri, İK cevapları ve teknik dağılımı içeren A4 rapor; tarayıcının yazdırma penceresinden PDF olarak kaydedilebilir.
- **Takvim:** Ana sayfada mülakat günleri noktalarla işaretli aylık takvim; güne tıklayınca o günün mülakatları saat sırasıyla listelenir. Mülakatlara isteğe bağlı saat girilebilir.
- **Size atanan mülakatlar:** Mülakatçılar sayfasında bir mülakatçı uygulama hesabına bağlanınca, o hesap ana sayfada kendisine atanan yaklaşan mülakatları görür.
- **Aday kararı:** Mülakatlardan sonra adaya Değerlendiriliyor / Beklemede / Teklif verildi / İşe alındı / Reddedildi kararı ve gerekçesi verilir; karar kartlarda, süzgeçte ve raporda görünür.
- **Arama ve süzme:** Adaylar ve Mülakatlar sayfalarında ada (adaylarda e-posta / telefona da) göre arama, pozisyona, mülakat durumuna ve karara göre süzme.
- **İstatistikler:** Karar dağılımı, mülakat durumları, pozisyonlara göre özet ve teknik konulara göre başarı (adayların en çok zorlandığı konular).
- **Aday karşılaştırma:** Aynı pozisyondaki adayların kararı, mülakat durumları, genel ve konu konu teknik puanları yan yana.
- **CV:** Adaya PDF CV yüklenir (en fazla 5 MB, veritabanında saklanır); mülakat sırasında tek tıkla açılır.
- **Dışa aktarma:** Aday listesi ve mülakat özetleri, Türkçe Excel'in doğrudan açabildiği bir CSV dosyası olarak indirilir.
- Geçmiş mülakat sonuçları, havuzdaki ya da akıştaki sorular sonradan değişse de bozulmaz (soru metinleri cevaplarla birlikte saklanır).

## Teknolojiler

| Katman | Teknoloji |
| --- | --- |
| Çatı | Next.js 16 (App Router), React 19 |
| Dil | TypeScript |
| Stil | Tailwind CSS 4, lucide-react ikonları |
| Veritabanı | SQLite, Prisma 7 (better-sqlite3 adaptörü) |
| Test | Vitest |

## Kurulum

1. Bağımlılıkları kurun. Kurulum bittiğinde Prisma istemcisi (`generated/prisma`) otomatik üretilir.

   ```bash
   npm install
   ```

2. Proje klasöründe bir `.env` dosyası oluşturun:

   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Veritabanı tablolarını oluşturun. Bu adım "Genel Sorular" İK akışını da ekler.

   ```bash
   npx prisma migrate deploy
   ```

4. Geliştirme sunucusunu başlatın ve tarayıcıda `http://localhost:3000` adresini açın.

   ```bash
   npm run dev
   ```

5. İlk açılışta giriş ekranı, sistemde hiç kullanıcı olmadığı için **yönetici hesabı oluşturma** formunu gösterir. Ad soyad, kullanıcı adı ve şifre girerek ilk hesabı oluşturun. Bundan sonra uygulamaya yalnızca giriş yapılarak erişilebilir.

## Kullanım sırası

Sistemi ilk kez kullanırken şu sıra önerilir:

1. **Pozisyonlar:** açık pozisyonları ekleyin.
2. **Mülakatçılar:** İK ve teknik mülakatçıları alanlarıyla ekleyin.
3. **Soru Havuzu:** teknik konuları ve sorularını yazın.
4. **İK Akışları:** genel soruları ve pozisyon akışlarını oluşturun, akışları pozisyonlara bağlayın.
5. **Adaylar:** adayları pozisyonlarıyla ekleyin.
6. **Mülakatlar:** adayı seçin, mülakatçı ve tarih belirleyin, "İK Mülakatını Başlat" ve "Teknik Mülakatı Başlat" düğmeleriyle mülakatları yapın. Sonuçlar aynı sayfada özetlenir.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run lint` | ESLint |
| `npm test` | Vitest testleri (`tests/`) |
| `npm run sifre-sifirla` | Bir kullanıcının şifresini bilgisayardan sıfırlar (kimse giriş yapamıyorsa) |
| `npx prisma migrate dev` | Şema değişikliğinden sonra migration oluşturur ve uygular |
| `npx prisma generate` | Prisma istemcisini yeniden üretir |

## Klasör yapısı

```
app/                 sayfalar ve API'ler (app/api/...)
components/          ortak bileşenler ve ekran yardımcıları
lib/                 sunucu tarafı: Prisma istemcisi, doğrulama, İK akış kuralları
prisma/              veri modeli (schema.prisma) ve migration geçmişi
tests/               Vitest testleri (puan hesabı, CSV, doğrulama, İK akış kuralları, şifre özeti)
```
