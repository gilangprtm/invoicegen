"use client";

import { useEffect, useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ArrowRight, FilePlus2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { type InvoiceStatus, normalizeStatus } from "@/lib/local-store-utils";
import { formatCurrency } from "@/lib/utils";
import { type LocalInvoice, useInvoiceStore } from "@/stores/invoice-store";

export const Route = createFileRoute("/(main)/dashboard/")({
  component: DashboardPage,
});

const statuses: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];
const statusLabel: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};
const statusClass: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function monthKey(date: string) {
  return date.slice(0, 7);
}

function getRecentMonths() {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    };
  });
}

function getDisplayStatus(invoice: LocalInvoice, today: Date): InvoiceStatus {
  return normalizeStatus(invoice.status, invoice.dueDate, today);
}

function DashboardPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const invoices = useInvoiceStore((state) => state.invoices);
  const clients = useInvoiceStore((state) => state.clients);
  const preferences = useInvoiceStore((state) => state.preferences);

  useEffect(() => {
    let active = true;
    const rehydratePromise = useInvoiceStore.persist.rehydrate();
    void Promise.resolve(rehydratePromise)
      .then(() => {
        if (active) setMounted(true);
      })
      .catch((error: unknown) => {
        if (active) {
          setStoreError(error instanceof Error ? error.message : "Local storage is unavailable.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (storeError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Empty className="max-w-lg border">
          <EmptyTitle>Dashboard is unavailable</EmptyTitle>
          <EmptyDescription>{storeError}</EmptyDescription>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </Empty>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }
  const currency = preferences.currency || "IDR";
  const recentMonths = getRecentMonths();
  const today = new Date();
  const invoiceRows = invoices.map((invoice) => ({ invoice, status: getDisplayStatus(invoice, today) }));
  const paidInvoices = invoiceRows.filter(({ status }) => status === "paid");
  const paidTotal = paidInvoices.reduce((sum, { invoice }) => sum + invoice.total, 0);
  const unpaidTotal = invoiceRows
    .filter(({ status }) => status !== "paid")
    .reduce((sum, { invoice }) => sum + invoice.total, 0);
  const statusCounts = statuses.reduce<Record<InvoiceStatus, number>>(
    (result, status) => {
      result[status] = invoiceRows.filter((row) => row.status === status).length;
      return result;
    },
    { draft: 0, sent: 0, paid: 0, overdue: 0 },
  );
  const revenue = recentMonths.map((month) => ({
    ...month,
    total: paidInvoices
      .filter(({ invoice }) => monthKey(invoice.issuedDate) === month.key)
      .reduce((sum, { invoice }) => sum + invoice.total, 0),
  }));
  const maxRevenue = Math.max(...revenue.map((month) => month.total), 1);
  const recentInvoices = [...invoices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  const recentClients = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const clientInvoiceCounts = invoices.reduce<Record<string, number>>((result, invoice) => {
    result[invoice.clientId] = (result[invoice.clientId] || 0) + 1;
    return result;
  }, {});
  const isEmpty = invoices.length === 0 && clients.length === 0;

  if (isEmpty) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Empty className="max-w-lg border">
          <EmptyTitle>Start with your first invoice</EmptyTitle>
          <EmptyDescription>
            Your invoice and client data stays on this device. Create an invoice to see activity here.
          </EmptyDescription>
          <Button onClick={() => navigate({ to: "/dashboard/invoice/new" })}>
            <FilePlus2 data-icon="inline-start" />
            Create Invoice
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">A quick view of your local invoice activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/dashboard/clients/new" })}>
            <UsersRound data-icon="inline-start" />
            Add Client
          </Button>
          <Button onClick={() => navigate({ to: "/dashboard/invoice/new" })}>
            <FilePlus2 data-icon="inline-start" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total invoices" value={String(invoices.length)} detail="All local invoices" />
        <SummaryCard
          label="Unpaid"
          value={formatCurrency(unpaidTotal, { currency })}
          detail="Draft, sent, and overdue"
        />
        <SummaryCard label="Paid" value={formatCurrency(paidTotal, { currency })} detail="Paid invoices only" />
        <SummaryCard label="Draft invoices" value={String(statusCounts.draft)} detail="Not sent yet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Paid revenue</CardTitle>
            <CardDescription>Six recent calendar months. Only paid invoices count.</CardDescription>
          </CardHeader>
          <CardContent>
            {paidTotal === 0 ? (
              <Empty className="min-h-48 border">
                <EmptyTitle>No paid revenue yet</EmptyTitle>
                <EmptyDescription>Revenue appears after an invoice is marked paid.</EmptyDescription>
              </Empty>
            ) : (
              <div className="flex h-56 items-end gap-3">
                {revenue.map((month) => (
                  <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span
                      className="truncate text-muted-foreground text-xs"
                      title={formatCurrency(month.total, { currency })}
                    >
                      {month.total > 0 ? formatCurrency(month.total, { currency, noDecimals: true }) : "0"}
                    </span>
                    <div className="flex h-36 w-full items-end rounded-md bg-muted/50">
                      <div
                        className="w-full rounded-md bg-primary transition-[height]"
                        style={{ height: `${Math.max((month.total / maxRevenue) * 100, month.total > 0 ? 8 : 0)}%` }}
                        title={`${month.label}: ${formatCurrency(month.total, { currency })}`}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">{month.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice status</CardTitle>
            <CardDescription>Current status across local invoices.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {statuses.map((status) => (
              <Link
                key={status}
                to="/dashboard/invoice"
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusClass[status]}>
                    {statusLabel[status]}
                  </Badge>
                </span>
                <span className="font-semibold">{statusCounts[status]}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentInvoices invoices={recentInvoices} clients={clients} today={today} />
        <RecentClients clients={recentClients} counts={clientInvoiceCounts} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{detail}</CardContent>
    </Card>
  );
}

function RecentInvoices({
  invoices,
  clients,
  today,
}: {
  invoices: LocalInvoice[];
  clients: ReturnType<typeof useInvoiceStore.getState>["clients"];
  today: Date;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Recent invoices</CardTitle>
          <CardDescription>Latest local invoice activity.</CardDescription>
        </div>
        <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/dashboard/invoice" />}>
          View all <ArrowRight data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <Empty className="border">
            <EmptyTitle>No invoices</EmptyTitle>
            <EmptyDescription>Create an invoice to populate this list.</EmptyDescription>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y">
            {invoices.map((invoice) => {
              const client = clients.find((item) => item.id === invoice.clientId);
              const status = getDisplayStatus(invoice, today);
              return (
                <Link
                  key={invoice.id}
                  to="/dashboard/invoice/$id"
                  params={{ id: invoice.id }}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invoice.number}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {client?.name || "No client"} · {invoice.issuedDate}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-medium text-sm">
                      {formatCurrency(invoice.total, { currency: invoice.currency })}
                    </span>
                    <Badge variant="secondary" className={statusClass[status]}>
                      {statusLabel[status]}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentClients({
  clients,
  counts,
}: {
  clients: ReturnType<typeof useInvoiceStore.getState>["clients"];
  counts: Record<string, number>;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Recent clients</CardTitle>
          <CardDescription>Clients saved on this device.</CardDescription>
        </div>
        <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/dashboard/clients" />}>
          View all <ArrowRight data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <Empty className="border">
            <EmptyTitle>No clients</EmptyTitle>
            <EmptyDescription>Add a client before creating an invoice.</EmptyDescription>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y">
            {clients.map((client) => (
              <Link
                key={client.id}
                to="/dashboard/clients/$id/edit"
                params={{ id: client.id }}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{client.name}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {client.email || client.phone || "No contact details"}
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {counts[client.id] || 0} invoice{counts[client.id] === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
