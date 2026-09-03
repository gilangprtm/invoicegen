"use client";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";

import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, Download, Pencil, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";

import { renderInvoicePdf } from "./-components/invoice-pdf";

const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  IDR: "id-ID",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};
function formatInvoiceCurrency(amount: number, currency: string) {
  return formatCurrency(amount, { currency, locale: CURRENCY_LOCALE[currency] ?? "en-US" });
}

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

export const Route = createFileRoute("/(main)/dashboard/invoice/$id")({ component: InvoiceDetailPage });

function InvoiceDetailPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { id } = Route.useParams();
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === id));
  const client = useInvoiceStore((s) => s.clients.find((c) => c.id === invoice?.clientId));
  const profile = useInvoiceStore((s) => s.profile);
  const setStatus = useInvoiceStore((s) => s.setStatus);
  const removeInvoice = useInvoiceStore((s) => s.deleteInvoice);
  if (!invoice)
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Not Found</h1>
        <Button variant="link" onClick={() => navigate({ to: "/dashboard/invoice" })}>
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Button>
      </div>
    );

  const changeStatus = (status: "sent" | "paid" | "overdue") => {
    if (setStatus(id, status)) {
      toast.success("Invoice status updated");
      router.invalidate();
    } else toast.error("Invalid invoice status transition");
  };
  const handleDelete = () => {
    if (removeInvoice(id)) {
      toast.success("Invoice deleted");
      void navigate({ to: "/dashboard/invoice" });
    } else toast.error("Only draft invoices can be deleted");
  };
  const handleDownloadPdf = async () => {
    const blob = await renderInvoicePdf(
      {
        referenceNumber: invoice.number,
        issuedDate: invoice.issuedDate,
        paymentDueDate: invoice.dueDate,
        from: {
          name: profile.companyName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          website: profile.website || "",
          addressLines: profile.address ? profile.address.split("\n") : [],
          taxId: profile.taxId || "",
          paymentAccountName: profile.paymentAccountName || "",
          routingNumber: profile.routingNumber || "",
          issuerName: profile.issuerName || "",
          logoUrl: profile.logoUrl || "",
        },
        to: {
          id: client?.id ?? "",
          name: client?.name ?? "",
          email: client?.email ?? "",
          addressLines: client?.address ? [client.address] : [],
          taxId: "",
        },
        taxId: invoice.taxRate ? "custom" : "none",
        taxLabel: invoice.taxLabel || "Tax",
        taxRate: invoice.taxRate,
        discountType: invoice.discountType ?? "fixed",
        discountValue: invoice.discountValue ?? 0,
        items: invoice.items.map((item) => ({
          id: item.id,
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      },
      invoice.currency,
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.number}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Details</h1>
          <p className="text-muted-foreground text-sm">{invoice.number}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <ActionBar
        invoice={invoice}
        onStatusChange={changeStatus}
        onDelete={handleDelete}
        onEdit={() => navigate({ to: `/dashboard/invoice/${id}/edit` })}
        onDownloadPdf={handleDownloadPdf}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
                  <p className="font-medium">{formatDateSafe(invoice.paidAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceCurrency(item.price, invoice.currency)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatInvoiceCurrency(item.total, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatInvoiceCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                      <span className="font-medium">{formatInvoiceCurrency(invoice.taxAmount, invoice.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium text-lg">Total</span>
                    <span className="font-semibold text-lg">
                      {formatInvoiceCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.note && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-medium text-lg">Notes</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{invoice.note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 font-medium text-lg">Bill To</h3>
              {client ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{client.name}</p>
                  {client.email && <p className="text-muted-foreground">{client.email}</p>}
                  {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                  {client.address && <p className="whitespace-pre-wrap text-muted-foreground">{client.address}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No client assigned</p>
              )}
            </CardContent>
          </Card>
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
                  <span>{formatDateSafe(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDateSafe(invoice.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type ActionBarProps = {
  invoice: ReturnType<typeof useInvoiceStore.getState>["invoices"][number];
  onStatusChange: (status: "sent" | "paid" | "overdue") => void;
  onDelete: () => void;
  onEdit: () => void;
  onDownloadPdf: () => void;
};
function ActionBar({ invoice, onStatusChange, onDelete, onEdit, onDownloadPdf }: ActionBarProps) {
  const navigate = useNavigate();
  const { status } = invoice;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => navigate({ to: "/dashboard/invoice" })}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
      <div className="flex-1" />
      {status === "draft" && (
        <>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button onClick={() => onStatusChange("sent")}>
            <Send className="size-4" />
            Mark as Sent
          </Button>
        </>
      )}
      {status === "sent" && (
        <>
          <Button onClick={() => onStatusChange("paid")}>
            <CheckCircle2 className="size-4" />
            Mark as Paid
          </Button>
          <Button variant="outline" onClick={() => onStatusChange("overdue")}>
            <XCircle className="size-4" />
            Mark as Overdue
          </Button>
          <Button variant="outline" onClick={onDownloadPdf}>
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}
      {status === "paid" && (
        <Button variant="outline" onClick={onDownloadPdf}>
          <Download className="size-4" />
          Download PDF
        </Button>
      )}
      {status === "overdue" && (
        <>
          <Button onClick={() => onStatusChange("paid")}>
            <CheckCircle2 className="size-4" />
            Mark as Paid
          </Button>
          <Button variant="outline" onClick={onDownloadPdf}>
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}
    </div>
  );
}

function formatDateSafe(dateStr: string | Date): string {
  try {
    if (dateStr instanceof Date) return format(dateStr, "MMM d, yyyy");
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return String(dateStr);
  }
}
