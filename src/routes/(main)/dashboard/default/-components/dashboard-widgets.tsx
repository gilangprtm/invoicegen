"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { Clock, FileText, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/server/dashboard";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Paid", variant: "default" },
  sent: { label: "Sent", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
};

const formatAmount = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function TopClients() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-top-clients"],
    queryFn: () => getDashboardData(),
    select: (data) => data.topClients,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 leading-none">Top 5 Clients</CardTitle>
        <CardDescription>By total revenue (paid invoices)</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No paid invoices yet</p>
          ) : (
            data.map((client, index) => (
              <div key={`${client.name}-${client.currency}`} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{client.name}</p>
                    <p className="text-muted-foreground text-sm">{client.count} invoices</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium tabular-nums">{formatAmount(client.total, client.currency)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BestSellingItems() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-best-sellers"],
    queryFn: () => getDashboardData(),
    select: (data) => data.bestSellingItems,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 leading-none">
          <TrendingUp className="size-4" />
          Best Selling Items
        </CardTitle>
        <CardDescription>By quantity sold</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet</p>
          ) : (
            data.map((item, index) => (
              <div key={`${item.name}-${item.currency}`} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-sm">{item.qty} units sold</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium tabular-nums">{formatAmount(item.revenue, item.currency)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentInvoices() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-recent-invoices"],
    queryFn: () => getDashboardData(),
    select: (data) => data.recentInvoices,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 leading-none">
          <FileText className="size-4" />
          Recent Invoices
        </CardTitle>
        <CardDescription>Last 10 invoices</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet</p>
          ) : (
            data.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                    <Clock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invoice.number}</p>
                    <p className="text-muted-foreground text-sm">
                      {invoice.clientName} • {invoice.issuedDate}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-medium tabular-nums">{formatAmount(invoice.total, invoice.currency)}</span>
                  <Badge variant={statusConfig[invoice.status]?.variant || "outline"} className="gap-1">
                    {statusConfig[invoice.status]?.label || invoice.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
