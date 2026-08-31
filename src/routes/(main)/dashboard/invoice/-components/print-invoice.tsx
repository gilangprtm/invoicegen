import * as React from "react";

import { createPortal } from "react-dom";

import type { InvoiceFormValues } from "./data";
import { InvoicePaper } from "./invoice-paper";

interface PrintInvoiceProps {
  invoice: InvoiceFormValues;
  currency?: string;
}

export function PrintInvoice({ invoice, currency = "USD" }: PrintInvoiceProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div data-print-root>
      <InvoicePaper invoice={invoice} currency={currency} />
    </div>,
    document.body,
  );
}
