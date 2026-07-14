import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { X } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DiscountType,
  AppliesToType,
  AssignType,
  UsagePerUser,
  GlobalUsage,
  PromoCodeInput,
} from "../../schema/promo-code.schema";
import { createPromoCode, updatePromoCode, getPromoCodeById } from "../../lib/db/promo-codes";

// ── helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6 border-2" style={{ borderColor: "#DCD4CD" }}>
      <h3 className="mb-5 text-base font-semibold" style={{ color: "#3D3935" }}>{title}</h3>
      {children}
    </Card>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: "#3D3935" }}>
      {children}
      {required && <span className="ml-0.5" style={{ color: "#8B2C2C" }}>*</span>}
    </label>
  );
}

function HelperText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

const border = (invalid?: boolean) => ({
  borderColor: invalid ? "#D0A096" : "#DCD4CD",
  backgroundColor: "#FEFCFA",
  color: "#3D3935",
});

const FILTER_OPS = ["at least", "at most", "exactly"] as const;
const DATE_OPS   = ["before", "after", "between"] as const;
const AMOUNT_OPS = ["greater than", "less than", "equal to", "between"] as const;

const MOCK_USERS = [
  "Emma Johnson", "Sarah Mitchell", "Olivia Chen", "Priya Sharma",
  "Chloe Adams", "Mei Lin", "Isabella Torres", "Anya Petrov",
];
const MOCK_SERVICES = [
  "Gel Manicure", "Russian Manicure", "BIAB Full Set", "Nail Extensions",
  "Shellac Application", "French Tip", "Complete Nail Course", "Advanced Nail Course",
];

function MultiSelectPills({ options, selected, onToggle, placeholder }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o));
  return (
    <div>
      <div
        className="min-h-[42px] border-2 p-2 flex flex-wrap gap-1.5 cursor-text"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        onClick={() => setOpen(true)}
      >
        {selected.map((s) => (
          <span key={s} className="flex items-center gap-1 px-2 py-0.5 text-sm border" style={{ backgroundColor: "#F1DFC0", borderColor: "#DCD4CD", color: "#3D3935" }}>
            {s}
            <button onClick={(e) => { e.stopPropagation(); onToggle(s); }}><X className="w-3 h-3" /></button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
          style={{ color: "#3D3935" }}
          placeholder={selected.length === 0 ? placeholder : ""}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="border-2 border-t-0 max-h-40 overflow-y-auto" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}>
          {filtered.map((o) => (
            <button key={o} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" style={{ color: "#3D3935" }} onMouseDown={() => { onToggle(o); setSearch(""); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminPromoCodeCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [codeName, setCodeName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountCap, setDiscountCap] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [appliesTo, setAppliesTo] = useState<AppliesToType>("all");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [assignTo, setAssignTo] = useState<AssignType>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [usagePerUser, setUsagePerUser] = useState<UsagePerUser>("once");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [globalUsage, setGlobalUsage] = useState<GlobalUsage>("unlimited");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");

  const [treatmentsOp, setTreatmentsOp] = useState("at least");
  const [treatmentsVal, setTreatmentsVal] = useState("");
  const [workshopsOp, setWorkshopsOp] = useState("at least");
  const [workshopsVal, setWorkshopsVal] = useState("");
  const [dateOp, setDateOp] = useState("after");
  const [dateVal1, setDateVal1] = useState("");
  const [dateVal2, setDateVal2] = useState("");
  const [amountOp, setAmountOp] = useState("greater than");
  const [amountVal1, setAmountVal1] = useState("");
  const [amountVal2, setAmountVal2] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing promo code data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      getPromoCodeById(id)
        .then((promo) => {
          if (!promo) {
            setSaveError("Promo code not found");
            return;
          }
          setCodeName(promo.name);
          setPromoCode(promo.code);
          setDiscountType(promo.discount_type);
          setDiscountValue(String(promo.discount_value));
          setDiscountCap(promo.max_cap ? String(promo.max_cap) : "");
          setStartDate(promo.start_date || "");
          setEndDate(promo.end_date || "");
          setIsActive(promo.is_active);
          setAppliesTo(promo.applies_to);
          setAssignTo(promo.assign_to);
          setUsagePerUser(promo.per_user_usage);
          setPerUserLimit(promo.per_user_limit ? String(promo.per_user_limit) : "");
          setGlobalUsage(promo.global_usage);
          setTotalUsageLimit(promo.global_limit ? String(promo.global_limit) : "");
        })
        .catch((err) => {
          console.error("Failed to load promo code:", err);
          setSaveError("Failed to load promo code: " + (err?.message || "Unknown error"));
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const invalid = (v: string) => submitted && !v.trim();
  const toggleService = (s: string) => setSelectedServices((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleUser = (u: string) => setSelectedUsers((p) => p.includes(u) ? p.filter((x) => x !== u) : [...p, u]);

  async function handleSubmit() {
    setSubmitted(true);
    setSaveError(null);
    if (!codeName.trim() || !promoCode.trim() || !discountValue.trim()) return;

    const input: PromoCodeInput = {
      name: codeName.trim(),
      code: promoCode.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      max_cap: discountCap ? parseFloat(discountCap) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: isActive,
      applies_to: appliesTo,
      assign_to: assignTo,
      per_user_usage: usagePerUser,
      per_user_limit: perUserLimit ? parseInt(perUserLimit) : null,
      global_usage: globalUsage,
      global_limit: totalUsageLimit ? parseInt(totalUsageLimit) : null,
    };

    try {
      setSaving(true);
      if (isEdit && id) {
        await updatePromoCode(id, input);
      } else {
        await createPromoCode(input);
      }
      navigate("/admin/promo-codes");
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <button className="text-sm mb-4 flex items-center gap-1 hover:underline" style={{ color: "#3D3935" }} onClick={() => navigate("/admin/promo-codes")}>
          ← Promo Codes
        </button>
        <h1 className="text-gray-800 mb-1">{isEdit ? "Edit Promo Code" : "Create New Code"}</h1>
        <p className="text-gray-600">Set up a promotional discount code.</p>
      </div>

      {saveError && (
        <div className="mb-6 px-4 py-3 border-2 text-sm" style={{ borderColor: "#D0A096", color: "#8B2C2C", backgroundColor: "#F9E6E4" }}>
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* A */}
        <SectionCard title="A. Basic Information">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel required>Code Name</FieldLabel>
              <Input value={codeName} onChange={(e) => setCodeName(e.target.value)} placeholder="e.g. Summer Repeat Clients" style={border(invalid(codeName))} />
              {invalid(codeName) && <p className="mt-1 text-xs" style={{ color: "#8B2C2C" }}>Required</p>}
            </div>
            <div>
              <FieldLabel required>Promo Code</FieldLabel>
              <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" className="font-mono" style={border(invalid(promoCode))} />
              <HelperText>This is the code users will enter at checkout.</HelperText>
              {invalid(promoCode) && <p className="mt-1 text-xs" style={{ color: "#8B2C2C" }}>Required</p>}
            </div>
          </div>
        </SectionCard>

        {/* B */}
        <SectionCard title="B. Discount">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Discount Type</FieldLabel>
              <div className="flex border-2" style={{ borderColor: "#DCD4CD", width: "fit-content" }}>
                {(["percentage", "fixed"] as DiscountType[]).map((t) => (
                  <button key={t} className="px-5 py-2 text-sm font-medium transition-colors" style={{ backgroundColor: discountType === t ? "#3D3935" : "transparent", color: discountType === t ? "#FEFCFA" : "#3D3935" }} onClick={() => setDiscountType(t)}>
                    {t === "percentage" ? "Percentage" : "Fixed Amount"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel required>Discount Value</FieldLabel>
              <div className="flex items-center border-2" style={border(invalid(discountValue))}>
                <span className="px-3 py-2 text-sm border-r-2" style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "#FAF7F5" }}>{discountType === "percentage" ? "%" : "£"}</span>
                <input className="flex-1 px-3 py-2 text-sm outline-none bg-transparent" style={{ color: "#3D3935" }} placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 10.00"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} type="number" min="0" />
              </div>
              {invalid(discountValue) && <p className="mt-1 text-xs" style={{ color: "#8B2C2C" }}>Required</p>}
            </div>
            {discountType === "percentage" && (
              <div>
                <FieldLabel>Maximum Discount Cap</FieldLabel>
                <div className="flex items-center border-2" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}>
                  <span className="px-3 py-2 text-sm border-r-2" style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "#FAF7F5" }}>£</span>
                  <input className="flex-1 px-3 py-2 text-sm outline-none bg-transparent" style={{ color: "#3D3935" }} placeholder="e.g. 50.00" value={discountCap} onChange={(e) => setDiscountCap(e.target.value)} type="number" min="0" />
                </div>
                <HelperText>Optional. Recommended for percentage discounts.</HelperText>
              </div>
            )}
          </div>
        </SectionCard>

        {/* C */}
        <SectionCard title="C. Validity">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Start Date</FieldLabel>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={border()} />
              </div>
              <div>
                <FieldLabel>End Date</FieldLabel>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={border()} />
              </div>
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="flex items-center gap-3">
                <button className="relative w-12 h-6 transition-colors" style={{ backgroundColor: isActive ? "#3D3935" : "#DCD4CD" }} onClick={() => setIsActive((v) => !v)}>
                  <span className="absolute top-1 w-4 h-4 bg-white transition-all" style={{ left: isActive ? "calc(100% - 20px)" : "4px" }} />
                </button>
                <span className="text-sm" style={{ color: "#3D3935" }}>{isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* D */}
        <SectionCard title="D. Applies To">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Applies To</FieldLabel>
              <select className="w-full border-2 px-3 py-2 text-sm outline-none" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }} value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as AppliesToType)}>
                <option value="all">All services</option>
                <option value="treatments">Treatments</option>
                <option value="workshops">Workshops</option>
                <option value="specific">Specific services</option>
              </select>
            </div>
            {appliesTo === "specific" && (
              <div>
                <FieldLabel>Select Services</FieldLabel>
                <MultiSelectPills options={MOCK_SERVICES} selected={selectedServices} onToggle={toggleService} placeholder="Search services..." />
              </div>
            )}
          </div>
        </SectionCard>

        {/* E */}
        <SectionCard title="E. Audience / Assignment">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Assign To</FieldLabel>
              <div className="flex flex-col gap-2 mt-1">
                {([{ value: "all", label: "All users" }, { value: "specific", label: "Specific users" }, { value: "filter", label: "Filter users" }] as { value: AssignType; label: string }[]).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "#3D3935" }}>
                    <input type="radio" name="assignTo" value={opt.value} checked={assignTo === opt.value} onChange={() => setAssignTo(opt.value)} style={{ accentColor: "#3D3935" }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {assignTo === "specific" && (
              <div>
                <FieldLabel>Select Users</FieldLabel>
                <MultiSelectPills options={MOCK_USERS} selected={selectedUsers} onToggle={toggleUser} placeholder="Search users..." />
              </div>
            )}
            {assignTo === "filter" && (
              <div className="flex flex-col gap-4 border-2 p-4" style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3D3935" }}>Filter Rules</p>
                <div>
                  <FieldLabel>Treatments booked</FieldLabel>
                  <div className="flex gap-2">
                    <select className="border-2 px-2 py-1.5 text-sm outline-none" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }} value={treatmentsOp} onChange={(e) => setTreatmentsOp(e.target.value)}>
                      {FILTER_OPS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <Input type="number" min="0" placeholder="0" value={treatmentsVal} onChange={(e) => setTreatmentsVal(e.target.value)} style={border()} className="w-24" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Workshops attended</FieldLabel>
                  <div className="flex gap-2">
                    <select className="border-2 px-2 py-1.5 text-sm outline-none" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }} value={workshopsOp} onChange={(e) => setWorkshopsOp(e.target.value)}>
                      {FILTER_OPS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <Input type="number" min="0" placeholder="0" value={workshopsVal} onChange={(e) => setWorkshopsVal(e.target.value)} style={border()} className="w-24" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Booking date</FieldLabel>
                  <div className="flex gap-2 flex-wrap items-center">
                    <select className="border-2 px-2 py-1.5 text-sm outline-none" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }} value={dateOp} onChange={(e) => setDateOp(e.target.value)}>
                      {DATE_OPS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <Input type="date" value={dateVal1} onChange={(e) => setDateVal1(e.target.value)} style={border()} />
                    {dateOp === "between" && (<><span className="text-sm text-gray-500">and</span><Input type="date" value={dateVal2} onChange={(e) => setDateVal2(e.target.value)} style={border()} /></>)}
                  </div>
                </div>
                <div>
                  <FieldLabel>Total amount paid</FieldLabel>
                  <div className="flex gap-2 flex-wrap items-center">
                    <select className="border-2 px-2 py-1.5 text-sm outline-none" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }} value={amountOp} onChange={(e) => setAmountOp(e.target.value)}>
                      {AMOUNT_OPS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <div className="flex items-center border-2" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}>
                      <span className="px-2 text-sm border-r" style={{ borderColor: "#DCD4CD", color: "#3D3935" }}>£</span>
                      <input type="number" min="0" placeholder="0" className="w-24 px-2 py-1.5 text-sm outline-none bg-transparent" style={{ color: "#3D3935" }} value={amountVal1} onChange={(e) => setAmountVal1(e.target.value)} />
                    </div>
                    {amountOp === "between" && (<><span className="text-sm text-gray-500">and</span><div className="flex items-center border-2" style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}><span className="px-2 text-sm border-r" style={{ borderColor: "#DCD4CD", color: "#3D3935" }}>£</span><input type="number" min="0" placeholder="0" className="w-24 px-2 py-1.5 text-sm outline-none bg-transparent" style={{ color: "#3D3935" }} value={amountVal2} onChange={(e) => setAmountVal2(e.target.value)} /></div></>)}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#DCD4CD" }}>
                  <span className="text-sm" style={{ color: "#3D3935" }}>Matched users: <strong>—</strong></span>
                  <Button className="border-2 text-sm" style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }}>Preview users</Button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* F */}
        <SectionCard title="F. Usage Rules">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Per-user usage</FieldLabel>
              <div className="flex flex-col gap-2 mt-1">
                {([{ value: "once", label: "One time only" }, { value: "multiple", label: "Multiple times" }] as { value: UsagePerUser; label: string }[]).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "#3D3935" }}>
                    <input type="radio" name="usagePerUser" value={opt.value} checked={usagePerUser === opt.value} onChange={() => setUsagePerUser(opt.value)} style={{ accentColor: "#3D3935" }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {usagePerUser === "multiple" && (
              <div>
                <FieldLabel>Per-user usage limit</FieldLabel>
                <Input type="number" min="1" placeholder="e.g. 3" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} style={border()} className="w-32" />
              </div>
            )}
            <div>
              <FieldLabel>Global usage limit</FieldLabel>
              <div className="flex flex-col gap-2 mt-1">
                {([{ value: "unlimited", label: "Unlimited" }, { value: "limited", label: "Limited" }] as { value: GlobalUsage; label: string }[]).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "#3D3935" }}>
                    <input type="radio" name="globalUsage" value={opt.value} checked={globalUsage === opt.value} onChange={() => setGlobalUsage(opt.value)} style={{ accentColor: "#3D3935" }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {globalUsage === "limited" && (
              <div>
                <FieldLabel>Total usage limit</FieldLabel>
                <Input type="number" min="1" placeholder="e.g. 100" value={totalUsageLimit} onChange={(e) => setTotalUsageLimit(e.target.value)} style={border()} className="w-32" />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="flex gap-3 pb-8">
          <Button className="border-2" style={{ backgroundColor: "#3D3935", borderColor: "#3D3935", color: "#FEFCFA" }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Code" : "Create Code"}
          </Button>
          <Button className="border-2" style={{ backgroundColor: "transparent", borderColor: "#DCD4CD", color: "#3D3935" }} onClick={() => navigate("/admin/promo-codes")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}