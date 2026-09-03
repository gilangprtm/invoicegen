export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export function canTransitionStatus(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return (
    (from === "draft" && to === "sent") ||
    (from === "sent" && (to === "paid" || to === "overdue")) ||
    (from === "overdue" && to === "paid")
  );
}

export function nextInvoiceNumber(numbers: string[], prefix = `INV-${new Date().getFullYear()}`): string {
  const marker = `${prefix}-`;
  let max = 0;
  let width = 3;
  for (const value of numbers) {
    if (!value.startsWith(marker)) continue;
    const suffix = value.slice(marker.length);
    if (suffix.length === 0 || ![...suffix].every((character) => character >= "0" && character <= "9")) continue;
    max = Math.max(max, Number(suffix));
    width = Math.max(width, suffix.length);
  }
  return `${marker}${String(max + 1).padStart(width, "0")}`;
}

export function normalizeStatus(status: InvoiceStatus, dueDate: string, today = new Date()): InvoiceStatus {
  if (status === "sent" && dueDate && new Date(`${dueDate}T23:59:59`) < today) return "overdue";
  return status;
}

export function downloadJson(filename: string, value: unknown) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): unknown {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Backup must contain a JSON object");
  return value;
}

export function validateBackup(value: unknown): value is {
  version: number;
  profile: Record<string, unknown>;
  clients: unknown[];
  invoices: unknown[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const backup = value as Record<string, unknown>;
  return (
    backup.version === 1 &&
    !!backup.profile &&
    typeof backup.profile === "object" &&
    Array.isArray(backup.clients) &&
    Array.isArray(backup.invoices)
  );
}

export function getStorageErrorMessage(error: unknown): string {
  return error instanceof Error
    ? `Local storage unavailable: ${error.message}`
    : "Local storage unavailable. Export your backup and try again.";
}

export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function calculateInvoiceTotals(items: Array<{ quantity: number; price: number }>, discount = 0, taxRate = 0) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (isValidAmount(item.quantity) ? item.quantity : 0) * (isValidAmount(item.price) ? item.price : 0),
    0,
  );
  const safeDiscount = Math.min(Math.max(Number.isFinite(discount) ? discount : 0, 0), subtotal);
  const safeTaxRate = Number.isFinite(taxRate) ? Math.min(Math.max(taxRate, 0), 100) : 0;
  const taxAmount = (subtotal - safeDiscount) * (safeTaxRate / 100);
  return { subtotal, discount: safeDiscount, taxAmount, total: subtotal - safeDiscount + taxAmount };
}
