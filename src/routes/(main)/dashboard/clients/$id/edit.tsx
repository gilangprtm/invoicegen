"use client";

import { useEffect } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getClient, updateClient } from "@/server/clients";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const Route = createFileRoute("/(main)/dashboard/clients/$id/edit")({
  component: ClientEditPage,
});

function ClientEditPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClient({ data: { id } }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
      });
    }
  }, [client, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      updateClient({
        data: {
          id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        },
      }),
    onSuccess: async () => {
      toast.success("Client updated");
      await navigate({ to: "/dashboard/clients" });
    },
    onError: (err) => {
      toast.error("Failed to update client", { description: err.message });
    },
  });

  if (!client) {
    return (
      <div className="flex max-w-lg flex-col gap-6">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Client Not Found</h1>
        </div>
        <Button variant="link" onClick={() => navigate({ to: "/dashboard/clients" })}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground text-sm">Update client information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
          <CardDescription>Edit the client's information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="Client name" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="client@example.com" />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1-555-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register("address")} placeholder="Full address" rows={3} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard/clients" })}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
