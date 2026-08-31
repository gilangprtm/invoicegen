"use client";

import { useCallback, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";

import { ChevronLeft, ChevronRight, DollarSign, FileText, Target, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/server/dashboard";

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function MetricCards() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => getDashboardData(),
  });

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const currencies = data.totalRevenueByCurrency;
  const [currIdx, setCurrIdx] = useState(0);
  const prevCurr = useCallback(() => setCurrIdx((i) => (i > 0 ? i - 1 : currencies.length - 1)), [currencies.length]);
  const nextCurr = useCallback(() => setCurrIdx((i) => (i < currencies.length - 1 ? i + 1 : 0)), [currencies.length]);

  const metrics = [
    {
      title: "Total Revenue (Paid)",
      value: currencies.length > 0 ? formatAmount(currencies[currIdx].total, currencies[currIdx].currency) : "$0",
      icon: DollarSign,
      description:
        currencies.length > 1
          ? `${currencies[currIdx].currency} · ${currIdx + 1} of ${currencies.length} currencies`
          : currencies.length === 1
            ? currencies[currIdx].currency
            : "no data",
      onPrev: currencies.length > 1 ? prevCurr : undefined,
      onNext: currencies.length > 1 ? nextCurr : undefined,
    },
    {
      title: "Active Clients",
      value: data.activeClients.total.toString(),
      change: formatChange(data.activeClients.change),
      icon: Users,
      changePositive: data.activeClients.change >= 0,
      description: "with paid invoices",
    },
    {
      title: "Pending Invoices",
      value: data.pendingInvoices.total.toString(),
      change: formatChange(data.pendingInvoices.change),
      icon: FileText,
      changePositive: data.pendingInvoices.change <= 0,
      description: "draft + sent",
    },
    {
      title: "Client Growth Rate",
      value: `${data.growthRate.rate.toFixed(1)}%`,
      change: formatChange(data.growthRate.change),
      icon: Target,
      changePositive: data.growthRate.change >= 0,
      description: "active / total clients",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <metric.icon className="size-4" />
              </div>
            </CardTitle>
            <CardDescription>{metric.title}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{metric.value}</div>
              {"change" in metric && metric.change !== undefined && (
                <Badge variant={metric.changePositive ? "default" : "destructive"}>
                  {metric.changePositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {metric.change}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <p className="text-muted-foreground text-sm">{metric.description}</p>
              {"onPrev" in metric && metric.onPrev && (
                <div className="ml-auto flex items-center">
                  <Button size="icon" variant="ghost" className="size-6" onClick={metric.onPrev}>
                    <ChevronLeft className="size-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-6" onClick={metric.onNext}>
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
