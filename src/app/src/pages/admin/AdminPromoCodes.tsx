import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, MoreHorizontal, Eye, Edit, Ban, Tag } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  PromoCode,
  PromoCodeStatus,
  getPromoStatus,
  formatUsage,
  formatDiscount,
} from "../../schema/promo-code.schema";
import { getAllPromoCodes, disablePromoCode } from "../../lib/db/promo-codes";

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

function OverflowMenu({ onEdit, onDisable }: { onEdit: () => void; onDisable: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 hover:bg-gray-100 transition-colors"
        style={{ color: "#3D3935" }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 border-2 z-20 min-w-[140px] shadow-sm"
            style={{ backgroundColor: "#FEFCFA", borderColor: "#3D3935" }}
          >
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              style={{ color: "#3D3935" }}
              onClick={() => { onEdit(); setOpen(false); }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              style={{ color: "#8B2C2C" }}
              onClick={() => { onDisable(); setOpen(false); }}
            >
              <Ban className="w-4 h-4" />
              Disable
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminPromoCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    try {
      setLoading(true);
      setError(null);
      setCodes(await getAllPromoCodes());
    } catch (err: any) {
      setError("Failed to load promo codes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(id: string) {
    try {
      await disablePromoCode(id);
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, is_active: false } : c));
    } catch (err) {
      console.error("Failed to disable:", err);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">Promo Codes</h1>
          <p className="text-gray-600">Manage discount codes and promotions</p>
        </div>
        <Button
          className="flex items-center gap-2 border-2"
          style={{ backgroundColor: "#3D3935", borderColor: "#3D3935", color: "#FEFCFA" }}
          onClick={() => navigate("/admin/promo-codes/create")}
        >
          <Plus className="w-4 h-4" />
          Create New Code
        </Button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 border-2 text-sm" style={{ borderColor: "#D0A096", color: "#8B2C2C", backgroundColor: "#F9E6E4" }}>
          {error}
        </div>
      )}

      <Card className="border-2 overflow-hidden" style={{ borderColor: "#DCD4CD" }}>
        <div className="p-6 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <h3 style={{ color: "#3D3935" }}>All Promo Codes</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-600">Loading promo codes…</div>
        ) : codes.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 flex items-center justify-center border-2" style={{ borderColor: "#DCD4CD", color: "#3D3935" }}>
              <Tag className="w-6 h-6" />
            </div>
            <p className="text-gray-600">No promo codes yet.</p>
            <Button
              className="flex items-center gap-2 border-2"
              style={{ backgroundColor: "#3D3935", borderColor: "#3D3935", color: "#FEFCFA" }}
              onClick={() => navigate("/admin/promo-codes/create")}
            >
              <Plus className="w-4 h-4" />
              Create New Code
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#FAF7F5" }}>
                <tr className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                  {["Code Name", "Promo Code", "Discount", "Applies To", "Start Date", "End Date", "Usage", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-semibold" style={{ color: "#3D3935" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <tr key={promo.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#DCD4CD" }}>
                      <td className="p-4 font-medium" style={{ color: "#3D3935" }}>{promo.name}</td>
                      <td className="p-4">
                        <span className="font-mono text-sm px-2 py-0.5 border" style={{ backgroundColor: "#FAF7F5", borderColor: "#DCD4CD", color: "#3D3935" }}>
                          {promo.code}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{formatDiscount(promo)}</td>
                      <td className="p-4 text-gray-600 capitalize">{promo.applies_to}</td>
                      <td className="p-4 text-gray-600">{promo.start_date ?? "—"}</td>
                      <td className="p-4 text-gray-600">{promo.end_date ?? "—"}</td>
                      <td className="p-4 text-gray-600">{formatUsage(promo)}</td>
                      <td className="p-4"><StatusBadge status={status} /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex items-center gap-1 text-sm font-medium hover:underline"
                            style={{ color: "#3D3935" }}
                            onClick={() => navigate(`/admin/promo-codes/${promo.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <OverflowMenu
                            onEdit={() => navigate(`/admin/promo-codes/${promo.id}/edit`)}
                            onDisable={() => handleDisable(promo.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
