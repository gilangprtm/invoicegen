import { createFileRoute, Link } from "@tanstack/react-router";

import { FileText, HardDriveDownload, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

const features = [
  {
    icon: FileText,
    title: "Kelola invoice",
    description: "Buat, kirim, dan pantau status invoice dari satu daftar.",
  },
  {
    icon: UsersRound,
    title: "Kelola klien",
    description: "Simpan data kontak klien agar invoice selalu tertuju dengan benar.",
  },
  {
    icon: HardDriveDownload,
    title: "Unduh PDF",
    description: "Simpan atau cetak invoice sebagai PDF langsung dari aplikasi.",
  },
];

function LandingPage() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div aria-hidden className="landing-dot-grid pointer-events-none absolute inset-0 -z-10" />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <Badge variant="secondary">Aplikasi invoice lokal</Badge>
        <h1 className="mt-4 font-semibold text-4xl tracking-tight">InvoiceGen</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Buat, kelola, dan unduh invoice dari satu workspace lokal.
        </p>
        <p className="mt-2 max-w-xl text-muted-foreground text-sm">
          Data invoice dan klien tetap tersimpan di browser Anda.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button nativeButton={false} size="lg" render={<Link to="/dashboard">Buka dashboard</Link>} />
          <Button
            nativeButton={false}
            size="lg"
            variant="outline"
            render={<Link to="/dashboard/invoice">Lihat daftar invoice</Link>}
          />
        </div>
        <section aria-label="Fitur utama" className="mt-12 grid w-full gap-4 text-left sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-card p-5">
              <feature.icon aria-hidden className="size-5 text-foreground" />
              <h2 className="mt-3 font-medium text-base">{feature.title}</h2>
              <p className="mt-1 text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
