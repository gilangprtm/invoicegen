import { createServerFn } from "@tanstack/react-start";

import { asc, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { clients, invoiceItems, invoices } from "@/db/schema";

export type DashboardMetrics = {
  totalRevenueByCurrency: { currency: string; total: number }[];
  activeClients: { total: number; change: number };
  pendingInvoices: { total: number; change: number };
  growthRate: { rate: number; change: number };
  revenueByMonth: { month: string; revenueByCurrency: { currency: string; amount: number }[] }[];
  topClients: { name: string; total: number; currency: string; count: number }[];
  bestSellingItems: { name: string; qty: number; revenue: number; currency: string }[];
  recentInvoices: {
    id: string;
    number: string;
    clientName: string;
    total: number;
    currency: string;
    status: string;
    issuedDate: string;
  }[];
};

export const getDashboardData = createServerFn({ method: "GET" }).handler(async (): Promise<DashboardMetrics> => {
  // Total revenue grouped by currency
  const revByCurrency = await db
    .select({
      currency: invoices.currency,
      total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "paid"))
    .groupBy(invoices.currency);

  // Active clients
  const [cliResult] = await db.select({ total: sql<number>`COUNT(DISTINCT ${invoices.clientId})` }).from(invoices);
  const activeClients = Number(cliResult?.total || 0);

  // Pending invoices
  const [penResult] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(invoices)
    .where(sql`${invoices.status} IN ('draft', 'sent')`);
  const pendingInvoices = Number(penResult?.total || 0);

  // Growth rate
  const [newClients] = await db.select({ total: sql<number>`COUNT(*)` }).from(clients);
  const totalClients = Number(newClients?.total || 0);

  // Revenue by month (grouped by currency)
  const revByMonth = await db
    .select({
      month: sql<string>`to_char(${invoices.createdAt}, 'Mon YYYY')`,
      currency: invoices.currency,
      revenue: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "paid"))
    .groupBy(sql`to_char(${invoices.createdAt}, 'Mon YYYY')`, invoices.currency)
    .orderBy(asc(sql`MIN(${invoices.createdAt})`))
    .limit(12);

  // Transform to nested structure
  const monthMap = new Map<string, { month: string; revenueByCurrency: { currency: string; amount: number }[] }>();
  revByMonth.forEach((r) => {
    if (!monthMap.has(r.month)) {
      monthMap.set(r.month, { month: r.month, revenueByCurrency: [] });
    }
    monthMap.get(r.month)?.revenueByCurrency.push({ currency: r.currency, amount: Number(r.revenue) });
  });

  // Top 5 clients (grouped by currency)
  const topClientsRaw = await db
    .select({
      name: clients.name,
      currency: invoices.currency,
      total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.status, "paid"))
    .groupBy(clients.name, invoices.currency)
    .orderBy(desc(sql`COALESCE(SUM(${invoices.total}), 0)`))
    .limit(5);

  // Best selling items (grouped by currency)
  const bestSellersRaw = await db
    .select({
      name: invoiceItems.name,
      currency: invoices.currency,
      qty: sql<number>`COALESCE(SUM(${invoiceItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${invoiceItems.total}), 0)`,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(eq(invoices.status, "paid"))
    .groupBy(invoiceItems.name, invoices.currency)
    .orderBy(desc(sql`COALESCE(SUM(${invoiceItems.total}), 0)`))
    .limit(5);

  // Recent invoices
  const recentRaw = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      clientName: clients.name,
      total: invoices.total,
      currency: invoices.currency,
      status: invoices.status,
      issuedDate: invoices.issuedDate,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt))
    .limit(10);

  return {
    totalRevenueByCurrency: revByCurrency.map((r) => ({ currency: r.currency, total: Number(r.total) })),
    activeClients: { total: activeClients, change: 0 },
    pendingInvoices: { total: pendingInvoices, change: 0 },
    growthRate: { rate: totalClients > 0 ? Math.round((activeClients / totalClients) * 1000) / 10 : 0, change: 0 },
    revenueByMonth: Array.from(monthMap.values()),
    topClients: topClientsRaw.map((c) => ({
      name: c.name,
      total: Number(c.total),
      currency: c.currency,
      count: Number(c.count),
    })),
    bestSellingItems: bestSellersRaw.map((i) => ({
      name: i.name,
      qty: Number(i.qty),
      revenue: Number(i.revenue),
      currency: i.currency,
    })),
    recentInvoices: recentRaw.map((inv) => ({
      id: inv.id,
      number: inv.number,
      clientName: inv.clientName,
      total: Number(inv.total),
      currency: inv.currency,
      status: inv.status,
      issuedDate: new Date(inv.issuedDate).toLocaleDateString("en-GB"),
    })),
  };
});

export type PerformanceMetrics = {
  date: string;
  invoicesCreated: number;
  invoicesPaid: number;
  revenuePaidByCurrency: { currency: string; amount: number }[];
  clientsActive: number;
}[];

export const getPerformanceData = createServerFn({ method: "GET" }).handler(async (): Promise<PerformanceMetrics> => {
  const data = await db
    .select({
      date: sql<string>`to_char(${invoices.createdAt}, 'YYYY-MM-DD')`,
      invoicesCreated: sql<number>`COUNT(*)`,
      invoicesPaid: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
      revenuePaid: sql<number>`COALESCE(SUM(${invoices.total}) FILTER (WHERE ${invoices.status} = 'paid'), 0)`,
      currency: invoices.currency,
      clientsActive: sql<number>`COUNT(DISTINCT ${invoices.clientId})`,
    })
    .from(invoices)
    .where(gte(invoices.createdAt, sql`NOW() - INTERVAL '30 days'`))
    .groupBy(sql`to_char(${invoices.createdAt}, 'YYYY-MM-DD')`, invoices.currency)
    .orderBy(asc(sql`to_char(${invoices.createdAt}, 'YYYY-MM-DD')`));

  const dateMap = new Map<
    string,
    {
      date: string;
      invoicesCreated: number;
      invoicesPaid: number;
      revenuePaidByCurrency: { currency: string; amount: number }[];
      clientsActive: number;
    }
  >();
  data.forEach((d) => {
    if (!dateMap.has(d.date)) {
      dateMap.set(d.date, {
        date: d.date,
        invoicesCreated: 0,
        invoicesPaid: 0,
        revenuePaidByCurrency: [],
        clientsActive: 0,
      });
    }
    const entry = dateMap.get(d.date)!;
    entry.invoicesCreated += Number(d.invoicesCreated);
    entry.invoicesPaid += Number(d.invoicesPaid);
    entry.clientsActive = Math.max(entry.clientsActive, Number(d.clientsActive));
    entry.revenuePaidByCurrency.push({ currency: d.currency, amount: Number(d.revenuePaid) });
  });

  return Array.from(dateMap.values());
});
