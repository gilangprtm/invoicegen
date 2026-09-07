"use client";

import { useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Send } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/stores/invoice-store";

import {
  getDefaultValues,
  getInvoiceDiscount,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTotal,
  type InvoiceFormValues,
} from "./-components/data";
import { InvoiceForm } from "./-components/invoice-form";
import { InvoicePreview } from "./-components/invoice-preview";

export const Route = createFileRoute("/(main)/dashboard/invoice/new")({
  component: InvoiceCreatePage,
});

function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("IDR");

  const profile = useInvoiceStore((state) => state.profile);
  const clients = useInvoiceStore((state) => state.clients);
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const defaults = getDefaultValues(profile);

  const form = useForm<InvoiceFormValues>({
    defaultValues: defaults,
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  const saveInvoice = (values: InvoiceFormValues) => {
    const subtotal = getInvoiceSubtotal(values);
    const taxAmount = getInvoiceTax(values);
    const client = clients.find((item) => item.id === values.to.id);
    addInvoice({
      number: values.referenceNumber.trim(),
      clientId: values.to.id,
      currency,
      subtotal,
      taxRate: Math.min(Math.max(values.taxRate, 0), 100),
      taxLabel: values.taxLabel,
      discountType: values.discountType,
      discountValue: Math.max(values.discountValue || 0, 0),
      discountAmount: getInvoiceDiscount(values),
      taxAmount,
      total: getInvoiceTotal(values),
      status: "sent",
      note: "",
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
    toast.success("Invoice created", { description: `Invoice for ${client?.name ?? values.to.name} saved locally.` });
    void navigate({ to: "/dashboard/invoice" });
  };

  const hasCompany = profile && (profile.companyName || profile.email);
  const hasClient = invoice.to.id && invoice.to.id.length > 0;
  const hasValidItems = invoice.items.some((item) => item.description && item.quantity > 0 && item.unitPrice > 0);
  const canSend = Boolean(hasClient && hasValidItems);

  if (!hasCompany) {
    toast.info("Company profile is incomplete", { id: "profile-guidance" });
  }

  const handleSendInvoice = () => {
    const values = form.getValues();
    saveInvoice(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link to="/dashboard/invoice" className="transition-colors hover:text-foreground">
              Invoices
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Create New Invoice</span>
          </nav>
          <h1 className="font-medium text-3xl leading-none tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground text-sm">
            Add invoice details, review the preview, and send it to your client.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!canSend} onClick={handleSendInvoice}>
            <Send data-icon="inline-start" />
            Send Invoice
          </Button>
        </div>
      </div>

      <FormProvider {...form}>
        <form className="grid gap-5 xl:grid-cols-2" noValidate>
          <InvoiceForm
            currency={currency}
            onCurrencyChange={setCurrency}
            showClientError={!hasClient}
            showItemsError={!hasValidItems}
          />
          <InvoicePreview invoice={invoice} currency={currency} />
        </form>
      </FormProvider>
    </div>
  );
}
