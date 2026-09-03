---

# Cycle 3 — Dashboard

Tanggal: 2026-08-31

Status: In Progress

Prioritas: dashboard > verifikasi check/build.

## Overview

Dashboard level 3 untuk InvoiceGen. Semua angka dihitung dari local store (profile, clients, invoices). Tidak ada data dummy, tidak ada backend, tidak ada analytics eksternal.

## Handoff Boundary

Scoper mendefinisikan WHAT. Builder memilih HOW yang paling sederhana, selama acceptance criteria terpenuhi.

## Safety Boundary

Jangan membaca atau commit `.env`, `cookies*.txt`, `smoke.jar`, atau secret/data user. Jangan menjalankan migration, seed, atau deployment dari task implementasi.
