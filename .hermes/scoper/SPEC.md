---

# Cycle 3 — Dashboard Specification

## 1. Scope

Tambah halaman Dashboard InvoiceGen pada `/dashboard`. Halaman menjadi tujuan utama menu Dashboard dan tidak lagi melakukan redirect ke halaman invoice.

Dashboard membaca data lokal yang sudah tersedia. Dashboard tidak mengubah data.

## 2. Functional Requirements

### F10 — Dashboard Entry

- F10.1 `/dashboard` dapat dibuka langsung.
- F10.2 `/dashboard` tidak redirect ke `/dashboard/invoice`.
- F10.3 Navigasi sidebar memiliki item Dashboard dengan tujuan `/dashboard`.
- F10.4 Item Invoices tetap menuju `/dashboard/invoice`.
- F10.5 Aksi cepat Create Invoice membuka alur pembuatan invoice.
- F10.6 Aksi cepat Add Client membuka alur penambahan client.

### F11 — Summary

- F11.1 Tampilkan total jumlah invoice.
- F11.2 Tampilkan total unpaid dari invoice yang belum berstatus paid.
- F11.3 Tampilkan total paid dari invoice berstatus paid.
- F11.4 Tampilkan jumlah invoice draft.
- F11.5 Nilai summary berasal dari data invoice lokal.
- F11.6 Nilai uang mengikuti currency/format yang digunakan aplikasi.

### F12 — Invoice Status Breakdown

- F12.1 Tampilkan jumlah invoice untuk status draft, sent, paid, dan overdue.
- F12.2 Status yang tidak memiliki invoice tetap memiliki tampilan yang jelas.
- F12.3 Breakdown tidak memakai data dummy.
- F12.4 User dapat menuju daftar invoice dari bagian status bila interaksi itu tersedia.

### F13 — Paid Revenue

- F13.1 Tampilkan revenue per bulan untuk 6 bulan kalender terakhir, termasuk bulan tanpa revenue.
- F13.2 Revenue hanya menghitung invoice berstatus paid.
- F13.3 Setiap periode memiliki label bulan yang jelas.
- F13.4 Nilai revenue berasal dari total invoice paid pada bulan terkait.
- F13.5 Empty state menjelaskan belum ada invoice paid bila seluruh periode bernilai nol.

### F14 — Recent Invoices

- F14.1 Tampilkan invoice terbaru berdasarkan tanggal/perubahan terbaru yang tersedia.
- F14.2 Tampilkan nomor invoice, client, tanggal, status, dan total.
- F14.3 Tampilkan maksimal delapan invoice terbaru.
- F14.4 Setiap invoice yang ditampilkan dapat dibuka ke halaman detail.
- F14.5 Empty state tersedia bila belum ada invoice.
- F14.6 Link untuk melihat semua invoice menuju `/dashboard/invoice`.

### F15 — Recent Clients

- F15.1 Tampilkan client terbaru berdasarkan data lokal yang tersedia.
- F15.2 Tampilkan nama dan informasi kontak bila tersedia.
- F15.3 Tampilkan jumlah invoice per client bila data mendukung.
- F15.4 Tampilkan maksimal delapan client terbaru.
- F15.5 Empty state tersedia bila belum ada client.
- F15.6 Link untuk melihat semua client menuju `/dashboard/clients`.

## 3. Non-Functional Requirements

- NFR7: Dashboard responsive pada mobile, tablet, desktop.
- NFR8: Tidak ada network request untuk mengambil data dashboard.
- NFR9: Loading/hydration state tidak menampilkan data lokal yang belum siap.
- NFR10: Error state terlihat bila pembacaan local store gagal.
- NFR11: Semua navigasi dan aksi cepat dapat dioperasikan dengan keyboard.
- NFR12: Tidak membuat data statistik, revenue, client, atau invoice palsu.

## 4. Acceptance Test

1. Buka `/dashboard`; halaman dashboard tampil tanpa redirect.
2. Cek sidebar; item Dashboard menuju `/dashboard`, item Invoices menuju `/dashboard/invoice`.
3. Saat dataset kosong, summary, chart, invoice, dan client menampilkan empty state yang jelas.
4. Buat client dan beberapa invoice dengan status berbeda.
5. Kembali ke `/dashboard`; summary dan status breakdown sesuai dataset.
6. Tandai invoice sebagai paid; revenue muncul pada bulan tanggal invoice tersebut.
7. Pastikan invoice draft tidak masuk revenue.
8. Pastikan revenue menampilkan 6 bulan kalender terakhir, termasuk bulan tanpa paid invoice.
9. Cek invoice terbaru; buka salah satu invoice dari dashboard.
10. Cek client terbaru dan jumlah invoice per client.
11. Klik Create Invoice dan Add Client; keduanya membuka alur yang benar.
12. Reload browser; dashboard tetap membaca data lokal.
13. Jalankan `npm run check`.
14. Jalankan `npm run build`.

## 5. Explicit Non-Goals

- Tidak menambah backend/API/analytics eksternal.
- Tidak menambah cloud sync.
- Tidak menambah payment processing.
- Tidak menambah forecast, profit margin, atau metrik bisnis yang tidak tersedia dari local store.
- Tidak mengubah workflow invoice/client yang sudah berjalan.
- Tidak membuat data dummy untuk mengisi chart atau card.

## 6. Deliverable Boundary

Deliverable adalah halaman dashboard yang tersambung ke local store, responsive, navigasinya berfungsi, dan memiliki empty/loading/error state. Visual tanpa data nyata bukan deliverable.

## 7. Design Read

Membaca ini sebagai: dashboard operasional invoice untuk pengguna individu/bisnis kecil, dengan visual language ringkas dan data-first, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

Alasan: dashboard harus membantu keputusan cepat tanpa mengalahkan core invoice flow atau berubah menjadi template admin generik.

## 8. Derived Decisions

- D11: Dashboard menjadi halaman utama `/dashboard`.
- D12: Revenue hanya berasal dari invoice `paid`.
- D13: Rentang revenue tetap 6 bulan kalender terakhir.
- D14: Dashboard bersifat read-only; mutasi memakai halaman invoice/client/settings.
- D15: Maksimal delapan item untuk daftar invoice dan client terbaru agar halaman tetap ringkas.

## 9. Cycle 3 Exit Criteria

- Semua acceptance criteria TASK-013 sampai TASK-017 terpenuhi.
- `npm run build` berhasil.
- `npm run check` berhasil atau gap terdokumentasi jujur.
- Manual smoke test selesai atau gap dilaporkan, tanpa klaim Done palsu.

## 10. Handoff

Implementasi dimulai setelah dokumen cycle ini selesai. Builder membaca ticket Cycle 3 pada bagian akhir `TICKETS.md` dan mengerjakan sesuai dependency.

---

## Existing Specification Preserved

Specification Cycle 2 tetap berlaku. Bagian ini ditambahkan agar requirement dashboard tidak menghapus requirement sebelumnya.

---

## Existing Specification Preserved

Specification Cycle 2 tetap berlaku. Bagian Cycle 3 di atas menambahkan requirement dashboard tanpa menghapus requirement sebelumnya.
