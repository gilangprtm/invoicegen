import { Document, Page, pdf, Text, View } from "@react-pdf/renderer";

import type { InvoiceFormValues } from "./data";
import {
  getInvoiceDiscount,
  getInvoiceItems,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTaxOption,
  getInvoiceTotal,
  getLineAmount,
} from "./data";

const styles = {
  page: {
    width: 816,
    height: 1056,
    padding: "44px 49px",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1c1917",
  },
  header: {
    flexDirection: "column",
    gap: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoBlock: {
    flexDirection: "column",
    gap: 2,
  },
  label: {
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 4,
    fontSize: 10,
  },
  rowGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 16,
  },
  addressBlock: {
    flexDirection: "column",
    gap: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#d6d3d1",
    padding: "6px 12px",
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: 9,
    marginBottom: 0,
  },
  tableHeaderCol: (width: number) => ({
    width,
    textAlign: "right" as const,
  }),
  tableHeaderDesc: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "8px 12px",
    borderBottomWidth: 1,
    borderBottomColor: "#d6d3d1",
    borderBottomStyle: "solid",
    fontSize: 10,
  },
  tableRowCol: (width: number) => ({
    width,
    textAlign: "right" as const,
  }),
  tableRowDesc: {
    flex: 1,
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  totalsBlock: {
    width: 320,
    flexDirection: "column",
    gap: 4,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
  },
  totalDivider: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#1c1917",
    borderBottomWidth: 2,
    borderBottomColor: "#1c1917",
    padding: "6px 0",
    marginTop: 6,
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    left: 49,
    right: 49,
    bottom: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#78716c",
  },
};

const COL_WIDTHS = { desc: 0, units: 90, unitCost: 160, lineTotal: 160 };

function formatPdfCurrency(value: number, currency = "USD") {
  const localeMap: Record<string, string> = {
    USD: "en-US",
    IDR: "id-ID",
    EUR: "de-DE",
    GBP: "en-GB",
    JPY: "ja-JP",
    SGD: "en-SG",
    AUD: "en-AU",
    MYR: "ms-MY",
  };
  return new Intl.NumberFormat(localeMap[currency] || "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface InvoicePdfDocProps {
  invoice: InvoiceFormValues;
  currency?: string;
}

function InvoicePdfDoc({ invoice, currency = "USD" }: InvoicePdfDocProps) {
  const taxOption = getInvoiceTaxOption(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discountLabel = invoice.discountType === "percent" ? `Discount ${discountValue}%` : "Discount";

  return (
    <Document>
      <Page size={[816, 1056]} style={styles.page}>
        <View style={styles.header}>
          {/* Top row: logo + title */}
          <View style={styles.topRow}>
            <View>{/* Logo placeholder — skipped for PDF simplicity */}</View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
          </View>

          {/* Reference / dates / payment account */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text>Reference: {invoice.referenceNumber}</Text>
              <Text>Issued: {invoice.issuedDate}</Text>
              <Text>Payment due: {invoice.paymentDueDate}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text>Payment account</Text>
              <Text>{invoice.from.paymentAccountName}</Text>
              <Text>Routing no. {invoice.from.routingNumber}</Text>
            </View>
          </View>

          {/* From / Bill to */}
          <View style={styles.rowGrid}>
            <View style={styles.addressBlock}>
              <Text style={styles.label}>From</Text>
              <Text>{invoice.from.name}</Text>
              {invoice.from.addressLines.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
              <Text>Tax ID: {invoice.from.taxId}</Text>
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.label}>Bill to</Text>
              <Text>{invoice.to.name}</Text>
              {invoice.to.addressLines.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
              <Text>Tax ID: {invoice.to.taxId}</Text>
            </View>
          </View>
        </View>

        {/* Items table */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderDesc}>Description</Text>
            <Text style={styles.tableHeaderCol(COL_WIDTHS.units)}>Units</Text>
            <Text style={styles.tableHeaderCol(COL_WIDTHS.unitCost)}>Unit cost</Text>
            <Text style={styles.tableHeaderCol(COL_WIDTHS.lineTotal)}>Line total</Text>
          </View>
          {getInvoiceItems(invoice).map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.tableRowDesc}>{item.description}</Text>
              <Text style={styles.tableRowCol(COL_WIDTHS.units)}>{item.quantity}</Text>
              <Text style={styles.tableRowCol(COL_WIDTHS.unitCost)}>{formatPdfCurrency(item.unitPrice, currency)}</Text>
              <Text style={styles.tableRowCol(COL_WIDTHS.lineTotal)}>
                {formatPdfCurrency(getLineAmount(item), currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalLine}>
              <Text>Net amount</Text>
              <Text>{formatPdfCurrency(getInvoiceSubtotal(invoice), currency)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text>{discountLabel}</Text>
              <Text>{formatPdfCurrency(getInvoiceDiscount(invoice), currency)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text>
                {taxOption.name} {taxOption.rate}%
              </Text>
              <Text>{formatPdfCurrency(getInvoiceTax(invoice), currency)}</Text>
            </View>
            <View style={styles.totalDivider}>
              <Text>Balance due</Text>
              <Text>{formatPdfCurrency(getInvoiceTotal(invoice), currency)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text>{invoice.from.email}</Text>
            <Text>{invoice.from.phone}</Text>
            <Text>{invoice.from.website}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceFormValues, currency?: string): Promise<Blob> {
  const doc = <InvoicePdfDoc invoice={invoice} currency={currency} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}
