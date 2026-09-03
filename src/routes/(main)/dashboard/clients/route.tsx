import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/dashboard/clients")({
  component: ClientsLayout,
});

function ClientsLayout() {
  return <Outlet />;
}
