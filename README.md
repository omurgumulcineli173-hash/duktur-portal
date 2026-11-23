# DUKTUR RP Portal
1. GitHub'a yükle. Lemehost'ta Node.js (18+) servisi aç, repo'yu çek, başlatma komutu: `npm start`.
2. Ortam değişkenleri: `GAME_KEY` (oyun anahtarı), `SECRET` (rastgele uzun metin), `PORT`.
3. `pawn/duktur_portal.pwn` içindeki PORTAL ve GKEY değerlerini düzenle, derle, SA-MP `filterscripts/` içine at, `server.cfg` -> `filterscripts duktur_portal`.
4. Oyuncu portala oyun içi isimle kayıt olur; oyundayken para yatırma/çekme çalışır.
Not: `data.json` JSON dosya veritabanıdır (başlangıç için); trafik artınca SQLite/MySQL'e geçilir.
