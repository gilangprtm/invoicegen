"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";

import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, Download, Pencil, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceWithItems } from "@/server/invoices";
import { deleteInvoice, getInvoice, updateInvoice } from "@/server/invoices";

// ─── Currency locale map ───

const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  IDR: "id-ID",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};

function formatInvoiceCurrency(amount: number, currency: string) {
  return formatCurrency(amount, {
    currency,
    locale: CURRENCY_LOCALE[currency] ?? "en-US",
  });
}

// ─── Status badge ───

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  paid: "default",
  overdue: "destructive",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "",
};

function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? "secondary";
  const cls = STATUS_CLASS[status] ?? "";
  return (
    <Badge variant={variant} className={cls}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ─── Route definition ───

export const Route = createFileRoute("/(main)/dashboard/invoice/$id")({
  component: InvoiceDetailPage,
});

// ─── Main component ───

function InvoiceDetailPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice({ data: { id } }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: "sent" | "paid" | "overdue") => updateInvoice({ data: { id, status: newStatus } }),
    onSuccess: () => {
      toast.success("Invoice status updated");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice({ data: { id } }),
    onSuccess: async () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.invalidate();
      await navigate({ to: "/dashboard/invoice" });
    },
    onError: (err) => {
      toast.error("Failed to delete invoice", { description: err.message });
    },
  });

  // ─── Loading state ───

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Details</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Not found ───

  if (isError || !invoice) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Not Found</h1>
        </div>
        <Button variant="link" onClick={() => navigate({ to: "/dashboard/invoice" })}>
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Details</h1>
          <p className="text-muted-foreground text-sm">{invoice.number}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        invoice={invoice}
        onStatusChange={(s) => statusMutation.mutate(s)}
        onDelete={() => deleteMutation.mutate()}
        onEdit={() => navigate({ to: `/dashboard/invoice/${id}/edit` })}
        statusPending={statusMutation.isPending}
        deletePending={deleteMutation.isPending}
      />

      {/* Invoice Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Invoice meta */}
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Invoice Number</p>
                <p className="font-medium">{invoice.number}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Currency</p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Issue Date</p>
                <p className="font-medium">{formatDateSafe(invoice.issuedDate)}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Due Date</p>
                <p className="font-medium">{formatDateSafe(invoice.dueDate)}</p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Paid At</p>
                  <p className="font-medium">{formatDateSafe(invoice.paidAt as unknown as string)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-medium text-lg">Line Items</h3>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20 text-center">Qty</TableHead>
                      <TableHead className="w-32 text-right">Unit Price</TableHead>
                      <TableHead className="w-32 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No line items
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{Number(item.quantity)}</TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceCurrency(Number(item.price), invoice.currency)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatInvoiceCurrency(Number(item.total), invoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatInvoiceCurrency(Number(invoice.subtotal), invoice.currency)}
                    </span>
                  </div>
                  {Number(invoice.taxRate) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                      <span className="font-medium">
                        {formatInvoiceCurrency(Number(invoice.taxAmount), invoice.currency)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium text-lg">Total</span>
                    <span className="font-semibold text-lg">
                      {formatInvoiceCurrency(Number(invoice.total), invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.note && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-medium text-lg">Notes</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{invoice.note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Bill To */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 font-medium text-lg">Bill To</h3>
              {invoice.client ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoice.client.name}</p>
                  {invoice.client.email && <p className="text-muted-foreground">{invoice.client.email}</p>}
                  {invoice.client.phone && <p className="text-muted-foreground">{invoice.client.phone}</p>}
                  {invoice.client.address && (
                    <p className="whitespace-pre-wrap text-muted-foreground">{invoice.client.address}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No client assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 font-medium text-lg">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDateSafe(invoice.createdAt as unknown as string)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDateSafe(invoice.updatedAt as unknown as string)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Action Bar ───

type ActionBarProps = {
  invoice: InvoiceWithItems;
  onStatusChange: (status: "sent" | "paid" | "overdue") => void;
  onDelete: () => void;
  onEdit: () => void;
  statusPending: boolean;
  deletePending: boolean;
};

function ActionBar({ invoice, onStatusChange, onDelete, onEdit, statusPending, deletePending }: ActionBarProps) {
  const navigate = useNavigate();
  const { status } = invoice;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Back */}
      <Button variant="outline" onClick={() => navigate({ to: "/dashboard/invoice" })}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="flex-1" />

      {/* Draft actions */}
      {status === "draft" && (
        <>
          <Button variant="outline" disabled={statusPending} onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="outline" disabled={deletePending}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete invoice {invoice.number}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button disabled={statusPending} onClick={() => onStatusChange("sent")}>
            <Send className="size-4" />
            Mark as Sent
          </Button>
        </>
      )}

      {/* Sent actions */}
      {status === "sent" && (
        <>
          <Button disabled={statusPending} onClick={() => onStatusChange("paid")}>
            <CheckCircle2 className="size-4" />
            Mark as Paid
          </Button>
          <Button variant="outline" disabled={statusPending} onClick={() => onStatusChange("overdue")}>
            <XCircle className="size-4" />
            Mark as Overdue
          </Button>
          <Button variant="outline">
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}

      {/* Paid actions */}
      {status === "paid" && (
        <Button variant="outline">
          <Download className="size-4" />
          Download PDF
        </Button>
      )}

      {/* Overdue actions */}
      {status === "overdue" && (
        <>
          <Button disabled={statusPending} onClick={() => onStatusChange("paid")}>
            <CheckCircle2 className="size-4" />
            Mark as Paid
          </Button>
          <Button variant="outline">
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Helpers ───

function formatDateSafe(dateStr: string | Date): string {
  try {
    if (dateStr instanceof Date) {
      return format(dateStr, "MMM d, yyyy");
    }
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return String(dateStr);
  }
}
