# IoT Control System - Campus Power Management

## Deskripsi
Sistem Kontrol IoT untuk Manajemen Daya Kampus adalah platform berbasis web yang dirancang untuk memantau dan mengontrol penggunaan energi listrik secara real-time di area kampus. Sistem ini memungkinkan administrator dan petugas untuk mengawasi status perangkat (lampu, AC), mengelola data pemasangan, dan menganalisis laporan konsumsi daya.

## Fitur Utama
- **Dashboard Real-time**: Ringkasan status lampu menyala, konsumsi energi hari ini (kWh), dan estimasi biaya harian.
- **Kontrol Ruangan**: Antarmuka interaktif untuk mengontrol perangkat per ruangan dengan visualisasi grid lampu.
- **Data Pemasangan (CRUD)**: Manajemen data teknisi dan riwayat pemasangan lampu yang dibatasi khusus untuk admin, dengan pencatatan tanggal otomatis.
- **Laporan & Analisis**: 
  - Grafik tren konsumsi daya.
  - Tabel rincian konsumsi energi per lampu.
  - Fitur ekspor laporan ke format PDF dan Excel.
- **Riwayat Aktivitas**: Log terstruktur yang mencatat waktu, petugas, perangkat, dan status aksi secara real-time melalui integrasi MQTT/Socket.io.

## Teknologi Utama
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **Backend/IoT**: Node.js, Socket.io (untuk komunikasi real-time), MQTT (untuk integrasi perangkat keras).
- **Visualisasi Data**: Recharts (untuk grafik daya).
- **Utilitas**: Date-fns, jsPDF, XLSX.

## Panduan Penggunaan
1. **Login**: Masuk menggunakan akun admin untuk akses penuh atau akun petugas untuk monitoring.
2. **Monitoring**: Gunakan dashboard untuk melihat gambaran umum penggunaan daya.
3. **Kontrol**: Masuk ke menu "Kontrol Ruangan" untuk menyalakan/mematikan lampu secara individu atau massal.
4. **Laporan**: Unduh data konsumsi berkala melalui menu "Reports" untuk keperluan audit energi.

## Struktur Proyek
- `/src/components`: Komponen UI reusable dan blok bangunan aplikasi.
- `/src/pages`: Halaman utama aplikasi (Dashboard, Kontrol Ruangan, Laporan, Riwayat).
- `/src/lib`: Konfigurasi library (socket, utils).
- `/server`: Kode backend untuk simulasi dan gateway data IoT.

---
Dikembangkan untuk efisiensi energi dan transparansi penggunaan daya di lingkungan kampus.