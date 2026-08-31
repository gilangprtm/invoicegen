"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Save, Send } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceWithItems, UpdateInvoiceInput } from "@/server/invoices";
import { getInvoice, updateInvoice } from "@/server/invoices";

import {
  defaultInvoiceValues,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTotal,
  type InvoiceFormValues,
  invoiceTaxOptions,
} from "../-components/data";
import { InvoiceForm } from "../-components/invoice-form";
import { InvoicePreview } from "../-components/invoice-preview";

function mapInvoiceToFormValues(invoice: InvoiceWithItems): InvoiceFormValues {
  return {
    referenceNumber: invoice.number,
    issuedDate: invoice.issuedDate,
    paymentDueDate: invoice.dueDate,
    from: {
      name: "",
      email: "",
      phone: "",
      website: "",
      addressLines: [],
      taxId: "",
      paymentAccountName: "",
      routingNumber: "",
      issuerName: "",
      logoUrl: "",
    },
    to: {
      id: invoice.client?.id ?? "",
      name: invoice.client?.name ?? "",
      email: invoice.client?.email ?? "",
      addressLines: invoice.client?.address ? [invoice.client.address] : [],
      taxId: "",
    },
    taxId: invoice.taxAmount !== "0" ? "vat" : "none",
    discountType: "fixed",
    discountValue: 0,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
    })),
  };
}

function mapFormValuesToUpdateInput(
  values: InvoiceFormValues,
  status: "draft" | "sent" | "paid" | "overdue",
  currency: string,
): UpdateInvoiceInput {
  const subtotal = getInvoiceSubtotal(values);
  const tax = getInvoiceTax(values);
  const total = getInvoiceTotal(values);
  const taxOption = invoiceTaxOptions.find((t) => t.id === values.taxId);

  return {
    id: "",
    clientId: values.to.id,
    currency,
    subtotal: String(subtotal),
    taxRate: String(taxOption?.rate ?? 0),
    taxAmount: String(tax),
    total: String(total),
    status,
    note: null,
    issuedDate: values.issuedDate,
    dueDate: values.paymentDueDate,
    items: values.items.map((item) => ({
      name: item.description,
      quantity: String(item.quantity),
      price: String(item.unitPrice),
      total: String(item.quantity * item.unitPrice),
    })),
  };
}

export const Route = createFileRoute("/(main)/dashboard/invoice/$id/edit")({
  component: InvoiceEditPage,
});

function InvoiceEditPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [currency, setCurrency] = useState("USD");

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice({ data: { id } }),
  });

  const form = useForm<InvoiceFormValues>({
    defaultValues: defaultInvoiceValues,
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  // Populate form when data loads
  useEffect(() => {
    if (invoiceData && !isLoading) {
      form.reset(mapInvoiceToFormValues(invoiceData));
      if (invoiceData.currency) setCurrency(invoiceData.currency);
    }
  }, [invoiceData, isLoading, form]);

  const updateMutation = useMutation({
    mutationFn: async ({
      values,
      status,
    }: {
      values: InvoiceFormValues;
      status: "draft" | "sent" | "paid" | "overdue";
    }) => {
      const input = mapFormValuesToUpdateInput(values, status, currency);
      input.id = id;
      return updateInvoice({ data: input });
    },
    onSuccess: async () => {
      toast.success("Invoice updated");
      await navigate({ to: "/dashboard/invoice" });
    },
    onError: (err) => {
      toast.error("Failed to update invoice", { description: err.message });
    },
  });

  const handleSaveDraft = () => {
    const values = form.getValues();
    updateMutation.mutate({ values, status: "draft" });
  };

  const handleSendInvoice = () => {
    const values = form.getValues();
    updateMutation.mutate({ values, status: "sent" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Edit Invoice</h1>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Not Found</h1>
        </div>
        <Button variant="link" onClick={() => navigate({ to: "/dashboard/invoice" })}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground text-sm">Update invoice details and review the preview.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Field className="w-28 gap-1">
            <FieldLabel className="text-xs">Currency</FieldLabel>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="IDR">IDR</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={handleSaveDraft}>
            <Save data-icon="inline-start" />
            Save as Draft
          </Button>
          <Button type="button" disabled={updateMutation.isPending} onClick={handleSendInvoice}>
            <Send data-icon="inline-start" />
            {updateMutation.isPending ? "Saving..." : "Save & Send"}
          </Button>
        </div>
      </div>

      <FormProvider {...form}>
        <form className="grid gap-5 xl:grid-cols-2" noValidate>
          <InvoiceForm currency={currency} onCurrencyChange={setCurrency} />
          <InvoicePreview invoice={invoice} />
        </form>
      </FormProvider>
    </div>
  );
}
