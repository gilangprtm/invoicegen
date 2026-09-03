"use client";

import { useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";

import type { InvoiceFormValues } from "./data";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientSelectorProps {
  showError?: boolean;
}

export function ClientSelector({ showError = false }: ClientSelectorProps) {
  const { control } = useFormContext<InvoiceFormValues>();
  const clientsData = useInvoiceStore((state) => state.clients);
  const addClient = useInvoiceStore((state) => state.addClient);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fieldRef = useRef<{
    onChange: (value: { id: string; name: string; email: string; addressLines: string[]; taxId: string }) => void;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "", address: "" },
  });

  const createClient = (data: ClientFormData) => {
    const newClient = addClient({
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
    });
    toast.success("Client created");
    fieldRef.current?.onChange({
      id: newClient.id,
      name: newClient.name,
      email: newClient.email,
      addressLines: newClient.address ? [newClient.address] : [],
      taxId: "",
    });
    setDialogOpen(false);
    reset();
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">Billed To</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Add New Client
        </Button>
      </div>

      <Controller
        control={control}
        name="to"
        render={({ field }) => {
          fieldRef.current = field;
          const selectedClient = field.value;

          return (
            <Field className="gap-1">
              <FieldLabel className="text-xs">
                Client
                <span className="ml-0.5 text-destructive" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Select
                value={selectedClient.id}
                onValueChange={(clientId) => {
                  const nextClient = clientsData.find((item) => item.id === clientId);
                  if (nextClient) {
                    field.onChange({
                      id: nextClient.id,
                      name: nextClient.name,
                      email: nextClient.email || "",
                      addressLines: nextClient.address ? [nextClient.address] : [],
                      taxId: "",
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full data-[size=default]:h-auto">
                  <SelectValue placeholder="Select client">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="after:rounded-md">
                        <AvatarFallback className="rounded-md bg-card text-foreground">
                          {getInitials(selectedClient.name).slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="text-left text-xs">
                        <div>{selectedClient.name || "Select client"}</div>
                        <div className="text-muted-foreground">{selectedClient.email || ""}</div>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {clientsData.map((clientOption) => (
                      <SelectItem key={clientOption.id} value={clientOption.id}>
                        {clientOption.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {showError && (
                <FieldError className="text-destructive text-xs">Client is required to send invoice</FieldError>
              )}
            </Field>
          );
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Create a new client record</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(createClient)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Name *</Label>
              <Input id="client-name" {...register("name")} placeholder="Client name" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input id="client-email" type="email" {...register("email")} placeholder="client@example.com" />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input id="client-phone" {...register("phone")} placeholder="+1-555-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-address">Address</Label>
              <Textarea id="client-address" {...register("address")} placeholder="Full address" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={false}>
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
