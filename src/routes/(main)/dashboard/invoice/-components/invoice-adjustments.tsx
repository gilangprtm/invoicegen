import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { type InvoiceFormValues, invoiceTaxOptions } from "./data";

const taxItems = [
  ...invoiceTaxOptions.map((taxOption) => ({
    value: taxOption.id,
    label: `${taxOption.name} (${taxOption.rate}%)`,
  })),
  { value: "custom", label: "Custom tax" },
];

const discountTypeItems = [
  { value: "fixed", label: "Fixed amount" },
  { value: "percent", label: "Percent" },
] as const;

export function InvoiceAdjustments() {
  const { control, register, setValue, watch } = useFormContext<InvoiceFormValues>();
  const discountType = useWatch({ control, name: "discountType" });
  const taxId = useWatch({ control, name: "taxId" });
  const customTaxRate = watch("taxRate");

  const selectedTax = invoiceTaxOptions.find((taxOption) => taxOption.id === taxId);
  const taxLabel = selectedTax?.name ?? "Custom";
  const taxRate = selectedTax?.rate ?? customTaxRate ?? 0;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">Adjustments</h2>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Controller
          control={control}
          name="taxId"
          render={({ field }) => (
            <Field className="gap-1">
              <FieldLabel className="text-xs">Tax</FieldLabel>
              <Select
                items={taxItems}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== "custom") {
                    const preset = invoiceTaxOptions.find((taxOption) => taxOption.id === value);
                    setValue("taxLabel", preset?.name ?? "");
                    setValue("taxRate", preset?.rate ?? 0);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {taxItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        {taxId === "custom" ? (
          <div className="grid grid-cols-[1fr_112px] gap-4">
            <Field className="gap-1">
              <FieldLabel className="text-xs">Tax label</FieldLabel>
              <Input placeholder="e.g. PPN, Service tax" {...register("taxLabel")} />
            </Field>
            <Field className="gap-1">
              <FieldLabel className="text-xs">Rate %</FieldLabel>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                aria-label="Custom tax rate"
                {...register("taxRate", { valueAsNumber: true })}
              />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_112px] gap-4">
            <Field className="gap-1">
              <FieldLabel className="text-xs">Tax (active)</FieldLabel>
              <div className="flex h-10 items-center rounded-md border px-3 text-muted-foreground text-sm">
                {taxLabel} ({taxRate}%)
              </div>
            </Field>
            <Field className="gap-1">
              <FieldLabel className="text-xs opacity-0">Value</FieldLabel>
              <div className="flex h-10 items-center rounded-md border px-3 text-muted-foreground text-sm">
                {taxRate}%
              </div>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-[1fr_112px] gap-4">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Field className="gap-1">
                <FieldLabel className="text-xs">Discount</FieldLabel>
                <Select items={discountTypeItems} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {discountTypeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field className="gap-1">
            <FieldLabel className="text-xs opacity-0">Value</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="number"
                step="0.01"
                aria-label="Discount value"
                {...register("discountValue", { valueAsNumber: true })}
              />
              <InputGroupAddon align="inline-end">{discountType === "fixed" ? "$" : "%"}</InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </div>
    </section>
  );
}
