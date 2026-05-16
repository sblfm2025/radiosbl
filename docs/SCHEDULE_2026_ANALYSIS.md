# Analisis Lampiran Jadwal Program Siaran 2026

Sumber: tiga halaman gambar `JADWAL PROGRAM SIARAN 2026_Page_1.png`,
`Page_2.png`, dan `Page_3.png`.

## Identitas Radio

- Nama: Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang.
- Branding siaran: Radio Suara Bumi Lasinrang (SBL) 92,4 FM.
- Alamat: Jl. Bintang No. 1 Kabupaten Pinrang.
- Kontak: +62 851-2256-1992.
- Sosial media: Radio Suara Bumi Lasinrang.
- Link stream langsung: `https://pu.klikhost.com/proxy/sbl/stream`.
- Halaman stream publik: `sbl.pinrangkab.go.id/radio-stream`.
- Website: `sbl.pinrangkab.go.id`.

## Pola Siaran Utama

Setiap hari memiliki 4 slot utama:

- 08.00 - 10.00
- 14.00 - 16.00
- 16.00 - 18.00
- 20.00 - 22.00

Total slot utama: 28 slot per minggu.

## Program Utama

- Salam Bumi Lasinrang.
- Informasi Seputar Pinrang.
- Siporio Siporennu.
- Aga Kareba.
- Halo Bumi Lasinrang (Podcast / Siaran Reguler).
- Salam Bumi Lasinrang (SBL Goes to School).
- Jumat Ceria (Program Edukasi).
- Salam Bumi Lasinrang (Weekend Edition).
- Pinrang Creative Network.
- Aga Kareba / SBL on Stage.
- Pinrang KEREN!
- Aga Kareba (Weekend Edition).

## Program Sisipan / Tanpa Penyiar

Program ini berjalan setiap hari dan dapat dikelola sebagai playlist/RadioBoss:

- 05.00 - 07.00: Salam Subuh.
- 07.00 - 08.00: Semangat Pagi.
- 10.00 - 11.30: Lasinrang Preneur.
- 11.30 - 13.00: Keluarga Berdaya (PKK).
- 13.00 - 14.00: Iklan Layanan Masyarakat, Konten Edukasi, Tips.
- 18.00 - 20.00: Program Religi.
- 22.00 - 23.00: Lagu-lagu Terbaik.

## Breakdown Penyiar

- Wiwik: Senin, Selasa, Rabu, Sabtu, Minggu. Total 5 hari / 10 jam.
- Sul: Senin, Selasa, Kamis, Sabtu, Minggu. Total 5 hari / 10 jam.
- Amar: Senin, Rabu, Kamis, Jumat, Minggu. Total 5 hari / 10 jam.
- Riska: Rabu, Kamis, Jumat, Sabtu, Minggu. Total 5 hari / 10 jam.
- Ria: Selasa, Rabu, Kamis, Jumat, Minggu. Total 5 hari / 10 jam.
- Miah: Senin, Selasa, Rabu, Jumat, Sabtu. Total 5 hari / 10 jam.
- Hendra: setup RadioBoss untuk program sisipan/tanpa penyiar setiap hari.

## Penyesuaian Aplikasi

Data lampiran sudah dimasukkan ke:

- `src/data/radioData.ts` untuk jadwal, sisipan, breakdown penyiar, dan kontak.
- Halaman Dashboard untuk program aktif dan identitas kontak.
- Halaman Jadwal untuk jadwal mingguan lengkap, program sisipan, dan breakdown penyiar.
- Halaman Streaming untuk frekuensi, stream URL, alamat, website, dan sosial media.
- `src/tests/scheduleData.test.ts` untuk menjaga jumlah slot dan data identitas tetap benar.
