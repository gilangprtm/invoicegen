# InvoiceGen Domain Context

## Product Boundary

InvoiceGen adalah aplikasi local-first untuk membuat, mengelola, melihat, mencetak, dan mengunduh invoice. Aplikasi tidak memakai server, database, akun, autentikasi, atau sinkronisasi cloud.

## Core Concepts

### Invoice
- Tagihan yang dibuat untuk seorang klien.
- Status: `draft`, `sent`, `paid`, dan `overdue` sebagai status tampilan ketika invoice terkirim melewati tanggal jatuh tempo.
- Memiliki nomor, tanggal terbit, tanggal jatuh tempo, mata uang, item, diskon, pajak, catatan, subtotal, dan total.
- Nomor invoice dibuat otomatis dengan pola `INV-<tahun>-<urutan>` ketika nomor yang diberikan kosong atau sudah dipakai.

### InvoiceItem
- Baris produk atau jasa pada invoice.
- Memiliki nama, kuantitas, harga satuan, dan total baris.
- Subtotal, diskon, pajak, dan total invoice dihitung dari item dan penyesuaian yang dipilih.

### Client
- Orang atau bisnis yang menerima invoice.
- Memiliki nama, email, telepon, alamat, dan waktu pembuatan.
- Satu klien dapat memiliki banyak invoice.

### CompanyProfile
- Informasi penerbit invoice.
- Memiliki nama perusahaan, kontak, alamat, tax ID, detail pembayaran, nama penerbit, dan logo.
- Logo disimpan sebagai data URL di local storage dengan batas ukuran yang ditetapkan UI.

### Preferences
- Preferensi mata uang invoice dan tema aplikasi.
- Preferensi tampilan tambahan seperti preset tema, font, layout konten, gaya navbar, dan perilaku sidebar dikelola oleh preference store.

## Relationships

- Satu Client dapat memiliki banyak Invoice.
- Satu Invoice memiliki banyak InvoiceItem.
- Satu CompanyProfile digunakan oleh invoice yang ditampilkan, dicetak, atau diekspor ke PDF.
- Satu workspace browser menyimpan profile, clients, invoices, preferences, dan preferensi tampilan secara lokal.

## Storage and Runtime

- Store utama: `src/stores/invoice-store.ts`.
- Store persist menggunakan Zustand dengan key `invoicegen-local-store`.
- Utilitas domain: `src/lib/local-store-utils.ts`.
- Tidak ada import runtime ke `src/db`, `src/server`, Better Auth, PostgreSQL, atau API bisnis.
- Backup resmi berupa JSON export/import dari halaman Settings.

## Status Rules

- `draft` dapat dikirim menjadi `sent`.
- `sent` dapat menjadi `paid` atau `overdue`.
- `overdue` dapat menjadi `paid`.
- Invoice `sent` yang melewati due date ditampilkan sebagai `overdue` oleh `normalizeStatus`.
- Revenue dashboard hanya menghitung invoice yang tampil berstatus `paid`.

## Glossary

- **Invoice**: tagihan untuk produk atau jasa.
- **InvoiceItem**: satu baris produk atau jasa di invoice.
- **Client**: penerima invoice.
- **CompanyProfile**: informasi bisnis penerbit invoice.
- **Preferences**: pengaturan mata uang, tema, dan layout.
- **Local-first**: aplikasi tetap berguna tanpa backend; data utama disimpan di browser pengguna.

## Design and Quality

- Arah visual ditetapkan di `DESIGN.md`.
- Untuk pekerjaan UI, `DESIGN.md` dibaca sebelum perubahan dan antislop digunakan sebagai filter kualitas.
- Angka dashboard harus berasal dari store lokal. Jangan membuat data contoh yang tampak nyata.
- Komponen stok di `src/components/ui` dipertahankan sengaja sebagai ready-to-use inventory dari shadcn/base-nova.
