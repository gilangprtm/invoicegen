import { Separator } from "@/components/ui/separator";

import { ClientSelector } from "./client-selector";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";

export function InvoiceForm({
  currency,
  onCurrencyChange,
  showClientError,
  showItemsError,
}: {
  currency: string;
  onCurrencyChange: (v: string) => void;
  showClientError?: boolean;
  showItemsError?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <InvoiceDetails />

      <Separator />

      <ClientSelector showError={showClientError} />

      <Separator />

      <InvoiceItems currency={currency} onCurrencyChange={onCurrencyChange} showError={showItemsError} />

      <Separator />

      <InvoiceAdjustments />
    </div>
  );
}
