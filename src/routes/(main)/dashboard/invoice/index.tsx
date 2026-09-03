"use client";
import { useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeStatus } from "@/lib/local-store-utils";
import { formatCurrency } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";
export const Route = createFileRoute("/(main)/dashboard/invoice/")({ component: InvoiceListPage });
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];
const statusBadgeClass: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "",
};
function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={statusBadgeClass[status] ?? ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
function InvoiceListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const invoices = useInvoiceStore((s) => s.invoices);
  const removeInvoice = useInvoiceStore((s) => s.deleteInvoice);
  const clients = useInvoiceStore((s) => s.clients);
  const now = new Date();
  const sorted = [...invoices].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const filtered = sorted.filter(
    (inv) =>
      !statusFilter || normalizeStatus(inv.status, inv.dueDate, now) === statusFilter || inv.status === statusFilter,
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">Stored only on this device</p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard/invoice/new" })}>
          <Plus data-icon="inline-start" />
          Create Invoice
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
          <SelectTrigger className="w-40" size="sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  No invoices found.{" "}
                  <Link to="/dashboard/invoice/new" className="text-primary underline">
                    Create your first invoice
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.number}</TableCell>
                    <TableCell>{client?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.total, { currency: inv.currency })}
                    </TableCell>
                    <TableCell>{inv.currency}</TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>{inv.issuedDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigate({ to: `/dashboard/invoice/${inv.id}` })}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigate({ to: `/dashboard/invoice/${inv.id}/edit` })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {inv.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              if (removeInvoice(inv.id)) toast.success("Invoice deleted");
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
