# 📖 Panduan Lengkap OpenShorts (Clipper Pro Edition)

Dokumentasi resmi ini memuat **daftar detail fitur**, **panduan cara penggunaan**, **kebutuhan sistem (prerequisites)**, serta **langkah instalasi lokal lengkap** untuk OpenShorts yang telah dioptimasi khusus untuk alur kerja (*workflow*) kreator konten dan *video clipper*.

---

## 📑 Daftar Isi
1. [Kebutuhan Sistem & Instalasi (Prerequisites)](#1-kebutuhan-sistem--instalasi-prerequisites)
2. [Panduan Instalasi Lokal (Step-by-Step)](#2-panduan-instalasi-lokal-step-by-step)
3. [Daftar Lengkap Fitur Unggulan (Fase 1 – 7)](#3-daftar-lengkap-fitur-unggulan-fase-1--7)
4. [Panduan Cara Penggunaan Alur Kerja (Clipper Workflow)](#4-panduan-cara-penggunaan-alur-kerja-clipper-workflow)
5. [Tabel Pintasan Keyboard (Hotkeys Cheatsheet)](#5-tabel-pintasan-keyboard-hotkeys-cheatsheet)
6. [Troubleshooting & Tanya Jawab Umum](#6-troubleshooting--tanya-jawab-umum)

---

## 1. Kebutuhan Sistem & Instalasi (Prerequisites)

Untuk menjalankan OpenShorts secara optimal dan lancar di laptop atau PC lokal, pastikan perangkat Anda memenuhi spesifikasi berikut:

### A. Spesifikasi Perangkat Keras (Hardware)
| Komponen | Spesifikasi Minimum | Rekomendasi Pengujian |
| :--- | :--- | :--- |
| **Sistem Operasi** | Windows 10/11 64-bit / macOS / Ubuntu Linux | Windows 11 64-bit |
| **Prosesor (CPU)** | Intel Core i3 / AMD Ryzen 3 (4 Cores+) | Intel Core i5-1135G7 (4 Core / 8 Threads) |
| **Memori (RAM)** | 8 GB RAM | 12 GB – 16 GB RAM |
| **Kartu Grafis (GPU)** | Terintegrasi (Intel UHD/Iris Xe / AMD Radeon) | Intel Iris Xe Graphics / NVIDIA GTX/RTX |
| **Penyimpanan (Disk)**| 10 GB ruang kosong (SSD direkomendasikan) | SSD NVMe |
| **Koneksi Internet** | Diperlukan untuk download model AI & video YouTube | Stabil |

### B. Perangkat Lunak Wajib (Software Prerequisites)
1. **Python 3.11.x (Sangat Penting):**
   Gunakan **Python versi 3.11** (misal Python 3.11.9). **Hindari Python 3.13** karena pustaka *Google MediaPipe* (AI deteksi wajah pembicara) belum mendukung Python 3.13 di Windows.
2. **Node.js (v18.x atau v20.x LTS) & npm:**
   Untuk menjalankan antarmuka web (Dashboard React + Vite).
3. **FFmpeg:**
   Harus terpasang dan terdaftar di dalam *System Environment Variables (PATH)* Windows untuk keperluan pemotongan video, *render audio*, dan *burning subtitle*.
   *(Jika menggunakan Laragon, FFmpeg biasanya sudah tersedia di folder `bin/ffmpeg` atau dapat diinstal via Chocolatey/Scoop: `choco install ffmpeg`).*
4. **Google Gemini API Key (Gratis):**
   Dapatkan API Key secara cuma-cuma melalui [Google AI Studio](https://aistudio.google.com/app/apikey).
5. **Git:**
   Untuk kloning dan manajemen versi repository.

---

## 2. Panduan Instalasi Lokal (Step-by-Step)

### Langkah 1: Clone Repository & Pindah ke Branch `develop`
Buka terminal (PowerShell / Git Bash) di folder Laragon (`C:\laragon\www\`):
```bash
cd C:\laragon\www
git clone https://github.com/mutonby/openshorts.git openshorts-main
cd openshorts-main
git checkout develop
```

### Langkah 2: Setup Lingkungan Python (Backend)
Gunakan installer Python 3.11 untuk membuat *virtual environment* khusus:
```powershell
# Pastikan menggunakan binary Python 3.11
py -3.11 -m venv venv311

# Aktifkan virtual environment
.\venv311\Scripts\Activate.ps1

# Upgrade pip & install semua dependensi backend
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Langkah 3: Setup Antarmuka Frontend (Dashboard React)
Buka tab terminal baru untuk folder antarmuka dashboard:
```powershell
cd C:\laragon\www\openshorts-main\dashboard

# Install dependensi Node.js
npm install

# (Opsional) Uji build aset produksi
npm run build
```

### Langkah 4: Menjalankan Aplikasi
Anda membutuhkan 2 terminal yang berjalan berdampingan:

* **Terminal 1: Menjalankan Backend Python (Port 8000)**
  ```powershell
  cd C:\laragon\www\openshorts-main
  .\venv311\Scripts\Activate.ps1
  python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
  ```

* **Terminal 2: Menjalankan Frontend Vite (Port 5173)**
  ```powershell
  cd C:\laragon\www\openshorts-main\dashboard
  npm run dev
  ```

Buka peramban web (*browser*) Anda dan akses: **`http://localhost:5173`**.

---

## 3. Daftar Lengkap Fitur Unggulan (Fase 1 – 7)

OpenShorts Clipper Pro Edition dilengkapi berbagai fitur khusus untuk mempercepat produksi klip vertikal siap tayang:

### 1. 📐 Safe Zone Overlay Guide (TikTok, Reels, Shorts)
* **Deskripsi:** Panduan overlay visual semi-transparan yang memetakan area antarmuka bawaan media sosial (tombol suka, komentar, share, judul bawah di TikTok/Instagram/Shorts).
* **Kegunaan:** Menjamin teks subtitle, hook, maupun wajah pembicara tidak tertutup oleh tombol aplikasi bawaan smartphone.
* **Cara Pakai:** Klik tombol `Safe Zone` di sudut kanan atas kartu klip atau tekan tombol `M` di keyboard untuk berganti mode (*Off ➔ TikTok ➔ Reels ➔ Shorts*).

### 2. 📋 1-Click "Copy All Meta" dengan Seleksi Niche
* **Deskripsi:** Tombol tunggal untuk menyalin paket lengkap metadata: Judul Klip, Hook Viral, Deskripsi TikTok/Reels, dan kumpulan Hashtag relevan.
* **Pilihan Niche:**
  - `🔥 Umum`: `#shorts #viral #fyp #trending`
  - `🤖 AI & Tech`: `#ai #technology #futuretech #artificialintelligence`
  - `💼 Bisnis & Cuan`: `#bisnis #investasi #keuangan #entrepreneur`
  - `💡 Motivasi`: `#motivasi #inspirasi #mindset #pengembangandiri`
  - `🎙️ Podcast`: `#podcast #podcastindonesia #interview #wawasan`
  - `😂 Hiburan`: `#komedi #hiburan #lucu #ngakak`

### 3. 🏷️ Workflow Status Tracker & ⭐ Priority Star
* **Deskripsi:** Sistem penanda status produksi mandiri per klip:
  - `● DRAFT` ➔ `● REVIEW` ➔ `● APPROVED` ➔ `● POSTED`
  - Tombol Bintang ⭐ untuk menandai klip unggulan bernilai viral tinggi.
* **Penyimpanan:** Tersimpan otomatis di `localStorage` per `jobId` sehingga tidak hilang saat browser dimuat ulang.

### 4. 🗜️ Sidebar Minimize / Expand Workspace
* **Deskripsi:** Tombol collapse untuk menyusutkan menu navigasi samping dari lebar 256px menjadi 64px.
* **Kegunaan:** Memberikan ruang kerja layar yang ~200px lebih luas untuk preview video 9:16 dan tabel editing.

### 5. 📦 Bundled Metadata TXT dalam Ekspor ZIP
* **Deskripsi:** Saat mengunduh arsip ZIP video, backend `app.py` otomatis membuatkan file:
  - `ALL_CAPTIONS_AND_TAGS.txt`: Dokumen rekapitulasi seluruh klip lengkap dengan skor, hook, dan hashtag.
  - `clip_XX_info.txt`: Dokumen metadata khusus untuk masing-masing klip video.
* **Kegunaan:** Clipper tidak perlu mencatat judul dan caption secara manual di komputer.

### 6. 🔍 Filter & Sort Toolbar Real-Time
* **Deskripsi:** Bilah filter di atas daftar klip untuk menyaring tampilan:
  - Tab Filter: `Semua`, `⭐ Prioritas`, `Draft`, `Review`, `Approved`, `Posted` (dilengkapi jumlah counter aktif).
  - Pilihan Urutan: Berdasarkan `🔥 Skor Viral Tertinggi` atau `⏱️ Urutan Kronologis Video`.

### 7. 🎨 Preset Subtitle Viral (Hormozi, MrBeast, Storyteller)
* **Deskripsi:** Preset gaya subtitle instan beresolusi tinggi yang dirancang untuk retensi penonton:
  - **Hormozi Gold:** Teks kuning tebal dengan background hitam tegas ala Alex Hormozi.
  - **MrBeast Neon:** Teks hijau terang punchy khas video tantangan MrBeast.
  - **Storyteller:** Teks putih bersih dengan bayangan lembut untuk narasi mendalam.
  - **Viral Fire:** Aksen merah menyala untuk konten berenergi tinggi.
* **Tombol "⭐ Set as Default Style":** Menyimpan gaya pilihan clipper ke memori sehingga seluruh klip baru otomatis menggunakan gaya tersebut.

### 8. 🔎 Subtitle Typo Quick "Find & Replace"
* **Deskripsi:** Alat pencari dan pengganti saltik langsung di dalam modal editor teks subtitle.
* **Kegunaan:** Memperbaiki kesalahan penulisan nama orang, merek, atau istilah asing di semua segmen subtitle secara serentak tanpa perlu mengedit satu per satu.

### 9. ⚡ Smart Selective ZIP Export ("Download Filtered Only")
* **Deskripsi:** Tombol unduh pintar yang otomatis menyesuaikan filter yang aktif.
* **Kegunaan:** Jika Anda hanya menyaring `⭐ Prioritas (3)`, tombol otomatis menjadi `📥 download filtered (3)` dan hanya mengemas 3 klip tersebut ke dalam ZIP. Menghemat ruang harddisk dan kuota internet.

### 10. ⏩ Fast Scrubbing Speed Controller (1x, 1.25x, 1.5x, 2x)
* **Deskripsi:** Kontrol kecepatan putar video langsung di pemutar kartu klip.
* **Kegunaan:** Mempercepat waktu review dan kurasi video hingga 2x lipat. Dilengkapi pintasan keyboard `[` (pelan) dan `]` (cepat).

### 11. 📸 1-Click HD Cover / Thumbnail Grabber
* **Deskripsi:** Tombol `📸 Cover` (atau tekan tombol `T`) untuk mengekstrak frame video saat ini pada resolusi penuh 1080x1920 (PNG) bebas watermark.
* **Kegunaan:** Menghasilkan thumbnail/sampul vertikal kualitas tinggi untuk YouTube Shorts dan Reels tanpa perlu tangkapan layar manual.

### 12. ⚡ Batch Workflow Actions ("Approve All" & "Star All")
* **Deskripsi:** Tombol aksi massal di samping toolbar filter:
  - `✓ Approve All (N)`: Sekali klik untuk mengubah seluruh klip yang tampil menjadi status Approved.
  - `⭐ Star All (N)`: Sekali klik untuk memprioritaskan seluruh klip yang tampil dengan bintang ⭐.

### 13. ✏️ Inline Title & Hook Quick-Editor
* **Deskripsi:** Klik langsung teks Judul atau Hook (atau klik ikon pensil ✏️) untuk menyunting kalimat dalam Bahasa Indonesia atau menambahkan emoji.
* **Kegunaan:** Hasil editan langsung tersimpan dan otomatis masuk ke dalam teks saat menekan tombol *Copy All Meta*.

### 14. 📏 Mobile Feed Character Counter
* **Deskripsi:** Indikator panjang karakter judul YouTube Shorts:
  - **🟢 Hijau (`≤ 60 char`):** `Pas di Feed HP ✓` (Tidak akan terpotong elipsis `...`).
  - **🟡 Kuning (`61 - 100 char`):** `Bisa Terpotong di HP ⚠️`.
  - **🔴 Merah (`> 100 char`):** `Melebihi Batas YT ❌`.

---

## 4. Panduan Cara Penggunaan Alur Kerja (Clipper Workflow)

Berikut adalah alur kerja harian clipper paling efektif:

```
[Import Video / URL YouTube] 
       ↓
[AI Deteksi Klip & Transkrip] 
       ↓
[Review Cepat dengan Hotkeys (Speed 1.5x)] 
       ↓
[Poles Judul (✏️) & Cek Safe Zone (M)] 
       ↓
[Tangkap Cover HD (📸 / T)] 
       ↓
[Beri Status "Approved" / Star ⭐] 
       ↓
[Unduh ZIP Selektif & Copy Meta]
```

1. **Memproses Video Sumber:** Masukkan link YouTube podcast/webinar, masukkan Gemini API Key, klik *Generate Shorts*.
2. **Review Cepat:** Gunakan keyboard shortcut `Spasi` (play/pause), `]` untuk review pada kecepatan `1.5x`, dan `M` untuk memeriksa *Safe Zone* TikTok/Reels.
3. **Kustomisasi Teks & Subtitle:** Buka `subtitles` untuk menerapkan preset *Hormozi Gold*, gunakan *Find & Replace* untuk membetulkan saltik nama tokoh.
4. **Poles Judul & Tangkap Cover:** Klik teks judul untuk mengganti kalimat bahasa Indonesia yang memikat (perhatikan badge hijau `≤ 60 char`). Jeda video di frame ekspresi wajah terbaik, tekan `T` untuk unduh cover 1080x1920 (PNG).
5. **Kurasi & Ekspor:** Klik `Approve All` pada klip yang siap tayang, klik `download filtered (N)` untuk mengunduh ZIP bersih, lalu klik `Copy All Meta` untuk paste langsung ke YouTube Studio / TikTok.

---

## 5. Tabel Pintasan Keyboard (Hotkeys Cheatsheet)

Tekan tombol **`?`** kapan saja di dalam dashboard untuk membuka jendela panduan ini secara instan:

| Tombol | Kategori | Fungsi Utama |
| :---: | :--- | :--- |
| <kbd>Space</kbd> | Playback | Memutar (*Play*) atau Menjeda (*Pause*) video aktif |
| <kbd>J</kbd> atau <kbd>←</kbd> | Playback | Melompat mundur 3 detik |
| <kbd>L</kbd> atau <kbd>→</kbd> | Playback | Melompat maju 3 detik |
| <kbd>0</kbd> | Playback | Mengulang pemutaran video kembali ke detik awal (00:00) |
| <kbd>[</kbd> | Kecepatan | Memperlambat kecepatan putar (*1x ➔ 1.25x ➔ 1.5x ➔ 2x*) |
| <kbd>]</kbd> | Kecepatan | Mempercepat pemutaran video (*hingga 2x*) |
| <kbd>T</kbd> | Clipper | **Menangkap Thumbnail Frame HD (PNG 1080x1920)** |
| <kbd>M</kbd> | Clipper | Mengganti panduan *Safe Zone* (TikTok / Reels / Shorts / Off) |
| <kbd>S</kbd> | Clipper | Menandai / membatalkan tanda Bintang Prioritas ⭐ |
| <kbd>C</kbd> | Clipper | Menyalin seluruh metadata (Judul + Hook + Caption + Tags) |
| <kbd>?</kbd> | Bantuan | Membuka / menutup jendela pintasan keyboard |
| <kbd>Esc</kbd> | Navigasi | Menutup modal atau jendela sembulan yang sedang aktif |

---

## 6. Troubleshooting & Tanya Jawab Umum

### Q1: Muncul peringatan "Feedback manager requires a model with a single signature inference" atau "PyTorch non-writable tensor warning"?
> **Solusi:** Ini adalah peringatan internal (*UserWarning*) dari pustaka MediaPipe dan PyTorch saat memproses face tracking. Peringatan ini aman diabaikan dan video tetap dipotong dengan presisi tinggi.

### Q2: Mengapa MediaPipe gagal di Python 3.13?
> **Solusi:** MediaPipe belum memiliki wheel resmi untuk Python 3.13 di Windows. Selalu gunakan lingkungan Python 3.11 (`venv311`).

### Q3: Tampilan dashboard mendadak blank / black screen?
> **Solusi:** Pastikan Anda berada di commit terbaru pada branch `develop`. Lakukan refresh browser dengan `Ctrl + F5`.

### Q4: Di mana file video dan metadata tersimpan di laptop?
> **Solusi:** Seluruh klip video, file audio wav, transkrip JSON, dan arsip ZIP disimpan secara rapi di dalam direktori:  
> `C:\laragon\www\openshorts-main\output\{job_id}\`

---

## 7. Fitur Unggulan: Studio Thumbnail 9:16 & Video Intro Burner Pro

Setiap klip video vertikal (YouTube Shorts, TikTok, Instagram Reels) kini dilengkapi dengan **Thumbnail Studio Interaktif** yang dapat langsung dibakar menjadi **Intro Video 2.5 Detik**:

### ✨ Karakteristik Thumbnail Viral:
1. **Desain Melengkung (Arch / Wave / Slant):**
   - Header atas bertema warna viral (*Facebook Blue #1877F2, Viral Red, Hormozi Gold, Cyber Purple, Emerald, Slate*).
   - Bentuk melengkung (*Arch Cutout*) otomatis membingkai wajah pembicara di tengah.
2. **Search Pill Badge:**
   - Menampilkan badge pencarian modern `[ 🔍 Topik / Kata Kunci ]` lengkap dengan tombol silang atau logo channel Anda.
3. **Upload Logo Channel:**
   - Unggah file logo PNG/JPG channel Anda sekali saja; tersimpan otomatis di browser (*localStorage*) dan dapat diposisikan di Search Pill, Sudut Kanan Atas, atau Kartu Pengumuman.
4. **Headline & Announcement Card:**
   - Judul hook tebal dengan slider ukuran font (32px - 80px).
   - Kartu pengumuman bawah (*ANNOUNCEMENTS*) putih kontras untuk menegaskan inti pesan klip.

### 🎬 Pembakar Video Intro (2.5 Detik Otomatis):
Klik tombol **`🎬 Pasang Sebagai Intro Video (2.5s + SFX)`**:
- Menggabungkan thumbnail sebagai cover pembuka selama 2.5 detik dengan transisi memudar halus (*smooth dissolve fade-out 0.5s*) langsung ke video pembicara.
- Menjadi **auto-cover instan** di feed YouTube Shorts & TikTok tanpa perlu upload manual.

### 🔊 Audio Sound Effect (SFX) 100% Bebas Hak Cipta (*No Copyright*):
Tersedia 5 preset suara synthesized PCM murni yang dibuat khusus tanpa risiko klaim Content ID:
- 🔔 **iPhone / Chime:** Denting notifikasi smartphone yang menghentikan *doom-scrolling*.
- 💨 **Fast Whoosh:** Hembusan angin modern khas transisi video viral.
- 💥 **Cinematic Boom:** Dentuman bass mewah berkelas.
- 📸 **Camera Click:** Jepretan kamera dua ketukan yang renyah.
- 🎈 **Bubble Pop:** Letupan gelembung santai.
- 🎚️ **Slider Volume SFX:** Pengaturan volume proporsional (default 35%) sehingga suara asli pembicara tetap jernih dan tidak tertutup.
- 🎵 **Custom SFX:** Pilihan upload efek suara favorit Anda sendiri.

---
*OpenShorts Clipper Pro Edition — Dokumentasi Resmi 2026*