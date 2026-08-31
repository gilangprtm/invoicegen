import { createFileRoute, Outlet } from "@tanstack/react-router";

import { getAuthSession } from "@/lib/middleware";

export const Route = createFileRoute("/(main)/dashboard/invoice")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      throw Route.redirect({ to: "/login", search: { redirect: "/dashboard/invoice" } });
    }
  },
  component: InvoiceLayout,
});

function InvoiceLayout() {
  return <Outlet />;
}
