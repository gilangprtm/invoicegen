"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { format, parseISO } from "date-fns";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getPerformanceData } from "@/server/dashboard";

const chartConfig = {
  invoicesCreated: {
    label: "Created",
    color: "var(--chart-1)",
  },
  invoicesPaid: {
    label: "Paid",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PerformanceOverview() {
  const { data } = useSuspenseQuery({
    queryKey: ["performance-data"],
    queryFn: () => getPerformanceData(),
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Invoice Performance</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Daily invoice activity for the last 30 days</span>
          <span className="@[540px]/card:hidden">Last 30 days</span>
        </CardDescription>
        <CardAction>
          <span className="text-muted-foreground text-xs">{data.length} active days</span>
        </CardAction>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-muted-foreground">
            No invoice data yet. Create your first invoice to see performance metrics.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
            <ComposedChart data={data} margin={{ top: 0 }}>
              <defs>
                <linearGradient id="fillInvoicesCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-invoicesCreated)" stopOpacity={0.36} />
                  <stop offset="95%" stopColor="var(--color-invoicesCreated)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tickFormatter={(value) =>
                  parseISO(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-50"
                    indicator="line"
                    labelFormatter={(value) => format(parseISO(value), "d MMMM yyyy")}
                  />
                }
              />
              <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />

              <Bar dataKey="invoicesCreated" fill="url(#fillInvoicesCreated)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line
                dataKey="invoicesPaid"
                type="natural"
                stroke="var(--color-invoicesPaid)"
                strokeWidth={1.4}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
