# InvoiceGen — Changelog

## Cycle 3 — Dashboard (2026-08-31)

### Keputusan

- `/dashboard` menjadi halaman utama; menghapus redirect lama ke `/dashboard/invoice`.
- Revenue hanya menghitung invoice berstatus `paid`; dibulatkan ke bulan kalender 6 bulan terakhir berdasarkan `issuedDate`.
- Semua nilai berasal dari local store; tidak ada dummy data, API bisnis, atau analytics eksternal.
- Dashboard read-only terhadap data lokal.
- Maksimal delapan invoice terbaru dan delapan client terbaru.

### Implementasi

- `src/navigation/sidebar/sidebar-items.ts`: tambah item Dashboard menuju `/dashboard`; Invoices tetap `/dashboard/invoice`.
- `src/routes/(main)/dashboard/index.tsx`: halaman dashboard lengkap:
  - Ringkasan total invoice, unpaid, paid, draft.
  - Breakdown status draft/sent/paid/overdue.
  - Revenue 6 bulan (hanya paid, berdasarkan `issuedDate`), dengan empty state.
  - Daftar invoice terbaru dan client terbaru (maks 8), link ke detail.
  - Aksi cepat Create Invoice dan Add Client.
  - Empty state global saat belum ada data.
  - Hydration guard: spinner sebelum rehydrate, error state bila store gagal.
  - Layout responsif dan interaksi keyboard-friendly (semua tombol/link nyata).

### Verifikasi

- `npm run build`: sukses.
- `npm test -- --run`: 4/4 sukses.
- HTTP `/dashboard`: 200.
- Biome check fokus 2 file: bersih.
- `npm run check` penuh: tetap gagal pada 91 baseline formatter diagnostics (CRLF/line-ending, drizzle snapshot, package.json) yang sudah ada sejak Cycle 2; bukan dari perubahan dashboard.
- Manual browser smoke test: belum dilakukan, dilaporkan jujur sebagai gap.

### Catatan

- TASK-013..018 berstatus Done.
- TASK-012 Cycle 2 tetap Blocked karena `npm run check` dan manual smoke test belum tuntas.
- Tidak ada file rahasia (`.env`, `cookies*.txt`, `smoke.jar`) yang dibaca/di-commit.
