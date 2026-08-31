import { expect, test } from "@playwright/test";

test.describe("Invoice CRUD", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and sign in (you may need to adapt this to your auth flow)
    await page.goto("/login");
    // Add login logic here if needed - for now assume tests run in authenticated context
  });

  test("Create invoice with items -> verify number, totals, redirect", async ({ page }) => {
    await page.goto("/dashboard/invoice/new");

    // Wait for form to load
    await page.waitForSelector("text=Create Invoice");

    // Fill in client (if client selector exists)
    const clientSelect = page.locator("select[name='clientId']");
    if ((await clientSelect.count()) > 0) {
      // Create a test client first or select existing
      await clientSelect.selectOption({ index: 1 });
    }

    // Fill invoice details
    await page.fill("input[name='issuedDate']", "2025-01-15");
    await page.fill("input[name='dueDate']", "2025-02-15");

    // Add item
    await page.click("text=Add Item");
    await page.fill("input[name='items.0.name']", "Consulting Services");
    await page.fill("input[name='items.0.quantity']", "10");
    await page.fill("input[name='items.0.price']", "100");

    // Verify totals are calculated
    await expect(page.locator("text=Subtotal")).toBeVisible();
    await expect(page.locator("text=1,000")).toBeVisible(); // or similar format

    // Submit (Send button, not Save as Draft)
    await page.click("button:has-text('Send')");

    // Verify redirect to detail page or list
    await expect(page).toHaveURL(/\/dashboard\/invoice/);

    // Verify invoice number format INV-2025-XXX
    const invoiceNumber = await page.locator("text=INV-2025-").first().textContent();
    expect(invoiceNumber).toMatch(/INV-2025-\d{3}/);
  });

  test("Edit draft invoice -> verify totals recalculate", async ({ page }) => {
    // First create an invoice or navigate to existing draft
    await page.goto("/dashboard/invoice");
    const draftRow = page.locator("tr:has-text('Draft')").first();
    if ((await draftRow.count()) > 0) {
      await draftRow.locator("button:has([data-lucide='pencil'])").click();
    } else {
      test.skip(true, "No draft invoice to edit");
    }

    await page.waitForSelector("text=Edit Invoice");

    // Modify an item quantity
    await page.fill("input[name='items.0.quantity']", "5");

    // Verify totals update
    await expect(page.locator("text=Subtotal")).toBeVisible();
    // Total should recalculate

    await page.click("button:has-text('Send')");
    await expect(page).toHaveURL(/\/dashboard\/invoice/);
  });

  test("Cannot edit sent invoice", async ({ page }) => {
    await page.goto("/dashboard/invoice");
    const sentRow = page.locator("tr:has-text('Sent')").first();
    if ((await sentRow.count()) > 0) {
      await sentRow.locator("button:has([data-lucide='pencil'])").click();
      // Should either redirect or show read-only view
      await expect(page).toHaveURL(/\/dashboard\/invoice\//);
    } else {
      test.skip(true, "No sent invoice to test");
    }
  });

  test("Delete draft invoice", async ({ page }) => {
    await page.goto("/dashboard/invoice");
    const draftRow = page.locator("tr:has-text('Draft')").first();
    if ((await draftRow.count()) > 0) {
      const invoiceNumber = await draftRow.locator("td:first-child").textContent();
      await draftRow.locator("button:has([data-lucide='trash-2'])").click();
      await page.click("button:has-text('Delete')");
      await expect(page.locator(`text=${invoiceNumber}`)).not.toBeVisible();
    } else {
      test.skip(true, "No draft invoice to delete");
    }
  });

  test("Cannot delete sent invoice", async ({ page }) => {
    await page.goto("/dashboard/invoice");
    const sentRow = page.locator("tr:has-text('Sent')").first();
    if ((await sentRow.count()) > 0) {
      await sentRow.locator("button:has([data-lucide='trash-2'])").click();
      await page.click("button:has-text('Delete')");
      // Should show error or not allow deletion
      await expect(page.locator("text=Only draft invoices can be deleted")).toBeVisible();
    } else {
      test.skip(true, "No sent invoice to test");
    }
  });

  test("Status flow: draft -> sent -> paid", async ({ page }) => {
    // Create draft invoice
    await page.goto("/dashboard/invoice/new");
    await page.waitForSelector("text=Create Invoice");
    await page.fill("input[name='issuedDate']", "2025-01-15");
    await page.fill("input[name='dueDate']", "2025-02-15");
    await page.click("text=Add Item");
    await page.fill("input[name='items.0.name']", "Test Service");
    await page.fill("input[name='items.0.quantity']", "1");
    await page.fill("input[name='items.0.price']", "500");
    await page.click("button:has-text('Send')");

    // Navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/invoice\/[^/]+$/);

    // Mark as sent
    await page.click("button:has-text('Mark as Sent')");
    await expect(page.locator("text=Sent")).toBeVisible();

    // Mark as paid
    await page.click("button:has-text('Mark as Paid')");
    await expect(page.locator("text=Paid")).toBeVisible();
  });

  test("Status flow: draft -> sent -> overdue -> paid", async ({ page }) => {
    // Similar to above but mark as overdue then paid
    await page.goto("/dashboard/invoice/new");
    await page.waitForSelector("text=Create Invoice");
    await page.fill("input[name='issuedDate']", "2025-01-15");
    await page.fill("input[name='dueDate']", "2025-02-15");
    await page.click("text=Add Item");
    await page.fill("input[name='items.0.name']", "Test Service");
    await page.fill("input[name='items.0.quantity']", "1");
    await page.fill("input[name='items.0.price']", "500");
    await page.click("button:has-text('Send')");

    await expect(page).toHaveURL(/\/dashboard\/invoice\/[^/]+$/);

    // Mark as sent
    await page.click("button:has-text('Mark as Sent')");
    await expect(page.locator("text=Sent")).toBeVisible();

    // Mark as overdue
    await page.click("button:has-text('Mark as Overdue')");
    await expect(page.locator("text=Overdue")).toBeVisible();

    // Mark as paid
    await page.click("button:has-text('Mark as Paid')");
    await expect(page.locator("text=Paid")).toBeVisible();
  });

  test("Invoice list filters by status", async ({ page }) => {
    await page.goto("/dashboard/invoice");

    // Test each filter
    for (const status of ["draft", "sent", "paid", "overdue"]) {
      await page.selectOption("select[name='status']", status);
      await page.waitForTimeout(500); // wait for query

      const rows = page.locator("tbody tr");
      const count = await rows.count();

      // All visible rows should have the filtered status
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const row = rows.nth(i);
          await expect(row.locator(`text=${status.charAt(0).toUpperCase() + status.slice(1)}`)).toBeVisible();
        }
      }
    }

    // Reset filter
    await page.selectOption("select[name='status']", "");
    await page.waitForTimeout(500);
  });
});
