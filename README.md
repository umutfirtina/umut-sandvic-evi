# 🥪 Umut Sandviç Evi

Bursa'da, Ulucami Caddesi'nde küçük bir sandviç dükkânı işlettiğin, pixel art tarzında tatlı bir işletme oyunu.

Müşteriler ne istediklerini **söylemez**. Ruh hâllerini ve durumlarını anlatırlar (üşümüş, ilk buluşmaya gidiyor, maç günü, ay sonu, diyette…), sen de doğru sandviçi bulursun.

## Oynanış

- **Subway tarzı hazırlık:** ekmek → et/protein → peynir → sebze → sos → ekstra, istersen tost makinesi. 8 ekmek ve 40'tan fazla malzeme var.
- **21 ruh hâli/durum:** her biri farklı bir şey ister. Bir durumu tam tutturunca ipucu **Ruh hâli rehberi**ne yazılır.
- **17 karakter + gizemli eleştirmen:** her birinin gizli sevdikleri ve sevmedikleri var. Tepkilerinden öğrenilir ve **📒 Defter**e yazılır.
- **Menü siparişleri:** Kulüp Sandviç, İtalyano, Köfte Marinara, Falafel Dürüm, Ballı Kaymaklı Simit… Tarifler tezgâhtaki 📖 sekmesinde.
- **İmza tarifler:** 3 yıldızlı yaratımlarına gün sonunda isim ver. Menüye girerler ve müşteriler onları sormaya başlar.
- **Hava durumu:** güneşli, bulutlu, yağmurlu, karlı, sıcak. Hava, gelen müşterileri ve ruh hâllerini etkiler.
- **Dükkân:** kazandığınla yeni malzemeler, ekipman (turbo tost makinesi, çay ocağı, geniş tezgâh, dördüncü masa, ışıklı pano) ve dekor (begonvil, Pamuk'un yatağı, Bursaspor atkısı, kitap rafı, Karagöz perdesi, plak çalar, ipek perde, neon tabela) alırsın. Dekorlar farklı müşterileri çeker.
- **Zaman:** gün 08:00–20:00 arası sürer. ⏸ / 1x / 2x / 4x ile hızlandırabilirsin; müşteri gelince oyun kendiliğinden 1x'e döner.
- **Kedi Pamuk** dükkânda dolaşır. Ona dokunmayı unutma 🐈

## Kayıt

- Claude artifact'i olarak açıldığında ilerleme **Claude hesabına** kaydedilir (cihazlar arası).
- Başka bir yerde (GitHub Pages, yerel dosya) tarayıcının `localStorage`'ını kullanır.
- ⚙ menüsünden **yedek kodu** alıp başka bir cihaza yapıştırabilirsin.

## Çalıştırma

Hiçbir kurulum gerekmez: `index.html` dosyasını tarayıcıda aç ya da GitHub Pages ile yayınla.

```
index.html
css/style.css
js/data.js   – malzemeler, tarifler, ruh hâlleri, karakterler, dükkân
js/art.js    – tüm pixel çizimler (kodla çizilir, görsel dosyası yok)
js/save.js   – bulut/yerel kayıt
js/game.js   – oyun döngüsü ve arayüz
```

Klavye: `Boşluk` tezgâhı açar/kapatır · `Enter` servis eder · `0/1/2/3` hız ayarı
