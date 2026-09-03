import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)")({ component: MainLayout });
function MainLayout() {
  return <Outlet />;
}
