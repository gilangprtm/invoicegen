"use client";

import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { Image, Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { getAuthSession } from "@/lib/middleware";
import { getProfile, upsertProfile, type userProfileSchema } from "@/server/profile";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function useUser() {
  return useSuspenseQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const session = await getAuthSession();
      if (!session?.user) throw new Error("Not authenticated");
      return session.user;
    },
  });
}

export function SettingsPage() {
  const { data: user } = useUser();
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getProfile(),
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const companyForm = useForm<z.infer<typeof userProfileSchema>>({
    defaultValues: {
      companyName: profile?.companyName || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      website: profile?.website || "",
      address: profile?.address || "",
      taxId: profile?.taxId || "",
      paymentAccountName: profile?.paymentAccountName || "",
      routingNumber: profile?.routingNumber || "",
      issuerName: profile?.issuerName || "",
      logoUrl: profile?.logoUrl || "",
    },
  });

  // Reset company form when profile loads
  const { isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getProfile(),
    onSuccess: (data) => {
      if (data) {
        companyForm.reset({
          companyName: data.companyName || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          taxId: data.taxId || "",
          paymentAccountName: data.paymentAccountName || "",
          routingNumber: data.routingNumber || "",
          issuerName: data.issuerName || "",
          logoUrl: data.logoUrl || "",
        });
      }
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const result = await authClient.updateUser(data);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Profile updated", { description: "Your profile has been saved" });
    },
    onError: (err) => {
      toast.error("Failed to update profile", { description: err.message });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Password changed", { description: "Your password has been updated" });
      passwordForm.reset();
    },
    onError: (err) => {
      toast.error("Failed to change password", { description: err.message });
    },
  });

  const saveCompany = useMutation({
    mutationFn: (data: z.infer<typeof userProfileSchema>) => upsertProfile({ data }),
    onSuccess: () => {
      toast.success("Company profile saved", { description: "Your business info will appear on invoices" });
      refetchProfile();
    },
    onError: (err) => {
      toast.error("Failed to save", { description: err.message });
    },
  });

  const handleLogoUpload = async (file: File) => {
    // In production, upload to S3/cloud storage and get URL
    // For now, create object URL for preview
    const url = URL.createObjectURL(file);
    companyForm.setValue("logoUrl", url);
    toast.success("Logo uploaded", { description: "Save to persist" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business settings</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(updateProfile.mutate)} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...profileForm.register("name")} placeholder="Enter your name" />
                  <p className="text-muted-foreground text-sm">If empty, your email will be displayed instead</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" disabled value={user?.email || ""} />
                  <p className="text-muted-foreground text-sm">Email cannot be changed</p>
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(changePassword.mutate)} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                    placeholder="Enter new password (min 6 chars)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                This information appears on your invoices as the sender ("From" section)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={companyForm.handleSubmit(saveCompany.mutate)} className="max-w-lg space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {companyForm.watch("logoUrl") ? (
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={companyForm.watch("logoUrl")}
                            alt="Company logo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => companyForm.setValue("logoUrl", "")}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                          <Image className="size-8 text-muted-foreground" />
                        </div>
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            id="logoUpload"
                            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("logoUpload")?.click()}
                          >
                            <Upload className="mr-2 size-4" />
                            Upload Logo
                          </Button>
                        </label>
                        <p className="text-muted-foreground text-sm">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      {...companyForm.register("companyName")}
                      placeholder="e.g. Weblabs Studio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuerName">Issuer Name</Label>
                    <Input id="issuerName" {...companyForm.register("issuerName")} placeholder="e.g. Arham Khan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Company Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      {...companyForm.register("email")}
                      placeholder="hello@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...companyForm.register("phone")} placeholder="+1 512 969 0164" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...companyForm.register("website")} placeholder="company.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...companyForm.register("address")}
                    placeholder="Street, City, Postal Code, Country"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input id="taxId" {...companyForm.register("taxId")} placeholder="WS-1029384756" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAccountName">Payment Account Name</Label>
                    <Input
                      id="paymentAccountName"
                      {...companyForm.register("paymentAccountName")}
                      placeholder="e.g. Mercury Business"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing / Account No.</Label>
                    <Input id="routingNumber" {...companyForm.register("routingNumber")} placeholder="084009519" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saveCompany.isPending}>
                    {saveCompany.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Company Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/(main)/dashboard/settings")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      throw Route.redirect({ to: "/login", search: { redirect: "/dashboard/settings" } });
    }
  },
  component: SettingsPage,
});
