import { describe, expect, it } from "vitest";

import { canTransitionStatus, nextInvoiceNumber, normalizeStatus, parseBackup } from "@/lib/local-store-utils";

describe("local invoice utilities", () => {
  it("generates next padded invoice number", () =>
    expect(nextInvoiceNumber(["INV-2026-0002"], "INV-2026")).toBe("INV-2026-0003"));
  it("marks sent past due invoice overdue", () =>
    expect(normalizeStatus("sent", "2020-01-01", new Date("2020-01-02"))).toBe("overdue"));
  it("rejects invalid status transitions", () => expect(canTransitionStatus("draft", "paid")).toBe(false));
  it("rejects non-object backups", () => expect(() => parseBackup("[]")).toThrow());
});
