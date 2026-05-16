# PERJANJIAN JUMAT MALAM
*(Disepakati pada tanggal 15 Mei 2026)*

Dokumen ini adalah fondasi mutlak dan kompas arah dari seluruh pengembangan aplikasi **Radio SBL Super-App**. Setiap agen AI yang bekerja di proyek ini **WAJIB MENGHAFAL DAN MEMATUHI** keenam pilar berikut tanpa terkecuali:

### 1. Pengerjaan Iteratif (Satu per Satu Halaman) 🧱
Tidak serakah merombak banyak halaman atau fitur sekaligus. Fokus pada 1 halaman, bedah hingga tuntas dan sempurna, barulah melangkah ke halaman atau fitur berikutnya. Menjaga kestabilan sistem adalah prioritas.

### 2. Responsivitas Super-App (Device-Aware) 📱💻
Tampilan harus selalu mengusung konsep *Mobile-First* (optimal di layar HP), namun **wajib** menyesuaikan diri dengan anggun saat dibuka di layar lebar (PC/Tablet). Layar PC tidak boleh hanya berupa perbesaran (stretch) dari layar HP, melainkan menggunakan tata letak *split-screen* atau proporsi lebar yang estetis. Bebas dari *scroll* bocor/terpotong.

### 3. Fungsionalitas Nyata, Bukan Gimmick Visual ⚙️
Semua elemen yang tertampang di UI (seperti form pendaftaran, fitur nomor WhatsApp, hingga fitur lupa kata sandi) harus memiliki fungsi nyata yang terhubung ke backend Firebase/Firestore. Tidak boleh ada antarmuka tiruan (dummy) yang bersifat membohongi pengguna.

### 4. Uji Coba Mandiri & Perbaikan Otomatis (Self-Testing & Healing) 🛠️
Sebelum menyetor laporan bahwa tugas selesai, agen pengembang **wajib secara mandiri** memverifikasi kode menggunakan *test suite* yang ada (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`). Jika terjadi error, lakukan investigasi dan perbaikan secara otomatis (self-healing).

### 5. Disiplin Backup & Pencatatan (Handoff Protocol) 💾
Setiap menyelesaikan satu babak besar, seluruh perubahan harus direkam dan didokumentasikan dengan rinci pada file pelacakan (contoh: `CODEX_SESSION_LOG.md` & `HANDOFF.md`). Tujuannya agar agen lain di masa depan, atau jika pekerjaan terputus, dapat melanjutkannya dengan mulus tanpa membuang waktu.

### 6. Penggunaan Bahasa Indonesia Penuh (Full Localization) 🇮🇩
Semua komunikasi UI, mulai dari teks halaman, label, peringatan, terjemahan error dari database, hingga respons penjelasan pengembangan, harus dibalut dengan Bahasa Indonesia yang mudah dipahami, ramah pengguna, dan relevan dengan identitas ("Suara Pinrang, Suara Kita!").

---
**Catatan:** *Dokumen ini bersifat sakral bagi setiap agen yang terlibat dalam proyek ini.*
