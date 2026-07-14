import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { Edit, Ban } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  PromoCode,
  PromoCodeStatus,
  getPromoStatus,
  formatDiscount,
} from "../../schema/promo-code.schema";
import {
  getPromoCodeById,
  getEnrichedUsageHistory,
  disablePromoCode,
  EnrichedUsage,
} from "../../lib/db/promo-codes";

const STATUS_STYLES: Record<PromoCodeStatus, { bg: string; color: string }> = {
  Active:    { bg: "#D6EDD7", color: "#2E6B30" },
  Scheduled: { bg: "#E8E3F5", color: "#4A3F7F" },
  Expired:   { bg: "#F2F2F2", color: "#666666" },
  Disabled:  { bg: "#F9E6E4", color: "#8B2C2C" },
};

function StatusBadge({ status }: { status: PromoCodeStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className="px-3 py-1 text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0" style={{ borderColor: "#DCD4CD" }}>
      <span className="w-36 text-sm shrink-0" style={{ color: "#6B6560" }}>{label}</span>
      <span className="text-sm flex-1" style={{ color: "#3D3935" }}>{children}</span>
    </div>
  );
}

export function AdminPromoCodeDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [history, setHistory] = useState<EnrichedUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(promoId: string) {
    try {
      setLoading(true);
      setError(null);
      const [p, h] = await Promise.all([
        getPromoCodeById(promoId),
        getEnrichedUsageHistory(promoId),
      ]);
      if (!p) { setError("Promo code not found."); return; }
      setPromo(p);
      setHistory(h);
    } catch (err: any) {
      setError("Failed to load promo code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!promo) return;
    try {
      await disablePromoCode(promo.id);
      setPromo({ ...promo, is_active: false });
    } catch (err) { console.error(err); }
  }

  if (loading) return <div className="p-8 text-gray-600">Loading…</div>;

  if (error || !promo) {
    return (
      <div className="p-8">
        <button className="text-sm mb-4 hover:underline" style={{ color: "#3D3935" }} onClick={() => navigate("/admin/promo-codes")}>← Promo Codes</button>
        <div className="px-4 py-3 border-2 text-sm" style={{ borderColor: "#D0A096", color: "#8B2C2C", backgroundColor: "#F9E6E4" }}>{error ?? "Not found."}</div>
      </div>
    );
  }

  const status = getPromoStatus(promo);
  const remaining = promo.global_usage === "limited" && promo.global_limit != null ? promo.global_limit - promo.usage_count : null;

  const stats = [
    { label: "Total Used", value: promo.usage_count },
    { label: "Unique Users", value: history.length },
    ...(remaining != null ? [{ label: "Remaining Uses", value: remaining }] : []),
  ];

  const discountText = [
    formatDiscount(promo),
    promo.max_cap != null ? `(max £${Number(promo.max_cap).toFixed(2)})` : null,
  ].filter(Boolean).join(" ");

  const usageText = [
    `Per user: ${promo.per_user_usage === "once" ? "1 time" : promo.per_user_limit ? `${promo.per_user_limit} times` : "multiple"}`,
    promo.global_usage === "limited" && promo.global_limit != null ? `Total limit: ${promo.global_limit}` : "No global limit",
  ].join(" · ");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <button className="text-sm mb-4 flex items-center gap-1 hover:underline" style={{ color: "#3D3935" }} onClick={() => navigate("/admin/promo-codes")}>
            ← Promo Codes
          </button>
          <h1 className="text-gray-800 mb-1">Promo Code Details</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-medium" style={{ color: "#3D3935" }}>{promo.name}</span>
            <span className="text-gray-400">—</span>
            <span className="font-mono font-semibold text-lg px-2 py-0.5 border" style={{ backgroundColor: "#FAF7F5", borderColor: "#DCD4CD", color: "#3D3935" }}>{promo.code}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2 border-2" style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }} onClick={() => navigate(`/admin/promo-codes/${promo.id}/edit`)}>
            <Edit className="w-4 h-4" />Edit
          </Button>
          {promo.is_active && (
            <Button className="flex items-center gap-2 border-2" style={{ borderColor: "#D0A096", color: "#8B2C2C", backgroundColor: "transparent" }} onClick={handleDisable}>
              <Ban className="w-4 h-4" />Disable
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border-2" style={{ borderColor: "#DCD4CD" }}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-semibold" style={{ color: "#3D3935" }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-6 border-2 mb-6" style={{ borderColor: "#DCD4CD" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "#3D3935" }}>Summary</h3>
        <SummaryRow label="Discount">{discountText}</SummaryRow>
        <SummaryRow label="Applies To"><span className="capitalize">{promo.applies_to}</span></SummaryRow>
        <SummaryRow label="Validity">{promo.start_date ?? "—"} – {promo.end_date ?? "—"}</SummaryRow>
        <SummaryRow label="Status"><StatusBadge status={status} /></SummaryRow>
        <SummaryRow label="Audience"><span className="capitalize">{promo.assign_to === "all" ? "All users" : promo.assign_to === "specific" ? "Specific users" : "Filtered users"}</span></SummaryRow>
        <SummaryRow label="Usage Rules">{usageText}</SummaryRow>
      </Card>

      {/* Usage History */}
      <Card className="border-2 overflow-hidden" style={{ borderColor: "#DCD4CD" }}>
        <div className="p-6 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <h3 className="text-base font-semibold" style={{ color: "#3D3935" }}>Usage History</h3>
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-600">No usage recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#FAF7F5" }}>
                <tr className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                  {["User", "Contact", "Date Used", "Booking ID", "Discount Applied", "Original Total", "Final Paid"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-semibold" style={{ color: "#3D3935" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#DCD4CD" }}>
                    <td className="p-4 font-medium" style={{ color: "#3D3935" }}>{row.user_name}</td>
                    <td className="p-4 text-gray-600">{row.user_contact}</td>
                    <td className="p-4 text-gray-600">{row.date_used}</td>
                    <td className="p-4"><span className="font-mono text-sm" style={{ color: "#3D3935" }}>{row.booking_id ? row.booking_id.substring(0, 8) + "…" : "—"}</span></td>
                    <td className="p-4 text-gray-700">£{Number(row.discount_applied).toFixed(2)}</td>
                    <td className="p-4 text-gray-600">{row.original_total != null ? `£${Number(row.original_total).toFixed(2)}` : "—"}</td>
                    <td className="p-4 font-semibold" style={{ color: "#3D3935" }}>{row.final_total != null ? `£${Number(row.final_total).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
