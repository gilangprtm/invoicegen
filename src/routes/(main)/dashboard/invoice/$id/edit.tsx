"use client";
import { useEffect, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Save, Send } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type LocalInvoice, type LocalProfile, useInvoiceStore } from "@/stores/invoice-store";

import {
  defaultInvoiceValues,
  getInvoiceDiscount,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTotal,
  type InvoiceFormValues,
} from "../-components/data";
import { InvoiceForm } from "../-components/invoice-form";
import { InvoicePreview } from "../-components/invoice-preview";

function mapInvoiceToFormValues(invoice: LocalInvoice, profile: LocalProfile): InvoiceFormValues {
  const client = useInvoiceStore.getState().clients.find((c) => c.id === invoice.clientId);
  return {
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
    taxId: invoice.taxRate > 0 ? "custom" : "none",
    taxLabel: invoice.taxLabel ?? "VAT",
    taxRate: invoice.taxRate || 0,
    discountType: invoice.discountType ?? "fixed",
    discountValue: invoice.discountValue ?? 0,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
  };
}

export const Route = createFileRoute("/(main)/dashboard/invoice/$id/edit")({ component: InvoiceEditPage });

function InvoiceEditPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [currency, setCurrency] = useState("USD");
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === id));
  const profile = useInvoiceStore((s) => s.profile);
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);

  const form = useForm<InvoiceFormValues>({ defaultValues: defaultInvoiceValues });
  const watch = useWatch({ control: form.control }) as InvoiceFormValues;

  useEffect(() => {
    if (invoice) {
      form.reset(mapInvoiceToFormValues(invoice, profile));
      if (invoice.currency) setCurrency(invoice.currency);
    }
  }, [invoice, profile, form]);

  if (!invoice)
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Invoice Not Found</h1>
        <Button variant="link" onClick={() => navigate({ to: "/dashboard/invoice" })}>
          Back to Invoices
        </Button>
      </div>
    );

  const save = (status: "draft" | "sent") => {
    const values = form.getValues();
    const taxRate = Math.min(Math.max(Number(values.taxRate) || 0, 0), 100);
    updateInvoice(id, {
      number: values.referenceNumber.trim(),
      clientId: values.to.id,
      currency,
      subtotal: getInvoiceSubtotal(values),
      taxRate,
      taxLabel: values.taxLabel,
      discountType: values.discountType,
      discountValue: Math.max(Number(values.discountValue) || 0, 0),
      discountAmount: getInvoiceDiscount(values),
      taxAmount: getInvoiceTax(values),
      total: getInvoiceTotal(values),
      status,
      issuedDate: values.issuedDate,
      dueDate: values.paymentDueDate,
      items: values.items.map((item) => ({
        id: item.id,
        name: item.description,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    });
    toast.success(status === "draft" ? "Invoice saved as draft" : "Invoice updated and marked as sent");
    void navigate({ to: "/dashboard/invoice" });
  };

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
          <Button type="button" variant="outline" onClick={() => save("draft")}>
            <Save data-icon="inline-start" />
            Save as Draft
          </Button>
          <Button type="button" onClick={() => save("sent")}>
            <Send data-icon="inline-start" />
            Save & Send
          </Button>
        </div>
      </div>
      <FormProvider {...form}>
        <form className="grid gap-5 xl:grid-cols-2" noValidate>
          <InvoiceForm currency={currency} onCurrencyChange={setCurrency} />
          <InvoicePreview invoice={watch} />
        </form>
      </FormProvider>
    </div>
  );
}
