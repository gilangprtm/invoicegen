import { createFileRoute, Outlet } from "@tanstack/react-router";

import { getAuthSession } from "@/lib/middleware";

export const Route = createFileRoute("/(main)/dashboard/clients")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      throw Route.redirect({ to: "/login", search: { redirect: "/dashboard/clients" } });
    }
  },
  component: ClientsLayout,
});

function ClientsLayout() {
  return <Outlet />;
}
