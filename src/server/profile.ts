import { createServerFn } from "@tanstack/react-start";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { getAuthSession } from "@/lib/middleware";

export const userProfileSchema = z.object({
  companyName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  paymentAccountName: z.string().optional().nullable(),
  routingNumber: z.string().optional().nullable(),
  issuerName: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const getProfile = createServerFn({ method: "GET" }).handler(async (): Promise<UserProfile | null> => {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("Not authenticated");

  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, session.user.id));

  return profile ?? null;
});

export const upsertProfile = createServerFn({ method: "POST" })
  .validator(userProfileSchema)
  .handler(async ({ data }): Promise<UserProfile> => {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Not authenticated");

    const values = {
      id: session.user.id,
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      address: data.address || null,
      taxId: data.taxId || null,
      paymentAccountName: data.paymentAccountName || null,
      routingNumber: data.routingNumber || null,
      issuerName: data.issuerName || null,
      logoUrl: data.logoUrl || null,
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.id, session.user.id));

    if (existing) {
      await db.update(userProfiles).set(values).where(eq(userProfiles.id, session.user.id));
    } else {
      await db.insert(userProfiles).values(values);
    }

    return values;
  });
