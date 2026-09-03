# InvoiceGen — Handoff (Cycle 3)

## Summary

Cycle 3 mendefinisikan Dashboard InvoiceGen. Dashboard menjadi halaman utama `/dashboard`, membaca data dari local store, dan tidak mengubah data.

## Current Phase

Phase 3 — Dashboard.

## Completed Work

- TASK-013 Dashboard route and navigation
- TASK-014 Dashboard summary and status breakdown
- TASK-015 Paid revenue six-month view
- TASK-016 Recent invoices and clients
- TASK-017 Dashboard quick actions and resilience
- TASK-018 Dashboard verification

## Verification Gap

TASK-012 Cycle 2 tetap Blocked karena `npm run check` gagal pada 91 baseline formatter diagnostics dan manual browser smoke test belum dilakukan. Dashboard build, focused Biome check, HTTP route check, dan unit test berhasil.

## Locked Decisions

- `/dashboard` menjadi halaman utama; tidak redirect ke invoice.
- Revenue hanya menghitung invoice berstatus `paid`.
- Revenue menampilkan enam bulan kalender terakhir, termasuk bulan bernilai nol.
- Dashboard read-only.
- Maksimal delapan invoice terbaru dan delapan client terbaru.
- Semua data berasal dari local store. Tidak ada dummy data, API bisnis, cloud sync, atau analytics eksternal.

## Critical Risks

- Revenue salah bila status selain `paid` ikut dihitung. Mitigasi: filter status `paid` dan verifikasi dengan data campuran.
- Dashboard menjadi template generik. Mitigasi: semua angka dari local store, empty state nyata, link dan aksi harus berfungsi.
- Hydration mismatch. Mitigasi: ikuti pola hydration-safe store yang sudah dipakai aplikasi.

## Important Notes

- Baca `.hermes/scoper/SPEC.md` bagian Cycle 3 sebelum implementasi.
- Baca `.hermes/scoper/TICKETS.md` TASK-013..018.
- Jangan mengubah requirement, priority, dependency, atau scope ticket.
- Jangan menjalankan migration atau seed.
- Jangan membaca/commit `.env`, `cookies*.txt`, `smoke.jar`.
- Jangan push tanpa instruksi eksplisit.

## Next Step

Dashboard Cycle 3 selesai diimplementasikan (TASK-013..018 Done). Verifikasi: `npm run build` sukses, `npm test` 4/4, HTTP `/dashboard` 200, focused Biome check bersih. `npm run check` penuh tetap gagal pada baseline formatter (CRLF/line-ending) yang sudah ada sejak Cycle 2, dan manual browser smoke test belum dilakukan. Laporkan gap ini secara jujur; jangan tandai Done tanpa bukti.

## Files

- `.hermes/scoper/PROJECT.md`
- `.hermes/scoper/SPEC.md`
- `.hermes/scoper/TICKETS.md`
- `.hermes/scoper/DECISIONS.md`
- `.hermes/scoper/RISKS.md`
- `.hermes/scoper/HANDOFF.md`
- `.hermes/scoper/CHANGELOG.md`

---

Cycle 2 history remains preserved in repository files and earlier ticket sections.

---

Cycle 3 dashboard scope is ready for Builder handoff.

---

No implementation has been performed by Scoper.

---

No deployment or remote write is authorized.

---

Follow the active specification, not old template routes.

---

Do not mark tickets Done without evidence.

---

Preserve the local-only promise.

---

Start TASK-013.
