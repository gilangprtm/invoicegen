"use client";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoiceStore } from "@/stores/invoice-store";
export const Route = createFileRoute("/(main)/dashboard/clients/")({ component: ClientsListPage });
function ClientsListPage() {
  const navigate = useNavigate();
  const clients = useInvoiceStore((s) => s.clients);
  const remove = useInvoiceStore((s) => s.deleteClient);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">Stored only on this device</p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard/clients/new" })}>
          <Plus data-icon="inline-start" /> Add Client
        </Button>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  No clients found.{" "}
                  <Link to="/dashboard/clients/new" className="text-primary underline">
                    Add your first client
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate({ to: `/dashboard/clients/${c.id}/edit` })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(c.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
