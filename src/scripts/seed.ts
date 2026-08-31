import { db } from "../db/index";
import { clients, invoiceItems, invoiceSequences, invoices, tasks, users } from "../db/schema";

const USER_ID = "seed-test-user-001";

async function seed() {
  console.log("🌱  Seeding database ...\n");

  // ── Clear existing data (FK order) ──
  console.log("  Clearing existing data …");
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(tasks);
  await db.delete(invoiceSequences);
  await db.delete(clients);
  await db.delete(users);
  console.log("  ✓ Done\n");

  // ── 1. User ──
  console.log("  Creating user …");
  await db.insert(users).values({
    id: USER_ID,
    name: "Demo Freelancer",
    email: "demo@example.com",
  });
  console.log("  ✓ User created\n");

  // ── 2. Clients ──
  console.log("  Creating clients …");
  const clientData = [
    {
      name: "Acme Corp",
      email: "billing@acme.com",
      phone: "+62-21-5550100",
      address: "Jl. Sudirman No. 1, Jakarta",
    },
    {
      name: "PT Startup Digital",
      email: "finance@startupdigital.id",
      phone: "+62-21-5550101",
      address: "Jl. Gatot Subroto No. 42, Jakarta",
    },
    {
      name: "CV Kreatif Mandiri",
      email: "admin@kreatifmandiri.co.id",
      phone: "+62-811-5550102",
      address: "Jl. Braga No. 88, Bandung",
    },
  ];

  const insertedClients = await db
    .insert(clients)
    .values(clientData.map((c) => ({ ...c, userId: USER_ID })))
    .returning();
  console.log(`  ✓ ${insertedClients.length} clients created\n`);

  // --- 3. Invoices ---
  console.log("  Creating invoices …");

  // Draft invoice
  const draftInvoice = await db
    .insert(invoices)
    .values({
      userId: USER_ID,
      clientId: insertedClients[0].id,
      number: "INV-2025-001",
      currency: "IDR",
      subtotal: "15000000",
      taxRate: "11",
      taxAmount: "1650000",
      total: "16650000",
      status: "draft",
      note: "Website redesign — initial draft",
      issuedDate: "2025-07-01",
      dueDate: "2025-07-31",
    })
    .returning();

  // Paid invoice
  const paidInvoice = await db
    .insert(invoices)
    .values({
      userId: USER_ID,
      clientId: insertedClients[1].id,
      number: "INV-2025-002",
      currency: "USD",
      subtotal: "2000",
      taxRate: "11",
      taxAmount: "220",
      total: "2220",
      status: "paid",
      note: "Monthly retainer — June 2025",
      issuedDate: "2025-06-01",
      dueDate: "2025-06-30",
      paidAt: new Date("2025-06-28"),
    })
    .returning();

  console.log("  ✓ Invoices created\n");

  // ── 4. Invoice Items ──
  console.log("  Creating invoice items …");

  // Items for draft invoice
  await db.insert(invoiceItems).values([
    {
      invoiceId: draftInvoice[0].id,
      name: "UI/UX Design — Homepage",
      quantity: "1",
      price: "8000000",
      total: "8000000",
    },
    {
      invoiceId: draftInvoice[0].id,
      name: "Frontend Development",
      quantity: "1",
      price: "7000000",
      total: "7000000",
    },
  ]);

  // Items for paid invoice
  await db.insert(invoiceItems).values([
    {
      invoiceId: paidInvoice[0].id,
      name: "Monthly Maintenance",
      quantity: "1",
      price: "1200",
      total: "1200",
    },
    {
      invoiceId: paidInvoice[0].id,
      name: "Hosting & Domain",
      quantity: "1",
      price: "800",
      total: "800",
    },
  ]);

  console.log("  ✓ Invoice items created\n");

  // ── 5. Tasks ──
  console.log("  Creating tasks …");
  await db.insert(tasks).values([
    {
      userId: USER_ID,
      title: "Design landing page mockup",
      description: "Create Figma mockup for the new landing page redesign.",
      status: "todo",
      priority: "high",
      dueDate: "2025-08-15",
      position: 0,
    },
    {
      userId: USER_ID,
      title: "Implement payment gateway",
      description: "Integrate Midtrans payment gateway for invoice payments.",
      status: "in_progress",
      priority: "medium",
      dueDate: "2025-08-10",
      position: 0,
    },
    {
      userId: USER_ID,
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      status: "done",
      priority: "low",
      dueDate: "2025-07-25",
      position: 0,
    },
  ]);
  console.log("  ✓ Tasks created\n");

  // ── 6. Invoice Sequence ──
  console.log("  Creating invoice sequence …");
  await db.insert(invoiceSequences).values({
    userId: USER_ID,
    lastNumber: 0,
  });
  console.log("  ✓ Invoice sequence created\n");

  console.log("✅ Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
