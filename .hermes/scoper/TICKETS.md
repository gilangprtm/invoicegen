# InvoiceGen — Implementation Plan (Cycle 2)

Lifecycle: `Todo → In Progress → Done` (atau `Blocked`).

Semua ticket mengikuti `SPEC.md` (F1–F9), `DECISIONS.md`, dan `RISKS.md` aktif. Cycle 1 server-backed sudah digantikan; jangan mengerjakan requirement lama.

## Phase 1 — Core Local-First Foundation

### TASK-001 — Local-first store (profile, clients, invoices, items, preferences)

- Status: Done
- Depends On: None
- Priority: P0

Description:
Implement browser storage persistence untuk company profile, clients, invoices, invoice items, dan preferences dengan ID stabil dan SSR-safe access. Core route tidak boleh mengimpor server business functions/auth/db.

Acceptance Criteria:
- [x] Store menyediakan get/set/create/update/delete untuk profile, clients, invoices, items.
- [x] Data bertahan setelah reload.
- [x] Hydration-safe (tidak error di SSR).
- [x] Tidak ada import auth/db/server di core route.

### TASK-002 — Hapus auth guard dari core app

- Status: Done
- Depends On: TASK-001
- Priority: P0

Description:
Root route membuka app tanpa redirect ke login. Hapus/pindahkan session guard dan UI login/register dari core flow.

Acceptance Criteria:
- [x] Root route tidak me-redirect ke login.
- [x] Tidak ada route guard yang memblokir core app.
- [x] Tidak ada button Google/social login di core app.

### TASK-003 — Invoice list/create/view/edit/delete dari store lokal

- Status: Done
- Depends On: TASK-001
- Priority: P0

Description:
Sambungkan halaman invoice ke store lokal untuk list, create, view, edit, delete, dan status workflow.

Acceptance Criteria:
- [x] List invoice dari local store.
- [x] Create invoice menyimpan ke local store.
- [x] View dan edit membaca/menyimpan local store.
- [x] Delete hanya untuk draft.
- [x] Status transition mengikuti workflow; invalid ditolak.

### TASK-004 — Client management lokal

- Status: Done
- Depends On: TASK-001
- Priority: P0

Description:
Client list/create/edit/delete memakai local store; tolak delete jika client direferensikan invoice; client selector pada invoice memakai data lokal.

Acceptance Criteria:
- [x] Client CRUD local.
- [x] Delete client dengan invoice ditolak.
- [x] Invoice form memilih client dari local store.
- [x] Menambah client dari invoice flow.

### TASK-005 — Company profile lokal

- Status: Done
- Depends On: TASK-001
- Priority: P1

Description:
Company profile (nama, email, phone, website, address, tax ID, payment details, logo bila ada) disimpan lokal dan dipakai preview/print/PDF.

Acceptance Criteria:
- [x] Profile dapat di-set dan diedit.
- [x] Profile muncul di preview/print/PDF.
- [x] Invoice tetap dapat dibuat tanpa profile lengkap.

### TASK-006 — Invoice number lokal

- Status: Done
- Depends On: TASK-003
- Priority: P1

Description:
Nomor invoice `INV-{YYYY}-{NNN}` dihitung dari dataset lokal; cegah duplikasi.

Acceptance Criteria:
- [x] Nomor terisi otomatis.
- [x] Format `INV-{YYYY}-{NNN}`.
- [x] Tidak duplikat dalam dataset lokal.

### TASK-007 — Tax dan discount editable

- Status: Done
- Depends On: TASK-003
- Priority: P1

Description:
Tax label dan rate dapat diedit per invoice; preset quick-pick boleh tetap ada. Discount dan perhitungan konsisten di form/preview/print/PDF.

Acceptance Criteria:
- [x] Custom tax label+rate disimpan per invoice.
- [x] Preset quick-pick opsional.
- [x] Perhitungan subtotal/discount/tax/total konsisten.

### TASK-008 — PDF dan print lokal

- Status: Done
- Depends On: TASK-003
- Priority: P1

Description:
PDF download berjalan client-side; print memakai browser dialog; file PDF bernama `{invoice.number}.pdf`; output memuat data core.

Acceptance Criteria:
- [x] Tombol Download PDF menghasilkan file.
- [x] PDF dapat dibuka dan berisi data client/profile/items/total.
- [x] Print tetap berfungsi.

### TASK-009 — Export/import JSON

- Status: Done
- Depends On: TASK-001
- Priority: P0

Description:
Export seluruh dataset lokal ke file JSON dengan schema version; import memvalidasi sebelum mengganti dataset; import invalid tidak merusak data aktif; UI menjelaskan local-only + backup.

Acceptance Criteria:
- [x] Export menghasilkan file JSON berisi dataset.
- [x] Import memvalidasi version/shape.
- [x] Import invalid tidak mengubah data aktif.
- [x] UI menjelaskan data tersimpan lokal dan saran export.

## Phase 2 — Cleanup dan Verifikasi

### TASK-010 — Audit server/auth/db imports dari core

- Status: Done
- Depends On: TASK-003
- Priority: P1

Description:
Pastikan core app tidak membutuhkan auth/DB/server function. Hapus/isolasi file server, db, dan auth bila tidak dipakai core.

Acceptance Criteria:
- [x] Core routes tidak import `@/server`, `@/db`, atau Better Auth.
- [x] Tidak ada `DATABASE_URL` dibutuhkan saat runtime.
- [x] Tidak ada data invoice dikirim ke API.

### TASK-011 — Hapus/sembunyikan modul template non-core

- Status: Done
- Depends On: TASK-010
- Priority: P2

Description:
Modul seperti CRM, analytics, mail, chat, kanban, calendar, roles, dan legacy screens tidak mendukung invoice. Hapus atau sembunyikan dari navigasi.

Acceptance Criteria:
- [x] Navigasi hanya menampilkan modul yang relevan.
- [x] Build tetap sukses.
- [x] Tidak ada dead link.

### TASK-012 — Build, check, lint, dan manual smoke test

- Status: Blocked
- Blocker: `npm run build` dan `npm test` sukses. `npm run check` masih gagal dengan baseline formatter diagnostics akibat line ending CRLF/LF dan file legacy; manual browser smoke test belum dilakukan.
- Depends On: TASK-009, TASK-010, TASK-011
- Priority: P0

Description:
Jalankan `npm run check` dan `npm run build`. Lakukan manual smoke test acceptance SPEC.

Acceptance Criteria:
- [ ] `npm run check` sukses.
- [ ] `npm run build` sukses.

## Handoff Notes

- Pertahankan UI invoice, preview, print, dan PDF bila aman.
- Prioritas: core invoice flow > backup > cleanup > polish.
- Jangan menjalankan migration atau seed.
- Jangan membaca/commit `.env`, `cookies*.txt`, `smoke.jar`.
- Jangan push ke remote kecuali diminta eksplisit.
- Sumber kebenaran: SPEC.md, DECISIONS.md, RISKS.md, PROJECT.md.

---

# Cycle 3 — Dashboard

Lifecycle: `Todo → In Progress → Done` (atau `Blocked`).

Ticket mengikuti SPEC Cycle 3 (F10–F15) dan keputusan D11–D15. TASK-001..012 tetap menjadi riwayat Cycle 2 yang sudah diverifikasi.

## Phase 3 — Dashboard

### TASK-013 — Dashboard route and navigation

- **Priority:** P0
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-012
- **Blocks:** TASK-014, TASK-015, TASK-016, TASK-017

**Description:**
Jadikan `/dashboard` halaman dashboard nyata. Tambahkan item Dashboard pada sidebar dengan tujuan `/dashboard`; pertahankan item Invoices menuju `/dashboard/invoice`. Hapus redirect lama dari dashboard.

**Acceptance Criteria:**
- [x] `/dashboard` dapat dibuka tanpa redirect.
- [x] Sidebar memiliki Dashboard menuju `/dashboard`.
- [x] Invoices tetap menuju `/dashboard/invoice`.
- [x] Tidak ada dead link.

---

### TASK-014 — Dashboard summary and status breakdown

- **Priority:** P0
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-013
- **Blocks:** TASK-017

**Description:**
Tampilkan ringkasan total invoice, unpaid total, paid total, jumlah draft, serta jumlah invoice per status draft/sent/paid/overdue. Semua nilai memakai dataset lokal.

**Acceptance Criteria:**
- [x] Total invoice sesuai jumlah data lokal.
- [x] Unpaid hanya menjumlah invoice yang belum paid.
- [x] Paid hanya menjumlah invoice berstatus paid.
- [x] Jumlah draft sesuai data lokal.
- [x] Breakdown menampilkan draft, sent, paid, dan overdue.
- [x] Tidak ada angka dummy.
- [x] Empty state jelas saat dataset kosong.

---

### TASK-015 — Paid revenue six-month view

- **Priority:** P1
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-014
- **Blocks:** TASK-017

**Description:**
Tampilkan revenue per bulan untuk enam bulan kalender terakhir. Revenue hanya berasal dari invoice berstatus paid; bulan tanpa revenue tetap tampil dengan nilai nol.

**Acceptance Criteria:**
- [x] Menampilkan enam bulan kalender terakhir.
- [x] Invoice paid masuk ke bulan berdasarkan tanggal invoice.
- [x] Invoice draft, sent, dan overdue tidak masuk revenue.
- [x] Bulan tanpa paid invoice tetap tampil.
- [x] Label periode dan nilai terbaca.
- [x] Empty state tampil bila tidak ada revenue paid.
- [x] Tidak ada data dummy.

---

### TASK-016 — Recent invoices and clients

- **Priority:** P1
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-013
- **Blocks:** TASK-017

**Description:**
Tampilkan maksimal delapan invoice terbaru dan maksimal delapan client terbaru. Sediakan informasi inti dan link nyata ke detail/list masing-masing.

**Acceptance Criteria:**
- [x] Invoice terbaru menampilkan nomor, client, tanggal, status, dan total.
- [x] Maksimal delapan invoice ditampilkan.
- [x] Baris invoice membuka halaman detail yang benar.
- [x] Client terbaru menampilkan nama dan kontak bila ada.
- [x] Jumlah invoice per client ditampilkan bila tersedia.
- [x] Maksimal delapan client ditampilkan.
- [x] Link semua invoice menuju `/dashboard/invoice`.
- [x] Link semua client menuju `/dashboard/clients`.
- [x] Empty state tersedia untuk kedua daftar.

---

### TASK-017 — Dashboard quick actions and resilience

- **Priority:** P1
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-014, TASK-015, TASK-016
- **Blocks:** TASK-018

**Description:**
Tambahkan aksi cepat Create Invoice dan Add Client serta pastikan dashboard memiliki loading/hydration/error state, responsive layout, dan keyboard accessibility.

**Acceptance Criteria:**
- [x] Create Invoice membuka alur pembuatan invoice.
- [x] Add Client membuka alur penambahan client.
- [x] Loading/hydration state tidak menampilkan data lokal sebelum siap.
- [x] Error state terlihat bila pembacaan store gagal.
- [x] Layout tidak overflow pada mobile.
- [x] Interaksi dapat dioperasikan dengan keyboard.
- [x] Dashboard tidak melakukan request business API.
- [x] Dashboard tidak mengubah data lokal.

---

### TASK-018 — Dashboard verification

- **Priority:** P0
- **Status:** Done
- **Phase:** 3
- **Depends On:** TASK-017
- **Blocks:** None

**Description:**
Verifikasi dashboard terhadap acceptance test Cycle 3, jalankan test/build/check, dan laporkan gap manual secara jujur.

**Acceptance Criteria:**
- [x] Unit/integration tests relevan berhasil.
- [x] `npm run build` berhasil.
- [x] `npm run check` berhasil atau gap tercatat.
- [x] Manual smoke test dashboard selesai atau gap dilaporkan.
- [x] Tidak ada klaim Done tanpa bukti.

---

## Handoff Notes

- Cycle 2 tickets tetap menjadi sumber riwayat.
- Cycle 3 dashboard mengutamakan data lokal nyata, bukan chart dekoratif.
- Jangan menjalankan migration atau seed.
- Jangan membaca/commit `.env`, `cookies*.txt`, `smoke.jar`.
- Jangan push ke remote kecuali diminta eksplisit.
- Builder mulai dari TASK-013 setelah membaca SPEC Cycle 3.
- Sumber kebenaran: `.hermes/scoper/SPEC.md`, `DECISIONS.md`, `RISKS.md`, `PROJECT.md`.
