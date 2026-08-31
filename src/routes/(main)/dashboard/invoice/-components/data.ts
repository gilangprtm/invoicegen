import { addDays, format } from "date-fns";

import type { UserProfile } from "@/server/profile";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTaxOption {
  id: string;
  name: string;
  rate: number;
}

export type InvoiceDiscountType = "fixed" | "percent";

export const INVOICE_PAPER_WIDTH = 816;
export const INVOICE_PAPER_HEIGHT = 1056;
export const INVOICE_PAPER_SCALE = 0.6;

export interface InvoiceFromDetails {
  name: string;
  email: string;
  phone: string;
  website: string;
  addressLines: string[];
  taxId: string;
  paymentAccountName: string;
  routingNumber: string;
  issuerName: string;
  logoUrl: string;
}

export interface InvoiceToDetails {
  id: string;
  name: string;
  email: string;
  addressLines: string[];
  taxId: string;
}

export interface InvoiceFormValues {
  referenceNumber: string;
  issuedDate: string;
  paymentDueDate: string;
  from: InvoiceFromDetails;
  to: InvoiceToDetails;
  taxId: string;
  discountType: InvoiceDiscountType;
  discountValue: number;
  items: InvoiceLineItem[];
}

function buildFromFromProfile(profile: UserProfile | null): InvoiceFromDetails {
  return {
    name: profile?.companyName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    website: profile?.website || "",
    addressLines: profile?.address ? profile.address.split("\n") : [],
    taxId: profile?.taxId || "",
    paymentAccountName: profile?.paymentAccountName || "",
    routingNumber: profile?.routingNumber || "",
    issuerName: profile?.issuerName || "",
    logoUrl: profile?.logoUrl || "",
  };
}

export function getDefaultValues(profile: UserProfile | null): InvoiceFormValues {
  const today = new Date();

  return {
    referenceNumber: "",
    issuedDate: format(today, "yyyy-MM-dd"),
    paymentDueDate: format(addDays(today, 14), "yyyy-MM-dd"),
    from: buildFromFromProfile(profile),
    to: {
      id: "",
      name: "",
      email: "",
      addressLines: [],
      taxId: "",
    },
    taxId: "vat",
    discountType: "fixed",
    discountValue: 0,
    items: [],
  };
}

export const defaultInvoiceValues: InvoiceFormValues = {
  referenceNumber: "",
  issuedDate: format(new Date(), "yyyy-MM-dd"),
  paymentDueDate: format(addDays(new Date(), 14), "yyyy-MM-dd"),
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
    id: "",
    name: "",
    email: "",
    addressLines: [],
    taxId: "",
  },
  taxId: "vat",
  discountType: "fixed",
  discountValue: 0,
  items: [],
};

export const invoiceTaxOptions: InvoiceTaxOption[] = [
  { id: "gst", name: "GST", rate: 18 },
  { id: "vat", name: "VAT", rate: 12 },
  { id: "service-tax", name: "Service Tax", rate: 10 },
  { id: "none", name: "No Tax", rate: 0 },
];

export function getLineAmount(item?: InvoiceLineItem) {
  if (!item) return 0;
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  return quantity * unitPrice;
}

export function getInvoiceItems(invoice: InvoiceFormValues) {
  return invoice.items;
}

export function getInvoiceSubtotal(invoice: InvoiceFormValues) {
  return getInvoiceItems(invoice).reduce((subtotal, item) => subtotal + getLineAmount(item), 0);
}

export function getInvoiceTaxOption(invoice: InvoiceFormValues) {
  return invoiceTaxOptions.find((taxOption) => taxOption.id === invoice.taxId) ?? invoiceTaxOptions[0];
}

export function getInvoiceTax(invoice: InvoiceFormValues) {
  const taxRate = getInvoiceTaxOption(invoice).rate;
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) * (taxRate / 100);
}

export function getInvoiceDiscount(invoice: InvoiceFormValues) {
  const subtotal = getInvoiceSubtotal(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discount = invoice.discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  return Math.min(Math.max(discount, 0), subtotal);
}

export function getInvoiceTotal(invoice: InvoiceFormValues) {
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) + getInvoiceTax(invoice);
}
