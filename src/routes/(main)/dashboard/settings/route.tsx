"use client";
import { useRef } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadJson, parseBackup, validateBackup } from "@/lib/local-store-utils";
import { type defaultLocalProfile, useInvoiceStore } from "@/stores/invoice-store";

const MAX_LOGO_BYTES = 512 * 1024;

function readLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error("Logo must be smaller than 512 KB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}
export const Route = createFileRoute("/(main)/dashboard/settings")({ component: SettingsPage });
function SettingsPage() {
  const profile = useInvoiceStore((s) => s.profile);
  const setProfile = useInvoiceStore((s) => s.setProfile);
  const replaceAll = useInvoiceStore((s) => s.replaceAll);
  const clients = useInvoiceStore((s) => s.clients);
  const invoices = useInvoiceStore((s) => s.invoices);
  const preferences = useInvoiceStore((s) => s.preferences);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const update = (key: keyof typeof defaultLocalProfile, value: string) => setProfile({ [key]: value });
  const exportData = () => {
    downloadJson("invoicegen-backup.json", { version: 1, profile, clients, invoices, preferences });
    toast.success("Backup exported");
  };
  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseBackup(String(reader.result));
        if (!validateBackup(data)) throw new Error("Invalid backup format");
        const backup = data as unknown as {
          profile?: typeof profile;
          clients?: typeof clients;
          invoices?: typeof invoices;
          preferences?: typeof preferences;
        };
        if (!window.confirm("Replace local data with this backup?")) return;
        replaceAll(backup);
        toast.success("Backup imported");
      } catch (error) {
        toast.error("Import failed", { description: error instanceof Error ? error.message : "Invalid JSON" });
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Data stays on this device. Export backup before clearing browser data or moving devices.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>Shown on invoices and PDF output.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Company profile saved");
            }}
          >
            {(
              [
                ["companyName", "Company Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["website", "Website"],
                ["taxId", "Tax ID"],
                ["paymentAccountName", "Payment Account Name"],
                ["routingNumber", "Routing / Account No."],
                ["issuerName", "Issuer Name"],
              ] as const
            ).map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input id={key} value={profile[key]} onChange={(e) => update(key, e.target.value)} />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => update("address", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <div>
                <Label>Company Logo</Label>
                <p className="text-muted-foreground text-xs">
                  PNG, JPG, SVG, or WebP. Maximum 512 KB. Used on invoice preview, print, and PDF.
                </p>
              </div>
              {profile.logoUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={profile.logoUrl}
                    alt="Company logo preview"
                    className="size-16 rounded-md border bg-muted object-contain p-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setProfile({ logoUrl: "" })}>
                    <Trash2 data-icon="inline-start" />
                    Remove Logo
                  </Button>
                </div>
              )}
              <input
                ref={logoFileRef}
                id="company-logo"
                aria-label="Upload company logo"
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setProfile({ logoUrl: await readLogoFile(file) });
                    toast.success("Company logo updated");
                  } catch (error) {
                    toast.error("Logo upload failed", {
                      description: error instanceof Error ? error.message : "Invalid image",
                    });
                  }
                  e.currentTarget.value = "";
                }}
              />
              <Button type="button" variant="outline" onClick={() => logoFileRef.current?.click()}>
                <Upload data-icon="inline-start" />
                Upload Logo
              </Button>
            </div>
            <Button type="submit">Save Company Profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>JSON backup is official portability path for local-only data.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button type="button" onClick={exportData}>
            Export JSON
          </Button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
