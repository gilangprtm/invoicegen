import { createServerFn } from "@tanstack/react-start";

import { and, desc, eq, like, max, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { clients, invoiceItems, invoiceSequences, invoices } from "@/db/schema";
import { getAuthSession } from "@/lib/middleware";

// ─── Status Workflow Validation ───

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["paid", "overdue"],
  paid: [],
  overdue: ["paid"],
};

export function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed transitions: ${(allowed ?? []).join(", ") || "none"}`,
    );
  }
  return true;
}

// ─── Types ───

export type InvoiceWithItems = {
  id: string;
  userId: string;
  clientId: string;
  number: string;
  currency: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: "draft" | "sent" | "paid" | "overdue";
  note: string | null;
  issuedDate: string;
  dueDate: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    invoiceId: string;
    name: string;
    quantity: string;
    price: string;
    total: string;
  }[];
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
};

export type InvoicesList = {
  id: string;
  number: string;
  currency: string;
  total: string;
  status: string;
  issuedDate: string;
  dueDate: string;
  clientName: string | null;
}[];

export type CreateInvoiceInput = {
  clientId: string;
  currency: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: "draft" | "sent" | "paid" | "overdue";
  note: string | null;
  issuedDate: string;
  dueDate: string;
  items: {
    name: string;
    quantity: string;
    price: string;
    total: string;
  }[];
};

export type UpdateInvoiceInput = Partial<CreateInvoiceInput> & { id: string };

// ─── Helper: get next invoice number (with year reset) ───

async function getNextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Query the max invoice number for the current year from the invoices table
  const [result] = await db
    .select({ maxNumber: max(invoices.number) })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), like(invoices.number, `${prefix}%`)));

  let nextNumber = 1;

  if (result?.maxNumber) {
    // Extract the sequence number from the last invoice number
    const parts = result.maxNumber.split("-");
    const lastSeq = Number.parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  // Update/insert invoiceSequences as a backup tracker
  const [seq] = await db.select().from(invoiceSequences).where(eq(invoiceSequences.userId, userId));

  if (seq) {
    await db
      .update(invoiceSequences)
      .set({ lastNumber: nextNumber, updatedAt: new Date() })
      .where(eq(invoiceSequences.userId, userId));
  } else {
    await db.insert(invoiceSequences).values({ userId, lastNumber: 1 });
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

// Server functions
export const getInvoices = createServerFn({ method: "GET" })
  .validator(
    z.object({
      status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }),
  )
  .handler(async ({ data }): Promise<{ invoices: InvoicesList; total: number; page: number; totalPages: number }> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const { status, page, limit } = data;
    const offset = (page - 1) * limit;

    const whereConditions = [eq(invoices.userId, session.user.id)];
    if (status) whereConditions.push(eq(invoices.status, status));

    const [totalResult] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(and(...whereConditions));

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const invoiceList = await db
      .select({
        id: invoices.id,
        number: invoices.number,
        currency: invoices.currency,
        total: invoices.total,
        status: invoices.status,
        issuedDate: invoices.issuedDate,
        dueDate: invoices.dueDate,
        clientName: clients.name,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(...whereConditions))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      invoices: invoiceList.map((inv) => ({
        ...inv,
        total: String(inv.total),
      })),
      total,
      page,
      totalPages,
    };
  });

export const getInvoice = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<InvoiceWithItems | null> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, data.id), eq(invoices.userId, session.user.id)));

    if (!invoice) return null;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));

    const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));

    return {
      ...invoice,
      subtotal: String(invoice.subtotal),
      taxRate: String(invoice.taxRate),
      taxAmount: String(invoice.taxAmount),
      total: String(invoice.total),
      items: items.map((item) => ({
        ...item,
        quantity: String(item.quantity),
        price: String(item.price),
        total: String(item.total),
      })),
      client: client
        ? { ...client, email: client.email ?? null, phone: client.phone ?? null, address: client.address ?? null }
        : null,
    };
  });

export const createInvoice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clientId: z.string().uuid(),
      currency: z.string().min(3).max(3),
      subtotal: z.string(),
      taxRate: z.string(),
      taxAmount: z.string(),
      total: z.string(),
      status: z.enum(["draft", "sent", "paid", "overdue"]),
      note: z.string().nullable(),
      issuedDate: z.string(),
      dueDate: z.string(),
      items: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.string(),
            price: z.string(),
            total: z.string(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ id: string; number: string }> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const number = await getNextInvoiceNumber(session.user.id);

    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: session.user.id,
        clientId: data.clientId,
        number,
        currency: data.currency,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        total: data.total,
        status: data.status,
        note: data.note,
        issuedDate: data.issuedDate,
        dueDate: data.dueDate,
      })
      .returning();

    if (data.items && data.items.length > 0) {
      await db.insert(invoiceItems).values(
        data.items.map((item) => ({
          invoiceId: invoice.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      );
    }

    return { id: invoice.id, number: invoice.number };
  });

export const updateInvoice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      clientId: z.string().uuid().nullable().optional(),
      currency: z.string().min(3).max(3).optional(),
      subtotal: z.string().optional(),
      taxRate: z.string().optional(),
      taxAmount: z.string().optional(),
      total: z.string().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
      note: z.string().nullable().optional(),
      issuedDate: z.string().optional(),
      dueDate: z.string().optional(),
      items: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.string(),
            price: z.string(),
            total: z.string(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }): Promise<void> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const { id, items, ...invoiceData } = data;

    // Verify ownership and get current status
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status, paidAt: invoices.paidAt })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)));

    if (!existing) throw new Error("Invoice not found");

    // Validate status transitions
    if (invoiceData.status) {
      validateStatusTransition(existing.status, invoiceData.status);
    }

    // Set paidAt when transitioning to "paid"
    const updateData: Record<string, unknown> = { ...invoiceData, updatedAt: new Date() };
    if (invoiceData.status === "paid" && !existing.paidAt) {
      updateData.paidAt = new Date();
    }

    // Update invoice
    await db.update(invoices).set(updateData).where(eq(invoices.id, id));

    // Update items if provided
    if (items) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      await db.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      );
    }
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<void> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    // Verify ownership
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, data.id), eq(invoices.userId, session.user.id)));

    if (!existing) throw new Error("Invoice not found");
    if (existing.status !== "draft") {
      throw new Error("Only draft invoices can be deleted");
    }

    // Cascade deletes items via FK
    await db.delete(invoices).where(eq(invoices.id, data.id));
  });
