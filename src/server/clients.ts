import { createServerFn } from "@tanstack/react-start";

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { getAuthSession } from "@/lib/middleware";

export type ClientList = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  invoiceCount: number;
  totalRevenue: string;
  createdAt: Date;
}[];

export type ClientDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
};

export const getClients = createServerFn({ method: "GET" }).handler(async (): Promise<ClientList> => {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("Not authenticated");

  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      address: clients.address,
      createdAt: clients.createdAt,
      invoiceCount: sql<number>`COUNT(${invoices.id})::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${invoices.total}) FILTER (WHERE ${invoices.status} = 'paid'), '0')`,
    })
    .from(clients)
    .leftJoin(invoices, eq(invoices.clientId, clients.id))
    .where(eq(clients.userId, session.user.id))
    .groupBy(clients.id)
    .orderBy(desc(clients.createdAt));

  return clientList;
});

export const getClient = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<ClientDetail | null> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, data.id), eq(clients.userId, session.user.id)));

    if (!client) return null;
    return { ...client, email: client.email ?? null, phone: client.phone ?? null, address: client.address ?? null };
  });

export const createClients = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const [client] = await db
      .insert(clients)
      .values({
        userId: session.user.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      .returning({ id: clients.id });

    return client;
  });

export const updateClient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional().or(z.literal("")).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<void> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const { id, ...clientData } = data;

    await db
      .update(clients)
      .set({ ...clientData, email: clientData.email || null, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)));
  });

export const deleteClient = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<void> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    // Reject if client has invoices (belt + suspenders with DB FK restrict)
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.clientId, data.id), eq(invoices.userId, session.user.id)));

    if (count > 0) {
      throw new Error(
        `Cannot delete client: ${count} invoice${count === 1 ? "" : "s"} still reference${count === 1 ? "s" : ""} this client. Delete the invoices first.`,
      );
    }

    await db.delete(clients).where(and(eq(clients.id, data.id), eq(clients.userId, session.user.id)));
  });
