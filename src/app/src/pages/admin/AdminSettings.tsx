import { useState, useEffect } from "react";
import { Settings, Clock, CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  getBusinessSettings,
  updateBusinessSettings,
  type BusinessSettings,
} from "../../lib/db/business-settings";
import { supabase } from "../../config/supabase";

export function AdminSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [bufferMinutes, setBufferMinutes] = useState(30);
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);

  // Latest booked appointment date — effective-from cannot go before this
  const [latestBookingDate, setLatestBookingDate] = useState<string | null>(null);

  const localToday = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // minAllowedDate = max(today, latestBookingDate)
  const minAllowedDate =
    latestBookingDate && latestBookingDate > localToday ? latestBookingDate : localToday;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [settingsData, bookingData] = await Promise.all([
          getBusinessSettings(),
          supabase
            .from("bookings")
            .select("appointment_date")
            .not("appointment_date", "is", null)
            .order("appointment_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (settingsData) {
          setSettings(settingsData);
          setBufferMinutes(settingsData.travel_buffer_minutes);
          setEffectiveFrom(settingsData.buffer_effective_from);
        }

        if (bookingData.data?.appointment_date) {
          // appointment_date may be a full ISO timestamp or a date string; take the date part only
          const raw = bookingData.data.appointment_date as string;
          setLatestBookingDate(raw.slice(0, 10));
        }
      } catch {
        setLoadError("Failed to load settings. Check your Supabase connection.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handleSaveClick = () => {
    if (bufferMinutes < 0 || bufferMinutes > 120) return;
    if (effectiveFrom < minAllowedDate) {
      toast.error("Invalid effective date", {
        description: latestBookingDate
          ? `Date cannot be earlier than your latest scheduled booking (${formatDate(latestBookingDate)}).`
          : "Date cannot be in the past.",
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    try {
      const updated = await updateBusinessSettings({
        travel_buffer_minutes: bufferMinutes,
        buffer_effective_from: effectiveFrom,
      });
      setSettings(updated);
      toast.success("Settings saved", {
        description: `Buffer set to ${bufferMinutes} min, effective from ${formatDate(effectiveFrom)}.`,
      });
    } catch (err) {
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty =
    settings === null ||
    bufferMinutes !== settings.travel_buffer_minutes ||
    effectiveFrom !== settings.buffer_effective_from;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6" style={{ color: "#3D3935" }} />
          <h1 className="text-gray-800">Settings</h1>
        </div>
        
      </div>

      {loadError && (
        <div
          className="flex items-start gap-3 p-4 mb-6 border-2"
          style={{ borderColor: "#D0A096", backgroundColor: "#FDF0EE" }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D0A096" }} />
          <p className="text-sm" style={{ color: "#3D3935" }}>
            {loadError}
          </p>
        </div>
      )}

      {/* Section 1: Booking & Schedule Preferences */}
      <Card
        className="border-2 p-6 mb-6"
        style={{ borderColor: "#DCD4CD" }}
      >
        <div className="mb-5 pb-4 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <h2 className="text-base font-semibold" style={{ color: "#3D3935" }}>
            Booking &amp; Schedule Preferences
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Controls how appointment slots are generated for clients.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-14 rounded animate-pulse"
                style={{ backgroundColor: "#EDE8E3" }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Buffer minutes */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: "#3D3935" }}
              >
                <Clock className="w-4 h-4" />
                Travel / Buffer Time Between Appointments
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={bufferMinutes}
                  onChange={(e) =>
                    setBufferMinutes(Math.max(0, Math.min(120, Number(e.target.value))))
                  }
                  className="w-28 px-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                    color: "#3D3935",
                  }}
                />
                <span className="text-sm text-gray-500">minutes</span>
                <span
                  className="text-xs px-2 py-1 font-medium"
                  style={{ backgroundColor: "#E9CFCA", color: "#3D3935" }}
                >
                  {bufferMinutes === 0
                    ? "No gap"
                    : bufferMinutes < 60
                    ? `${bufferMinutes} min gap`
                    : `${bufferMinutes / 60}h gap`}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Min: 0 · Max: 120 minutes. Currently:{" "}
                <strong>{settings?.travel_buffer_minutes ?? 30} min</strong> in effect.
              </p>
            </div>

            {/* Effective from date */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: "#3D3935" }}
              >
                <CalendarDays className="w-4 h-4" />
                Apply From Date
              </label>
              <input
                type="date"
                value={effectiveFrom}
                min={minAllowedDate}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="px-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors"
                style={{
                  borderColor: effectiveFrom < minAllowedDate ? "#D0A096" : "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                  color: "#3D3935",
                }}
              />
              <p className="text-xs text-gray-400 mt-2">
                Currently effective from:{" "}
                <strong>
                  {settings ? formatDate(settings.buffer_effective_from) : "—"}
                </strong>
              </p>
              {latestBookingDate && (
                <p className="text-xs mt-1" style={{ color: "#A07060" }}>
                  Date cannot be earlier than your latest scheduled booking ({formatDate(latestBookingDate)}).
                </p>
              )}
            </div>

            {/* Helper text */}
            <div
              className="flex items-start gap-3 p-4 border"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Sets the mandatory travel or rest gap between consecutive appointments.
                Confirmed existing bookings will <strong>never</strong> be shifted or
                deleted — only available time slots going forward will reflect the new
                gap.
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveClick}
                disabled={!isDirty || isSaving || bufferMinutes < 0 || bufferMinutes > 120}
                className="border-2 px-6"
                style={{
                  backgroundColor: isDirty ? "#3D3935" : "#DCD4CD",
                  borderColor: isDirty ? "#3D3935" : "#DCD4CD",
                  color: isDirty ? "#FEFCFA" : "#9CA3AF",
                  cursor: isDirty ? "pointer" : "not-allowed",
                }}
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "#000000cc" }}
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card
              className="p-6 border-2"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
            >
              <div className="mb-4">
                <h3 className="font-semibold text-base mb-2" style={{ color: "#3D3935" }}>
                  Confirm Settings Change
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  You are about to update the travel/buffer time to{" "}
                  <strong>{bufferMinutes} minutes</strong>, effective from{" "}
                  <strong>{formatDate(effectiveFrom)}</strong>.
                </p>
                <div
                  className="mt-4 p-3 border text-sm"
                  style={{ borderColor: "#E9CFCA", backgroundColor: "#FDF6F3" }}
                >
                  This will only change available time slots for dates on or after{" "}
                  <strong>{formatDate(effectiveFrom)}</strong>. Existing reservations
                  remain <strong>unchanged</strong>.
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm border-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                >
                  Cancel
                </button>
                <Button
                  onClick={handleConfirmSave}
                  className="border-2 px-5"
                  style={{
                    backgroundColor: "#3D3935",
                    borderColor: "#3D3935",
                    color: "#FEFCFA",
                  }}
                >
                  Confirm &amp; Save
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
