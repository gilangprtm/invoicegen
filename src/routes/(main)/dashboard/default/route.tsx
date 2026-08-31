import { createFileRoute } from "@tanstack/react-router";

import { BestSellingItems, RecentInvoices, TopClients } from "./-components/dashboard-widgets";
import { MetricCards } from "./-components/metric-cards";
import { PerformanceOverview } from "./-components/performance-overview";
import { RevenueChart } from "./-components/revenue-chart";

export const Route = createFileRoute("/(main)/dashboard/default")({
  component: Page,
});

function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueChart />
        <TopClients />
      </div>
      <PerformanceOverview />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BestSellingItems />
        <RecentInvoices />
      </div>
    </div>
  );
}
