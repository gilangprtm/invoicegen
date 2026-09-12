# Contributing to InvoiceGen

Panduan kontribusi untuk **InvoiceGen**. Aplikasi local-first untuk mengelola invoice sepenuhnya di browser.

## Overview

InvoiceGen dibangun dengan TanStack Start, React 19, TypeScript, Tailwind CSS v4, dan shadcn/ui. Data disimpan di local storage browser melalui Zustand. Tidak ada server, database, autentikasi, atau sinkronisasi cloud dalam produk.

## Project Layout

```
src
├── routes                  # TanStack Router routes
│   ├── (main)
│   │   └── dashboard       # Dashboard workspace, invoice, clients, settings
│   └── __root.tsx          # Root document dan provider
├── components              # Shared UI dari shadcn/base-nova
├── hooks                   # Reusable hooks
├── lib                     # Utilitas domain, preferences, format
├── navigation              # Definisi navigasi sidebar
├── stores                  # Zustand store (invoice, preferences)
└── styles                  # Tailwind dan theme preset
```

File atau direktori dengan awalan `-`, seperti `-components`, tidak digenerate menjadi route dan dapat dikolokasikan dengan route pembuatnya.

## Getting Started

### Clone

```bash
git clone https://github.com/gilangprtm/invoicegen.git
cd invoicegen
```

### Install dan run

```bash
npm install
npm run dev
```

Aplikasi tersedia di `http://localhost:3000`.

## Contribution Flow

- Buat branch baru:

```bash
git checkout -b feat/my-update
```

- Tulis commit yang jelas:

```bash
git commit -m "feat: add invoice filter"
```

- Buka pull request setelah siap.
- Sertakan screenshot untuk perubahan UI yang material dan catat perilaku light/dark serta mobile jika relevan.

## Where to Contribute

- **Dashboard dan fitur**: `src/routes/(main)/dashboard/`
- **Komponen UI**: `src/components/` dan `src/components/ui/`
- **Logika dan utilitas**: `src/hooks/`, `src/lib/`
- **Navigasi**: `src/navigation/`
- **Store**: `src/stores/`
- **Theme**: `src/styles/presets/`

## Guidelines

- Gunakan type yang presisi dan hindari `any`.
- Tetap gunakan alias import `@/`.
- Simpan komponen spesifik fitur di dalam direktori `-components` milik route.
- Jangan edit `src/routeTree.gen.ts` secara manual.
- Gunakan theme token semantik yang ada, bukan warna acak.
- Seluruh angka dashboard harus berasal dari local store. Jangan menambahkan data contoh.
- Tetap aksesibel dengan dialog yang dapat ditutup Escape, status keyboard, dan label yang jelas.
- Untuk pekerjaan visual, baca `DESIGN.md` lebih dulu dan terapkan antislop sebagai filter.
- Jangan menambah backend, database, autentikasi, atau analitik pihak ketiga tanpa persetujuan pemilik.

## Submitting PRs

- Pastikan branch terbaru terhadap `main` sebelum submit.
- Tautkan issue terkait jika ada.

## Questions and Support

Laporkan bug, saran, atau issue melalui GitHub Issues milik repository ini.
