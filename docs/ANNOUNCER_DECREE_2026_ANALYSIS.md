# Analisis SK Pengangkatan Penyiar 2026

Sumber: dua lampiran foto SK Pengangkatan Penyiar LPPL Radio Suara Bumi Lasinrang.

## Identitas Dokumen

- Instansi: Lembaga Penyiaran Publik Lokal Kabupaten Pinrang, Radio Suara Bumi Lasinrang.
- Alamat kop: Jalan Bintang No. 1, Pinrang 91212.
- Nomor keputusan: `482/001/SBL/I/2026`.
- Tentang: Pengangkatan Penyiar Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang.
- Ditetapkan di: Pinrang.
- Tanggal: 02 Januari 2026.
- Direktur Utama: Fajar Bakri.

## Isi Keputusan

Diktum KESATU menetapkan pengangkatan penyiar LPPL Radio Suara Bumi Lasinrang:

1. Akhmad Amiruddin.
2. Sulaiman.
3. Wiwik.
4. Riska Dwiyanti.
5. St. Rukiah.
6. Muhammad Chendra Burhan.
7. Fadli Arifin.

Catatan pembaruan dari pengguna: penyiar Fadli Arifin sekarang sudah diganti
dengan Salmiah. Karena jadwal siaran sebelumnya memakai nama `Miah`, maka
Salmiah disatukan sebagai nama lengkap untuk nama udara Miah.

## Pemetaan Nama Lengkap dan Nama Udara

| Nama Lengkap | Nama Udara | Dasar Pencocokan |
| --- | --- | --- |
| Akhmad Amiruddin | Amar | Nama udara di jadwal: Amar |
| Sulaiman | Sul | Nama udara di jadwal: Sul |
| Wiwik | Wiwik | Nama di SK dan jadwal sama |
| Riska Dwiyanti | Riska | Nama depan sama dengan jadwal |
| St. Rukiah | Ria | Nama mirip/pendek dari Rukiah, cocok dengan jadwal Ria |
| Muhammad Chendra Burhan | Hendra | Nama tengah Chendra cocok dengan Hendra di jadwal RadioBoss |
| Salmiah | Miah | Menggantikan Fadli Arifin; nama udara Miah di jadwal |

## Tugas Penyiar Dalam SK

- Memandu atau membawakan acara siaran.
- Mengumpulkan informasi di lapangan melalui wawancara atau peliputan langsung.
- Menyampaikan informasi kepada pendengar.

## Penyesuaian Aplikasi

- `src/data/radioData.ts` kini memiliki `directorProfile` dan `announcerProfiles`.
- Halaman Jadwal menampilkan profil penyiar resmi dengan Nama Lengkap dan Nama Udara.
- Dashboard dan Streaming menampilkan Direktur Utama Fajar Bakri.
- Test data memastikan Salmiah digunakan sebagai Miah dan Fadli Arifin tidak aktif dalam data aplikasi.
- `src/utils/announcerResolver.ts` menormalisasi teks penyiar/PIC dari jadwal.
  Contoh: `Amar & Riska / Tokoh / Komunitas` dibaca sebagai dua penyiar
  resmi dan dua PIC eksternal.
