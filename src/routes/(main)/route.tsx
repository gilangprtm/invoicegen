import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getAuthSession } from "@/lib/middleware";

/**
 * Public routes under (main) that don't require authentication.
 * Auth pages, registration, and the unauthorized page are accessible without a session.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/auth/v1/login",
  "/auth/v1/register",
  "/auth/v2/login",
  "/auth/v2/register",
  "/unauthorized",
];

export const Route = createFileRoute("/(main)")({
  beforeLoad: async ({ location }) => {
    if (PUBLIC_ROUTES.some((path) => location.pathname.startsWith(path))) {
      return;
    }

    const session = await getAuthSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }

    return { user: session.user };
  },
  component: MainLayout,
});

function MainLayout() {
  return <Outlet />;
}
