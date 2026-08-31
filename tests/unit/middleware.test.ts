import { beforeEach, describe, expect, it, vi } from "vitest";

// Test data and mock setup
const mockSession = { user: { id: "1", name: "Test User", email: "test@example.com" } };
const mockUserWithRole = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  avatarUrl: null,
  roleId: 1,
  roleName: "admin",
};

// Mock modules - use vi.hoisted for proper hoisting
const mockAuth = vi.hoisted(() => ({
  api: {
    getSession: vi.fn(),
  },
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  })),
}));

const mockHeaders = vi.hoisted(() => ({
  getRequestHeaders: vi.fn(),
}));

const mockCreateServerFn = vi.hoisted(() => ({
  createServerFn: vi.fn((_config) => ({
    handler: vi.fn((fn) => fn),
  })),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/db/schema", () => ({
  users: {},
  roles: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: mockHeaders.getRequestHeaders,
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: mockCreateServerFn.createServerFn,
}));

// Import after mocks
import { __test__ } from "@/lib/middleware";

// Mock getUserWithRole globally for all tests
vi.mock("@/lib/middleware", async () => {
  const actual = await vi.importActual("@/lib/middleware");
  return {
    ...actual,
    getUserWithRole: vi.fn(),
  };
});

describe("Auth Middleware - Core Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("_getSessionCore (test utility)", () => {
    it("returns session from auth.api.getSession", async () => {
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const result = await __test__._getSessionCore(new Headers());

      expect(mockAuth.api.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
      expect(result).toEqual(mockSession);
    });

    it("returns null when no session", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const result = await __test__._getSessionCore(new Headers());

      expect(result).toBeNull();
    });
  });

  describe("_getUserWithRoleCore (test utility)", () => {
    it("returns user with role from database", async () => {
      const mockWhere = vi.fn().mockResolvedValue([mockUserWithRole]);
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      mockDb.select.mockReturnValue({ from: mockFrom });

      const result = await __test__._getUserWithRoleCore("1");

      expect(result).toEqual(mockUserWithRole);
    });

    it("returns null when user not found", async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      mockDb.select.mockReturnValue({ from: mockFrom });

      const result = await __test__._getUserWithRoleCore("1");

      expect(result).toBeNull();
    });
  });

  describe("_hasRoleCore (test utility)", () => {
    it("returns true when user has the role", async () => {
      const mockUser = { roleName: "admin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._hasRoleCore("admin");

      expect(result).toBe(true);
    });

    it("returns false when user doesn't have the role", async () => {
      const mockUser = { roleName: "user" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._hasRoleCore("admin");

      expect(result).toBe(false);
    });

    it("returns false when no user", async () => {
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(null);

      const result = await __test__._hasRoleCore("admin");

      expect(result).toBe(false);
    });
  });

  describe("_hasAnyRoleCore (test utility)", () => {
    it("returns true when user has one of the roles", async () => {
      const mockUser = { roleName: "admin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._hasAnyRoleCore(["superadmin", "admin"]);

      expect(result).toBe(true);
    });

    it("returns false when user has none of the roles", async () => {
      const mockUser = { roleName: "user" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._hasAnyRoleCore(["superadmin", "admin"]);

      expect(result).toBe(false);
    });

    it("returns false when no role", async () => {
      const mockUser = { roleName: null };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._hasAnyRoleCore(["superadmin", "admin"]);

      expect(result).toBe(false);
    });

    it("returns false when no user", async () => {
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(null);

      const result = await __test__._hasAnyRoleCore(["superadmin", "admin"]);

      expect(result).toBe(false);
    });
  });

  describe("_requireRoleCore (test utility)", () => {
    it("returns user with role when user has the role", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "admin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._requireRoleCore("admin");

      expect(result).toEqual(mockUser);
    });

    it("throws UNAUTHENTICATED when no user", async () => {
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(null);

      await expect(__test__._requireRoleCore("admin")).rejects.toThrow("UNAUTHENTICATED");
    });

    it("throws FORBIDDEN when user doesn't have the role", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "user" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      await expect(__test__._requireRoleCore("admin")).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("_requireAnyRoleCore (test utility)", () => {
    it("returns user with role when user has one of the roles", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "admin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._requireAnyRoleCore(["superadmin", "admin"]);

      expect(result).toEqual(mockUser);
    });

    it("throws UNAUTHENTICATED when no user", async () => {
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(null);

      await expect(__test__._requireAnyRoleCore(["admin"])).rejects.toThrow("UNAUTHENTICATED");
    });

    it("throws FORBIDDEN when user has none of the roles", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "user" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      await expect(__test__._requireAnyRoleCore(["superadmin", "admin"])).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("_requireAdminCore (test utility)", () => {
    it("returns user with role when user is admin", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "admin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._requireAdminCore();

      expect(result).toEqual(mockUser);
    });

    it("returns user with role when user is superadmin", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "superadmin" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      const result = await __test__._requireAdminCore();

      expect(result).toEqual(mockUser);
    });

    it("throws FORBIDDEN when user is not admin", async () => {
      const mockUser = { id: "1", name: "Test", roleName: "user" };
      const { getUserWithRole } = await import("@/lib/middleware");
      vi.mocked(getUserWithRole).mockResolvedValue(mockUser as any);

      await expect(__test__._requireAdminCore()).rejects.toThrow("FORBIDDEN");
    });
  });
});

// Note: getSession, getCurrentUser, getAuthSession, getUserWithRole, requireAuth
// are server functions that require the TanStack Start runtime.
// They are tested indirectly through the core functions above.
// Integration tests should test these in a real server environment.
