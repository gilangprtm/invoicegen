import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/dashboard/invoice")({
  component: InvoiceLayout,
});

function InvoiceLayout() {
  return <Outlet />;
}
