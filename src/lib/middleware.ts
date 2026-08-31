import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { eq } from "drizzle-orm";

/**
 * Core function to get session from request headers.
 * Used by getSession server function and tests.
 */
async function _getSessionCore(headers: Headers) {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({
    headers,
  });
  return session;
}

/**
 * Server function to get the current Better Auth session from request headers.
 * Uses Better Auth's getSession API with request headers for cookie-based auth.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = await getRequestHeaders();
  return _getSessionCore(headers);
});

/**
 * Type-safe session getter for use in route loaders and server functions.
 * Returns the session user if authenticated, null otherwise.
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Type-safe session getter for route protection.
 * Returns the full session object or null if not authenticated.
 */
export async function getAuthSession() {
  return getSession();
}

/**
 * Core function to get user with role - used by getUserWithRole and tests.
 */
async function _getUserWithRoleCore(sessionUserId: string) {
  const { db } = await import("@/db");
  const { roles, users } = await import("@/db/schema");
  const [userWithRole] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      avatarUrl: users.avatarUrl,
      roleId: users.roleId,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, sessionUserId));

  return userWithRole ?? null;
}

/**
 * Get user with role information from database.
 * Returns user object with role name if user exists, null otherwise.
 */
export async function getUserWithRole() {
  const session = await getAuthSession();
  if (!session?.user) return null;
  return _getUserWithRoleCore(session.user.id);
}

/**
 * Core function for checking if user has a specific role.
 * Does not depend on TanStack Start runtime.
 */
export async function _hasRoleCore(roleName: string): Promise<boolean> {
  // Note: This function requires a userId - in real usage it's called after authentication
  // For testing, we mock getUserWithRole
  const userWithRole = await getUserWithRole();
  return userWithRole?.roleName === roleName;
}

/**
 * Check if current user has a specific role.
 * Returns true if user has the role, false otherwise.
 */
export async function hasRole(roleName: string): Promise<boolean> {
  return _hasRoleCore(roleName);
}

/**
 * Core function for checking if user has any of the specified roles.
 * Does not depend on TanStack Start runtime.
 */
export async function _hasAnyRoleCore(roleNames: string[]): Promise<boolean> {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.roleName) return false;
  return roleNames.includes(userWithRole.roleName);
}

/**
 * Check if current user has any of the specified roles.
 * Returns true if user has at least one of the roles, false otherwise.
 */
export async function hasAnyRole(roleNames: string[]): Promise<boolean> {
  return _hasAnyRoleCore(roleNames);
}

/**
 * Core function for requireAuth - does not depend on TanStack Start runtime.
 */
export async function _requireAuthCore() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}

/**
 * Require authentication - throws redirect to login if not authenticated.
 * Returns the session user on success.
 */
export async function requireAuth() {
  return _requireAuthCore();
}

/**
 * Core function for requireRole - does not depend on TanStack Start runtime.
 */
export async function _requireRoleCore(roleName: string) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) {
    throw new Error("UNAUTHENTICATED");
  }
  if (userWithRole.roleName !== roleName) {
    throw new Error("FORBIDDEN");
  }
  return userWithRole;
}

/**
 * Require specific role - throws error if user doesn't have the role.
 * Returns the user with role on success.
 */
export async function requireRole(roleName: string) {
  return _requireRoleCore(roleName);
}

/**
 * Core function for requireAnyRole - does not depend on TanStack Start runtime.
 */
export async function _requireAnyRoleCore(roleNames: string[]) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!userWithRole.roleName || !roleNames.includes(userWithRole.roleName)) {
    throw new Error("FORBIDDEN");
  }
  return userWithRole;
}

/**
 * Require any of the specified roles - throws error if user doesn't have any.
 * Returns the user with role on success.
 */
export async function requireAnyRole(roleNames: string[]) {
  return _requireAnyRoleCore(roleNames);
}

/**
 * Core function for requireAdmin - does not depend on TanStack Start runtime.
 */
export async function _requireAdminCore() {
  return _requireAnyRoleCore(["superadmin", "admin"]);
}

/**
 * Require admin role (superadmin or admin).
 * Returns the user with role on success.
 */
export async function requireAdmin() {
  return _requireAdminCore();
}

// Export core functions for testing
export const __test__ = {
  _getSessionCore,
  _getUserWithRoleCore,
  _hasRoleCore,
  _hasAnyRoleCore,
  _requireAuthCore,
  _requireRoleCore,
  _requireAnyRoleCore,
  _requireAdminCore,
} as const;
