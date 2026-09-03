# InvoiceGen

Aplikasi web untuk membuat dan mengelola **invoice** sepenuhnya di sisi client (local-first). Buat invoice, kelola klien, konfigurasi profil perusahaan, dan unduh PDF invoice — semua data tersimpan di `localStorage` browser Anda. Tidak ada server, database, atau akun.

## Fitur

- **Dashboard** — ringkasan: total dibayar, total belum dibayar, counts per status, revenue 6 bulan terakhir, invoice terbaru, dan klien terbaru.
- **Invoice (CRUD)**
  - Buat, edit, hapus, dan lihat invoice.
  - Status workflow: `draft → sent → paid` (dengan `overdue` saat jatuh tempo).
  - Item baris dengan quantity, harga satuan, sub-total, diskon, dan pajak / VAT.
  - Penomoran otomatis `INV-<tahun>-<seq>` (contoh `INV-2026-001`).
  - Preview, print, dan unduh **PDF**.
- **Klien (CRUD)** — data kontak klien (nama, email, telepon, alamat).
- **Pengaturan**
  - **Company Profile**: nama perusahaan, email, telepon, website, alamat, tax ID, akun pembayaran, issuer, dan **logo** (PNG/JPG/SVG/WebP, maks. 512 KB).
  - **Preferensi tampilan**: tema terang/gelap/sistem, preset tema, font, layout konten, sidebar, dsb.
  - **Backup**: export & import JSON untuk memindahkan data antar perangkat.
- **100% lokal** — tanpa backend; semua data disimpan rapi di browser.

## Tech Stack

- **Framework**: TanStack Start (React Router), React 19, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui (Base UI variant / `base-nova`), lucide-react
- **PDF**: @react-pdf/renderer
- **State**: Zustand (persist ke localStorage)
- **Validasi**: Zod + React Hook Form
- **Tooling**: Vite, Nitro, Biome, Vitest, Husky, Playwright (agenda)

## Struktur

```
src/
├── components/          # UI primitives (shadcn) + shared
├── config/              # App config (nama, meta)
├── lib/                 # Util: local-store (invoice/store), preferences, cookie
├── navigation/          # Definisi item sidebar
├── routes/
│   ├── (main)/dashboard # Halaman utama: dashboard, invoice, clients, settings
│   └── __root.tsx       # Root layout (Shell, Toaster)
├── stores/              # Zustand stores (invoice store, preferences)
└── scripts/             # Script bawaan (theme boot)
tests/                   # Unit test (Vitest) + E2E (Playwright)
```

## Menjalankan lokal

```bash
npm install
npm run dev
```

Aplikasi berjalan di http://localhost:3000.

## Perintah

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Build produksi (client + SSR) |
| `npm run preview` | Preview build produksi |
| `npm test` | Unit test (Vitest) |
| `npm run check` / `check:fix` | Biome lint & format |
| `npm run lint` / `format` | Biome lint / format saja |
| `npm run generate-routes` | Regenerate route tree (TanStack) |

## Data & Privasi

- Semua data (profile, klien, invoice) disimpan di **localStorage** key `invoicegen-local-store`.
- Export **JSON backup** dari halaman Settings sebelum membersihkan data browser atau pindah perangkat.
- Logo disimpan sebagai **data URL** di profil (maks. 512 KB agar localStorage tidak cepat penuh).

## Lisensi

MIT — lihat file [LICENSE](LICENSE).