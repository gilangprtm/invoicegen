"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { Area, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getDashboardData } from "@/server/dashboard";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function RevenueChart() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard-revenue-chart"],
    queryFn: () => getDashboardData(),
    select: (data) => data.revenueByMonth,
  });

  // Build chart config dynamically based on currencies present
  const chartConfig: ChartConfig = {};
  data.forEach((month) => {
    month.revenueByCurrency.forEach(({ currency }) => {
      if (!chartConfig[currency]) {
        chartConfig[currency] = {
          label: currency,
          color: COLORS[Object.keys(chartConfig).length % COLORS.length],
        };
      }
    });
  });

  // Transform data for recharts: flatten per-currency into separate series
  const chartData = data.map((month) => {
    const point: Record<string, string | number> = { month: month.month };
    month.revenueByCurrency.forEach(({ currency, amount }) => {
      point[currency] = amount;
    });
    return point;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Revenue by Month</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Monthly revenue grouped by currency</span>
          <span className="@[540px]/card:hidden">Last 12 months</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-muted-foreground">No paid invoices yet</div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-50"
                  indicator="line"
                  formatter={(value, name) => [formatCurrency(Number(value)), name as string]}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
            {Object.keys(chartConfig).map((currency) => (
              <Area
                key={currency}
                dataKey={currency}
                type="natural"
                fill={`url(#fill${currency})`}
                stroke={chartConfig[currency].color}
                strokeWidth={1.25}
                dot={false}
                fillOpacity={0.1}
              />
            ))}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
