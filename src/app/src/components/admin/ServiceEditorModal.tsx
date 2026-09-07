import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ImageUploadField } from "./ImageUploadField";
import {
  Search,
  Check,
  AlertTriangle,
  Loader2,
  CheckSquare,
} from "lucide-react";
import type { Service } from "../../schema/service.schema";
import type { Category } from "../../schema/service.schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceFormData {
  name: string;
  category_id: string;
  price: string;
  duration: string;
  description: string;
  is_active: boolean;
  is_add_on: boolean;
  has_addons: boolean;
  image_url: string;
  display_order: number;
}

interface ServiceEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode, non-null = edit mode */
  service: Service | null;
  categories: Category[];
  /** All services that are add-ons (is_add_on = true) */
  addonServices: Service[];
  /** IDs of add-ons already mapped to this service (edit mode) */
  initialAddonIds?: string[];
  isCategoriesLoading?: boolean;
  onSave: (
    data: ServiceFormData,
    addonIds: string[],
  ) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: ServiceFormData = {
  name: "",
  category_id: "",
  price: "",
  duration: "",
  description: "",
  is_active: true,
  is_add_on: false,
  has_addons: false,
  image_url: "",
  display_order: 0,
};

const inputCls =
  "flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E9CFCA]";
const inputStyle = {
  borderColor: "#DCD4CD",
  backgroundColor: "#FEFCFA",
  color: "#3D3935",
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9CFCA] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: checked ? "#3D3935" : "#DCD4CD",
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200"
        style={{
          transform: checked ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

// ─── Add-on card ─────────────────────────────────────────────────────────────

function AddonCard({
  addon,
  selected,
  onToggle,
}: {
  addon: Service;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-start rounded-lg border-2 p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9CFCA]"
      style={{
        borderColor: selected ? "#3D3935" : "#DCD4CD",
        backgroundColor: selected ? "#FAF7F5" : "#FEFCFA",
      }}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        {/* Custom checkbox */}
        <span
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors"
          style={{
            borderColor: selected ? "#3D3935" : "#DCD4CD",
            backgroundColor: selected ? "#3D3935" : "transparent",
          }}
        >
          {selected && (
            <Check className="h-2.5 w-2.5" style={{ color: "#FCEAE0" }} />
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "#3D3935" }}
          >
            {addon.name}
          </p>
          {addon.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {addon.description}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#FCEAE0", color: "#3D3935" }}
          >
            +£{addon.price}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#DCD4CD", color: "#3D3935" }}
          >
            +{addon.duration} min
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServiceEditorModal({
  open,
  onOpenChange,
  service,
  categories,
  addonServices,
  initialAddonIds = [],
  isCategoriesLoading = false,
  onSave,
}: ServiceEditorModalProps) {
  const isEdit = service !== null;

  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [addonEnabled, setAddonEnabled] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [addonSearch, setAddonSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate form when service prop changes
  useEffect(() => {
    if (open) {
      if (service) {
        setForm({
          name: service.name,
          category_id: service.category_id ?? "",
          price: service.price.toString(),
          duration: service.duration.toString(),
          description: service.description,
          is_active: service.is_active,
          is_add_on: service.is_add_on ?? false,
          has_addons: service.has_addons ?? false,
          image_url: service.image_url ?? "",
          display_order: service.display_order ?? 0,
        });
        const hasExisting = initialAddonIds.length > 0;
        setAddonEnabled(service.has_addons ?? hasExisting);
        setSelectedAddonIds(initialAddonIds);
      } else {
        setForm(EMPTY_FORM);
        setAddonEnabled(false);
        setSelectedAddonIds([]);
      }
      setAddonSearch("");
      setSaved(false);
      setSaveError(null);
    }
  }, [open, service, initialAddonIds]);

  const set = (k: keyof ServiceFormData) => (v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Filtered add-ons by search
  const filteredAddons = useMemo(() => {
    const q = addonSearch.trim().toLowerCase();
    return q
      ? addonServices.filter((a) => a.name.toLowerCase().includes(q))
      : addonServices;
  }, [addonServices, addonSearch]);

  const allSelected =
    filteredAddons.length > 0 &&
    filteredAddons.every((a) => selectedAddonIds.includes(a.id!));

  const toggleAddon = (id: string) =>
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const selectAll = () =>
    setSelectedAddonIds((prev) => [
      ...new Set([...prev, ...filteredAddons.map((a) => a.id!)]),
    ]);

  const clearAll = () =>
    setSelectedAddonIds((prev) =>
      prev.filter((id) => !filteredAddons.some((a) => a.id === id)),
    );

  const canSave =
    form.name.trim().length >= 2 &&
    form.category_id &&
    form.price &&
    form.description.trim().length >= 5 &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const finalAddonIds = addonEnabled ? [...new Set(selectedAddonIds)] : [];
      await onSave({ ...form, has_addons: addonEnabled }, finalAddonIds);
      setSaved(true);
      setTimeout(() => {
        onOpenChange(false);
        setSaved(false);
      }, 600);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 border-b sticky top-0 z-10"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#3D3935" }}>
              {isEdit ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {isEdit
                ? "Update service details and configure available add-ons."
                : "Fill in the details below to add a new service to your menu."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* ── Basic Info ── */}
          <section className="space-y-4">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#9ca3af" }}
            >
              Service Details
            </h3>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D3935" }}>
                Service Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                style={inputStyle}
                placeholder="e.g. Gel Manicure"
                value={form.name}
                maxLength={100}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D3935" }}>
                Category <span className="text-red-400">*</span>
              </label>
              {isCategoriesLoading ? (
                <div className={inputCls} style={inputStyle}>
                  <span className="text-gray-400 text-sm">Loading categories…</span>
                </div>
              ) : (
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.category_id}
                  onChange={(e) => set("category_id")(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Price + Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "#3D3935" }}>
                  Base Price (£) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  style={inputStyle}
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set("price")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "#3D3935" }}>
                  Duration (min) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  className={inputCls}
                  style={inputStyle}
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) => set("duration")(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "#3D3935" }}>
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                className="flex w-full rounded-md border px-3 py-2 text-sm resize-none outline-none transition-colors focus:ring-2 focus:ring-[#E9CFCA]"
                style={inputStyle}
                placeholder="Brief description shown on service cards…"
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
              />
              <p className="text-xs text-gray-400 text-end">
                {form.description.length}/500
              </p>
            </div>

            {/* Image upload */}
            <ImageUploadField
              folder="services"
              label="Cover Image"
              hint="PNG, JPEG, or WebP · max 5 MB"
              accept=".png,.jpg,.jpeg,.webp"
              maxSizeMB={5}
              value={form.image_url}
              onChange={(url) => set("image_url")(url)}
              onRemove={() => set("image_url")("")}
              disabled={isSaving}
            />

            {/* Toggles row */}
            <div className="flex flex-wrap gap-6 pt-1">
              <div className="flex items-center gap-3">
                <Toggle
                  checked={form.is_active}
                  onChange={(v) => set("is_active")(v)}
                />
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  Active
                </span>
              </div>
              
            </div>
          </section>

          {/* ── Add-on Configuration ── */}
          {!form.is_add_on && (
            <section
              className="rounded-xl border-2 p-4 space-y-4"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
            >
              {/* Toggle header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#3D3935" }}>
                    Enable Add-ons for this Treatment
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Allow clients to attach extra add-ons to this service during
                    booking.
                  </p>
                </div>
                <Toggle
                  checked={addonEnabled}
                  onChange={setAddonEnabled}
                  disabled={addonServices.length === 0}
                />
              </div>

              {/* Expanded add-on selector */}
              {addonEnabled && (
                <>
                  {/* Search + bulk actions */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                      />
                      <input
                        type="text"
                        className="flex h-9 w-full rounded-md border ps-9 pe-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E9CFCA]"
                        style={inputStyle}
                        placeholder="Search available add-ons…"
                        value={addonSearch}
                        onChange={(e) => setAddonSearch(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={allSelected ? clearAll : selectAll}
                      className="shrink-0 text-xs font-medium px-3 py-2 rounded-md border transition-colors hover:bg-[#DCD4CD]"
                      style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                    >
                      {allSelected ? (
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5" /> Clear
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5" /> Select All
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Add-on grid */}
                  {filteredAddons.length === 0 ? (
                    <p className="text-sm text-center text-gray-400 py-4">
                      No add-ons match your search.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pe-1"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {filteredAddons.map((addon) => (
                        <AddonCard
                          key={addon.id}
                          addon={addon}
                          selected={selectedAddonIds.includes(addon.id!)}
                          onToggle={() => toggleAddon(addon.id!)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Warning: enabled but none selected */}
                  {selectedAddonIds.length === 0 && (
                    <div
                      className="flex items-start gap-2 rounded-lg border px-3 py-2.5"
                      style={{
                        borderColor: "#E9CFCA",
                        backgroundColor: "#FCEAE0",
                      }}
                    >
                      <AlertTriangle
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: "#3D3935" }}
                      />
                      <p className="text-xs" style={{ color: "#3D3935" }}>
                        No add-ons selected. The add-on step will be skipped for
                        clients booking this treatment.
                      </p>
                    </div>
                  )}

                  {/* Selected count badge */}
                  {selectedAddonIds.length > 0 && (
                    <p className="text-xs text-gray-500">
                      <span
                        className="font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        {selectedAddonIds.length}
                      </span>{" "}
                      add-on{selectedAddonIds.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </>
              )}

              {/* No add-on services exist */}
              {addonServices.length === 0 && (
                <p className="text-xs text-gray-400">
                  No add-on services found. Create services marked as "add-on"
                  first.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t sticky bottom-0 space-y-3"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        >
          {saveError && (
            <div
              className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: "#E9CFCA",
                backgroundColor: "#FCEAE0",
                color: "#3D3935",
              }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="min-w-[130px] transition-all"
            style={{
              backgroundColor: canSave ? "#3D3935" : "#DCD4CD",
              color: canSave ? "#FCEAE0" : "#9ca3af",
            }}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Saved
              </span>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Service"
            )}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
