import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { canTransitionStatus, type InvoiceStatus, nextInvoiceNumber } from "@/lib/local-store-utils";

export type LocalProfile = {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  paymentAccountName: string;
  routingNumber: string;
  issuerName: string;
  logoUrl: string;
};
export type LocalClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};
export type LocalInvoiceItem = { id: string; name: string; quantity: number; price: number; total: number };
export type LocalInvoice = {
  id: string;
  number: string;
  clientId: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxLabel?: string;
  discountType?: "fixed" | "percent";
  discountValue?: number;
  discountAmount?: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  note: string;
  issuedDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  items: LocalInvoiceItem[];
};

export type LocalPreferences = { currency: string; theme?: "light" | "dark" | "system" };
const emptyProfile: LocalProfile = {
  companyName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  taxId: "",
  paymentAccountName: "",
  routingNumber: "",
  issuerName: "",
  logoUrl: "",
};
const defaultPreferences: LocalPreferences = { currency: "IDR", theme: "system" };
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type Store = {
  profile: LocalProfile;
  clients: LocalClient[];
  invoices: LocalInvoice[];
  preferences: LocalPreferences;
  setProfile: (profile: Partial<LocalProfile>) => void;
  setPreferences: (preferences: Partial<LocalPreferences>) => void;
  addClient: (client: Omit<LocalClient, "id" | "createdAt">) => LocalClient;
  updateClient: (id: string, client: Partial<LocalClient>) => void;
  deleteClient: (id: string) => boolean;
  addInvoice: (
    invoice: Omit<LocalInvoice, "id" | "number" | "createdAt" | "updatedAt"> & { number?: string },
  ) => LocalInvoice;
  updateInvoice: (id: string, invoice: Partial<LocalInvoice>) => void;
  deleteInvoice: (id: string) => boolean;
  getItem: (invoiceId: string, itemId: string) => LocalInvoiceItem | undefined;
  addItem: (invoiceId: string, item: Omit<LocalInvoiceItem, "id">) => boolean;
  updateItem: (invoiceId: string, itemId: string, item: Partial<LocalInvoiceItem>) => boolean;
  deleteItem: (invoiceId: string, itemId: string) => boolean;
  setStatus: (id: string, status: InvoiceStatus) => boolean;
  replaceAll: (data: Partial<Pick<Store, "profile" | "clients" | "invoices" | "preferences">>) => void;
};

export const useInvoiceStore = create<Store>()(
  persist(
    (set, get) => ({
      profile: emptyProfile,
      clients: [],
      invoices: [],
      preferences: defaultPreferences,
      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      setPreferences: (preferences) => set((state) => ({ preferences: { ...state.preferences, ...preferences } })),
      addClient: (client) => {
        const result = { ...client, id: id(), createdAt: new Date().toISOString() };
        set((s) => ({ clients: [...s.clients, result] }));
        return result;
      },
      updateClient: (clientId, client) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, ...client } : c)) })),
      deleteClient: (clientId) => {
        if (get().invoices.some((i) => i.clientId === clientId)) return false;
        set((s) => ({ clients: s.clients.filter((c) => c.id !== clientId) }));
        return true;
      },
      addInvoice: (invoice) => {
        const now = new Date().toISOString();
        const used = get().invoices.map((i) => i.number);
        const result = {
          ...invoice,
          id: id(),
          number: invoice.number && !used.includes(invoice.number) ? invoice.number : nextInvoiceNumber(used),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ invoices: [...s.invoices, result] }));
        return result;
      },
      updateInvoice: (invoiceId, invoice) =>
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId ? { ...i, ...invoice, updatedAt: new Date().toISOString() } : i,
          ),
        })),
      deleteInvoice: (invoiceId) => {
        if (get().invoices.find((invoice) => invoice.id === invoiceId)?.status !== "draft") return false;
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== invoiceId) }));
        return true;
      },
      getItem: (invoiceId, itemId) =>
        get()
          .invoices.find((i) => i.id === invoiceId)
          ?.items.find((item) => item.id === itemId),
      addItem: (invoiceId, item) => {
        if (!get().invoices.some((i) => i.id === invoiceId)) return false;
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? { ...i, items: [...i.items, { ...item, id: id() }], updatedAt: new Date().toISOString() }
              : i,
          ),
        }));
        return true;
      },
      updateItem: (invoiceId, itemId, item) => {
        if (!get().getItem(invoiceId, itemId)) return false;
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  items: i.items.map((x) => (x.id === itemId ? { ...x, ...item } : x)),
                  updatedAt: new Date().toISOString(),
                }
              : i,
          ),
        }));
        return true;
      },
      deleteItem: (invoiceId, itemId) => {
        if (!get().getItem(invoiceId, itemId)) return false;
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? { ...i, items: i.items.filter((x) => x.id !== itemId), updatedAt: new Date().toISOString() }
              : i,
          ),
        }));
        return true;
      },
      setStatus: (invoiceId, status) => {
        const invoice = get().invoices.find((i) => i.id === invoiceId);
        if (!invoice || !canTransitionStatus(invoice.status, status)) return false;
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  status,
                  paidAt: status === "paid" ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : i,
          ),
        }));
        return true;
      },
      replaceAll: (data) =>
        set((s) => ({
          profile: data.profile ? { ...s.profile, ...data.profile } : s.profile,
          clients: data.clients ?? s.clients,
          invoices: data.invoices ?? s.invoices,
          preferences: data.preferences ? { ...s.preferences, ...data.preferences } : s.preferences,
        })),
    }),
    {
      name: "invoicegen-local-store",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
          : window.localStorage,
      ),
      version: 1,
    },
  ),
);

export const defaultLocalProfile = emptyProfile;
export const defaultLocalPreferences = defaultPreferences;
export type { Store as InvoiceStore };
