---

# Cycle 3 — Dashboard

Tanggal: 2026-08-31

Status: In Progress

## Discovery Summary

User memilih dashboard level 3. Keputusan terkunci saat discovery:

- `/dashboard` menjadi halaman utama (menu Invoices tetap `/dashboard/invoice`).
- Revenue per bulan dihitung dari invoice berstatus `paid`.
- Rentang revenue 6 bulan terakhir.

## Design Intent

Dashboard menyajikan kondisi bisnis lokal dalam satu layar, semuanya dihitung dari data yang sudah ada di store. Tidak ada data dummy, tidak ada klaim tanpa sumber, tidak ada chart yang menampilkan angka tanpa label.

Keputusan baru untuk siklus ini:

- D11 — Dashboard adalah halaman utama (`/dashboard`), bukan redirect ke invoice.
- D12 — Revenue = invoice berstatus paid; rentang 6 bulan terakhir.
- D13 — Dashboard read-only; semua mutasi tetap lewat halaman invoice/client/settings.
