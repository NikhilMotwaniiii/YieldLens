"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, X } from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { FieldErrors, FieldValues, Path, UseFormRegister, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchBonds, suggestBonds } from "@/lib/api/bonds";
import { addPosition } from "@/lib/api/portfolios";
import { formatDate, formatInr, formatPercent } from "@/lib/formatting/numbers";
import { manualBondSchema, positionSchema } from "@/lib/validation/position";
import type { BondSearchResult } from "@/types/api";

type PositionFormValues = z.infer<typeof positionSchema>;
type ManualFormValues = z.infer<typeof manualBondSchema>;

export function AddBondDrawer({
  open,
  onClose,
  portfolioId
}: {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<BondSearchResult | null>(null);
  const [manual, setManual] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const positionForm = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: { quantity: 1, purchase_price: "", purchase_date: "", manual_current_price: "" }
  });
  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualBondSchema),
    defaultValues: {
      quantity: 1,
      purchase_price: "",
      purchase_date: "",
      manual_current_price: "",
      isin: "",
      issuer: "",
      security_name: "",
      coupon_rate: 7.5,
      maturity_date: "",
      face_value: 1000,
      credit_rating: "",
      sector: "",
      duration: "",
      latest_yield: "",
      latest_price: ""
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), 400);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setSelected(null);
      setManual(false);
      setActiveIndex(0);
      positionForm.reset();
      manualForm.reset();
    }
  }, [manualForm, open, positionForm]);

  const searchQuery = useQuery({
    queryKey: ["bond-search", debouncedQuery],
    queryFn: () => searchBonds(debouncedQuery),
    enabled: open && !manual && debouncedQuery.trim().length >= 2
  });
  const suggestionsQuery = useQuery({
    queryKey: ["bond-suggestions"],
    queryFn: suggestBonds,
    enabled: open && !manual
  });

  const showingSuggestions = debouncedQuery.trim().length < 2;
  const results = showingSuggestions ? (suggestionsQuery.data ?? []) : (searchQuery.data ?? []);
  const resultsLoading = showingSuggestions ? suggestionsQuery.isLoading : searchQuery.isLoading;
  const resultsError = showingSuggestions ? suggestionsQuery.isError : searchQuery.isError;
  const addMutation = useMutation({
    mutationFn: (payload: { isin?: string; bond?: Record<string, unknown>; position: PositionFormValues }) =>
      addPosition(portfolioId, {
        isin: payload.isin,
        bond: payload.bond,
        quantity: Number(payload.position.quantity),
        purchase_price: optionalNumber(payload.position.purchase_price),
        purchase_date: optionalString(payload.position.purchase_date),
        manual_current_price: optionalNumber(payload.position.manual_current_price)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["scenario", portfolioId] });
      onClose();
    }
  });

  const manualMutation = useMutation({
    mutationFn: (values: ManualFormValues) =>
      addPosition(portfolioId, {
        bond: {
          isin: values.isin.toUpperCase(),
          issuer: values.issuer,
          security_name: values.security_name,
          coupon_rate: Number(values.coupon_rate),
          maturity_date: values.maturity_date,
          face_value: Number(values.face_value),
          currency: "INR",
          credit_rating: optionalString(values.credit_rating),
          sector: optionalString(values.sector),
          bond_type: "Manual",
          duration: optionalNumber(values.duration),
          latest_price: optionalNumber(values.latest_price),
          latest_yield: optionalNumber(values.latest_yield),
          price_source: optionalNumber(values.latest_price) !== null ? "manual reference price" : null,
          provider_name: "Manual Entry",
          provider_identifier: values.isin.toUpperCase()
        },
        quantity: Number(values.quantity),
        purchase_price: optionalNumber(values.purchase_price),
        purchase_date: optionalString(values.purchase_date),
        manual_current_price: optionalNumber(values.manual_current_price)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["scenario", portfolioId] });
      onClose();
    }
  });

  const selectedRows = useMemo(
    () =>
      selected
        ? [
            ["Issuer", selected.issuer],
            ["ISIN", selected.isin],
            ["Coupon", formatPercent(selected.coupon_rate)],
            ["Maturity", formatDate(selected.maturity_date)],
            ["Face Value", formatInr(selected.face_value)],
            ["Credit Rating", selected.credit_rating ?? "Unrated / Unknown"],
            ["Latest Price", selected.latest_price ? formatInr(selected.latest_price) : "Not available"],
            ["Latest Yield", selected.latest_yield ? formatPercent(selected.latest_yield) : "Not available"],
            ["Data Source", selected.provider_name ?? "Not available"],
            ["Price Source", selected.price_source ?? "Not available"]
          ]
        : [],
    [selected]
  );

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectBond(results[activeIndex]);
    }
  }

  function selectBond(bond: BondSearchResult) {
    setSelected(bond);
    setActiveIndex(0);
    positionForm.setValue(
      "manual_current_price",
      bond.latest_price ? Number(bond.latest_price) : ""
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-night/55 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-line bg-paper shadow-desk">
        <div className="flex items-center justify-between border-b border-line bg-panel p-5">
          <div>
            <h2 className="text-lg font-semibold">Add Bond</h2>
            <p className="mt-1 text-sm text-muted">Search Indian bonds or add one manually.</p>
          </div>
          <button aria-label="Close add bond drawer" className="rounded-md p-2 hover:bg-paper" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!manual ? (
            <>
              <label className="text-sm font-semibold">Search Indian Bonds</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 text-muted" size={17} />
                <Input
                  className="pl-10"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelected(null);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search by issuer, ISIN or security name"
                  aria-autocomplete="list"
                />
              </div>

              {selected ? (
                <SelectedBondSummary
                  bond={selected}
                  onChange={() => {
                    setSelected(null);
                    positionForm.reset();
                  }}
                />
              ) : (
                <SearchResults
                  loading={resultsLoading}
                  error={resultsError}
                  results={results}
                  activeIndex={activeIndex}
                  showingSuggestions={showingSuggestions}
                  onSelect={selectBond}
                />
              )}

              {selected ? (
                <form
                  id="selected-bond-position-form"
                  className="mt-4 animate-[fadeIn_180ms_ease-out]"
                  onSubmit={positionForm.handleSubmit((values) =>
                    addMutation.mutate({ isin: selected.isin, position: values })
                  )}
                >
                  <h3 className="text-sm font-semibold">Bond Information</h3>
                  <div className="mt-3 grid gap-3 rounded-md border border-line p-4 sm:grid-cols-2">
                    {selectedRows.map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted">{label}</p>
                        <p className="mt-1 text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                  <PositionFields register={positionForm.register} errors={positionForm.formState.errors} />
                  <FormError error={addMutation.error} />
                </form>
              ) : null}
            </>
          ) : (
            <ManualForm form={manualForm} pending={manualMutation.isPending} error={manualMutation.error} onSubmit={manualMutation.mutate} />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-panel p-5">
          <Button variant="ghost" onClick={() => setManual((value) => !value)}>
            {manual ? "Search Bonds" : "Enter Manually"}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {selected && !manual ? (
              <Button type="submit" form="selected-bond-position-form" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add to Portfolio"}
              </Button>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SelectedBondSummary({
  bond,
  onChange
}: {
  bond: BondSearchResult;
  onChange: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-accent/30 bg-accent-soft p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={20} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Bond selected</p>
              <p className="mt-1 text-base font-semibold text-ink">{bond.issuer}</p>
              <p className="mt-1 text-sm text-muted">
                {formatPercent(bond.coupon_rate)} • {formatDate(bond.maturity_date)} • {bond.isin}
              </p>
            </div>
            <button
              type="button"
              onClick={onChange}
              className="h-9 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-ink hover:bg-paper"
            >
              Change
            </button>
          </div>
          <p className="mt-3 text-sm text-muted">
            Current price per unit is prefilled from available reference data. If it does not match
            your view, you can enter it manually below.
          </p>
        </div>
      </div>
    </div>
  );
}

function SearchResults({
  loading,
  error,
  results,
  activeIndex,
  showingSuggestions,
  onSelect
}: {
  loading: boolean;
  error: boolean;
  results: BondSearchResult[];
  activeIndex: number;
  showingSuggestions: boolean;
  onSelect: (bond: BondSearchResult) => void;
}) {
  if (loading) {
    return <div className="mt-3 h-24 animate-pulse rounded-md bg-paper" />;
  }
  if (error) {
    return (
      <p className="mt-3 rounded-md border border-[#efb0aa] bg-[#fff0ee] p-3 text-sm text-loss">
        Bond search is temporarily unavailable. You can still add a bond manually.
      </p>
    );
  }
  if (!results.length) {
    return (
      <p className="mt-3 rounded-md border border-line bg-paper p-3 text-sm text-muted">
        {showingSuggestions
          ? "No suggested bonds are available. Try searching by issuer or ISIN."
          : "No matching Indian bonds found."}
      </p>
    );
  }
  return (
    <div className="mt-3">
      {showingSuggestions ? (
        <div className="mb-2 rounded-md border border-line bg-panel p-3 text-xs leading-5 text-muted">
          Suggested demo bonds are shown because no live free API is configured yet. Start typing to
          filter by issuer, ISIN, or security name.
        </div>
      ) : null}
      <div className="max-h-[42vh] overflow-y-auto rounded-md border border-line" role="listbox">
        {results.map((result, index) => (
          <button
            key={result.isin}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => onSelect(result)}
            className={`block w-full border-b border-line px-4 py-3 text-left transition last:border-0 ${
              index === activeIndex ? "bg-accent-soft ring-1 ring-inset ring-accent/30" : "bg-panel hover:bg-paper"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{result.issuer}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatPercent(result.coupon_rate)} • {formatDate(result.maturity_date)} • {result.isin}
                </p>
              </div>
              <span className="shrink-0 rounded-sm border border-line px-2 py-1 text-[11px] font-semibold text-muted">
                {result.provider_name?.includes("Live") ? "Live" : "Demo"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PositionFields<T extends FieldValues>({
  register,
  errors
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold">Your Position</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Quantity / Units" error={String(errors.quantity?.message ?? "")}>
          <Input type="number" step="0.0001" {...register("quantity" as Path<T>)} />
        </Field>
        <Field label="Purchase Price per Unit" error={String(errors.purchase_price?.message ?? "")}>
          <Input type="number" step="0.01" {...register("purchase_price" as Path<T>)} />
        </Field>
        <Field label="Purchase Date" error={String(errors.purchase_date?.message ?? "")}>
          <Input type="date" {...register("purchase_date" as Path<T>)} />
        </Field>
        <Field
          label="Current Price per Unit"
          hint="Prefilled when reference price is available. Edit it if your current price is different."
          error={String(errors.manual_current_price?.message ?? "")}
        >
          <Input type="number" step="0.01" {...register("manual_current_price" as Path<T>)} />
        </Field>
      </div>
    </div>
  );
}

function ManualForm({
  form,
  pending,
  error,
  onSubmit
}: {
  form: ReturnType<typeof useForm<ManualFormValues>>;
  pending: boolean;
  error: unknown;
  onSubmit: (values: ManualFormValues) => void;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <h3 className="text-sm font-semibold">Manual Bond Entry</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="ISIN" error={form.formState.errors.isin?.message}>
          <Input {...form.register("isin")} placeholder="INE..." />
        </Field>
        <Field label="Issuer" error={form.formState.errors.issuer?.message}>
          <Input {...form.register("issuer")} />
        </Field>
        <Field label="Security Name" error={form.formState.errors.security_name?.message}>
          <Input {...form.register("security_name")} />
        </Field>
        <Field label="Coupon Rate" error={form.formState.errors.coupon_rate?.message}>
          <Input type="number" step="0.01" {...form.register("coupon_rate")} />
        </Field>
        <Field label="Maturity Date" error={form.formState.errors.maturity_date?.message}>
          <Input type="date" {...form.register("maturity_date")} />
        </Field>
        <Field label="Face Value" error={form.formState.errors.face_value?.message}>
          <Input type="number" step="0.01" {...form.register("face_value")} />
        </Field>
        <Field label="Credit Rating" error={form.formState.errors.credit_rating?.message}>
          <Input {...form.register("credit_rating")} />
        </Field>
        <Field label="Sector" error={form.formState.errors.sector?.message}>
          <Input {...form.register("sector")} />
        </Field>
        <Field label="Duration" error={form.formState.errors.duration?.message}>
          <Input type="number" step="0.01" {...form.register("duration")} />
        </Field>
        <Field label="Yield" error={form.formState.errors.latest_yield?.message}>
          <Input type="number" step="0.01" {...form.register("latest_yield")} />
        </Field>
        <Field
          label="Current / Reference Price per Unit"
          hint="Used as the starting current price for this manually entered bond."
          error={form.formState.errors.latest_price?.message}
        >
          <Input type="number" step="0.01" {...form.register("latest_price")} />
        </Field>
      </div>
      <PositionFields register={form.register} errors={form.formState.errors} />
      <FormError error={error} />
      <Button className="mt-5 w-full" disabled={pending}>
        {pending ? "Adding..." : "Add Manual Bond"}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint ? <span className="mt-1 block text-xs leading-4 text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-loss">{error}</span> : null}
    </label>
  );
}

function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
      <p className="mt-4 rounded-md border border-[#efb0aa] bg-[#fff0ee] p-3 text-sm text-loss">
      {error instanceof Error ? error.message : "Unable to add bond"}
    </p>
  );
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
