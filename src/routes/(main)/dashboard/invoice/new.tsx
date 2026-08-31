"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Loader2, Send, Settings } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateInvoiceInput } from "@/server/invoices";
import { createInvoice } from "@/server/invoices";
import { getProfile } from "@/server/profile";

import {
  defaultInvoiceValues,
  getDefaultValues,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTotal,
  type InvoiceFormValues,
  invoiceTaxOptions,
} from "./-components/data";
import { InvoiceForm } from "./-components/invoice-form";
import { InvoicePreview } from "./-components/invoice-preview";

function mapFormValuesToCreateInput(values: InvoiceFormValues, currency: string): CreateInvoiceInput {
  const subtotal = getInvoiceSubtotal(values);
  const tax = getInvoiceTax(values);
  const total = getInvoiceTotal(values);
  const taxOption = invoiceTaxOptions.find((t) => t.id === values.taxId);

  return {
    clientId: values.to.id,
    currency,
    subtotal: String(subtotal),
    taxRate: String(taxOption?.rate ?? 0),
    taxAmount: String(tax),
    total: String(total),
    status: "sent",
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

export const Route = createFileRoute("/(main)/dashboard/invoice/new")({
  component: InvoiceCreatePage,
});

function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("IDR");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getProfile(),
  });

  const defaults = profile ? getDefaultValues(profile) : defaultInvoiceValues;

  const form = useForm<InvoiceFormValues>({
    defaultValues: defaults,
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  const createMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const input = mapFormValuesToCreateInput(values, currency);
      return createInvoice({ data: input });
    },
    onSuccess: async (result) => {
      toast.success("Invoice created", {
        description: `Invoice ${result.number} has been created.`,
      });
      await navigate({ to: "/dashboard/invoice" });
    },
    onError: (err) => {
      toast.error("Failed to create invoice", { description: err.message });
    },
  });

  const hasCompany = profile && (profile.companyName || profile.email);
  const hasClient = invoice.to?.id && invoice.to.id.length > 0;
  const hasValidItems = invoice.items?.some((item) => item.description && item.quantity > 0 && item.unitPrice > 0);
  const canSend = hasClient && hasValidItems && !createMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <div className="flex min-h-[60vh] items-start justify-center pt-20">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Company Profile Required</CardTitle>
            <CardDescription>
              You need to set up your company profile before creating invoices. This information appears on your
              invoices as the sender.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">Go to Settings → Company to fill in your business details.</p>
            <Link to="/dashboard/settings">
              <Button>
                <Settings className="mr-2 size-4" />
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendInvoice = () => {
    const values = form.getValues();
    createMutation.mutate(values);
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
            {createMutation.isPending ? "Sending..." : "Send Invoice"}
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
