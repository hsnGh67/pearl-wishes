import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Clock,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  FileText,
  X,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  getBusinessSettings,
  updateBusinessSettings,
  type BusinessSettings,
} from "../../lib/db/business-settings";
import { supabase } from "../../config/supabase";

// ─── Static mock data ────────────────────────────────────────────────────────

type NailArtist = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  districts: string[];
  services: string[];
  username: string;
  password: string;
  notes: string;
};

const MOCK_ARTISTS: NailArtist[] = [
  {
    id: "1",
    firstName: "Sara",
    lastName: "Rossi",
    phone: "+44 7700 900123",
    email: "sara@nailstudio.co",
    districts: ["District 1", "District 3"],
    services: ["Gel Manicure", "Nail Art"],
    username: "sara_nails",
    password: "s3cur3p4ss",
    notes: "Prefers morning appointments only.",
  },
  {
    id: "2",
    firstName: "Mia",
    lastName: "Chen",
    phone: "+44 7700 900456",
    email: "mia@nailstudio.co",
    districts: ["District 2"],
    services: ["Pedicure", "Extensions"],
    username: "mia_chen",
    password: "m1ach3n99",
    notes: "",
  },
  {
    id: "3",
    firstName: "Jade",
    lastName: "Williams",
    phone: "+44 7700 900789",
    email: "jade@nailstudio.co",
    districts: ["District 1", "District 2", "District 4"],
    services: ["Gel Manicure", "Pedicure", "Nail Art"],
    username: "jade_w",
    password: "j4d3w1ll!",
    notes: "Allergy to certain gel brands — check notes before booking.",
  },
  {
    id: "4",
    firstName: "Leah",
    lastName: "Park",
    phone: "+44 7700 900321",
    email: "leah@nailstudio.co",
    districts: ["District 3"],
    services: ["Extensions", "Nail Art"],
    username: "leah_park",
    password: "le4hp4rk",
    notes: "",
  },
];

const ALL_DISTRICTS = [
  "District 1",
  "District 2",
  "District 3",
  "District 4",
  "District 5",
];

const ALL_SERVICES = [
  "Gel Manicure",
  "Nail Art",
  "Pedicure",
  "Extensions",
  "Gel Polish",
  "Nail Repair",
];

const AVATAR_COLORS = ["#E9CFCA", "#DCD4CD", "#FCEAE0", "#D4C5C0", "#C8D4CC"];

function getInitials(a: NailArtist) {
  return `${a.firstName[0]}${a.lastName[0]}`.toUpperCase();
}
function getAvatarColor(id: string) {
  const idx = parseInt(id, 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Multi-select dropdown ───────────────────────────────────────────────────

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
          color: selected.length ? "#3D3935" : "#9CA3AF",
        }}
      >
        <span>
          {selected.length === 0
            ? `Select ${label}…`
            : `${selected.length} selected`}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 font-medium"
              style={{ backgroundColor: "#E9CFCA", color: "#3D3935" }}
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:opacity-60"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div
          className="absolute z-50 mt-1 w-full border-2 shadow-md"
          style={{
            borderColor: "#DCD4CD",
            backgroundColor: "#FEFCFA",
          }}
        >
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[#FAF7F5]"
                style={{ color: "#3D3935" }}
              >
                <span
                  className="w-4 h-4 border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: checked ? "#3D3935" : "#DCD4CD",
                    backgroundColor: checked ? "#3D3935" : "transparent",
                  }}
                >
                  {checked && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Credentials modal ──────────────────────────────────────────────────────

function CredentialsModal({
  artist,
  onClose,
}: {
  artist: NailArtist;
  onClose: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "#000000aa" }}
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs">
        <Card
          className="p-6 border-2"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-base" style={{ color: "#3D3935" }}>
              Panel Credentials
            </h3>
            <button onClick={onClose} className="hover:opacity-60 transition-opacity">
              <X className="w-4 h-4" style={{ color: "#3D3935" }} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Username</p>
              <p className="text-sm font-mono px-3 py-2 border-2" style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5", color: "#3D3935" }}>
                {artist.username}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Password</p>
              <div className="flex items-center border-2" style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}>
                <p className="flex-1 text-sm font-mono px-3 py-2" style={{ color: "#3D3935" }}>
                  {showPw ? artist.password : "••••••••••"}
                </p>
                <button
                  onClick={() => setShowPw((v) => !v)}
                  className="px-2.5 hover:opacity-60 transition-opacity"
                  title={showPw ? "Hide" : "Show"}
                >
                  {showPw
                    ? <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                    : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Count-badge + popover (districts & services) ────────────────────────────

function CountPopover({
  items,
  total,
  singularLabel,
  pluralLabel,
  allLabel,
  badgeBg,
  tagBg,
}: {
  items: string[];
  total: number;
  singularLabel: string;
  pluralLabel: string;
  allLabel: string;
  badgeBg: string;
  tagBg: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isAll = items.length === total;
  const label = isAll
    ? allLabel
    : `${items.length} ${items.length === 1 ? singularLabel : pluralLabel}`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs px-2.5 py-1 font-medium transition-opacity hover:opacity-75"
        style={{ backgroundColor: badgeBg, color: "#3D3935" }}
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 border-2 shadow-md p-3 min-w-[160px]"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        >
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <span
                key={item}
                className="text-xs px-2 py-0.5 font-medium whitespace-nowrap"
                style={{ backgroundColor: tagBg, color: "#3D3935" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View Note mini-modal ────────────────────────────────────────────────────

function NoteModal({
  artist,
  onClose,
}: {
  artist: NailArtist;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "#000000aa" }}
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm">
        <Card
          className="p-6 border-2"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base" style={{ color: "#3D3935" }}>
              Note — {artist.firstName} {artist.lastName}
            </h3>
            <button onClick={onClose} className="hover:opacity-60 transition-opacity">
              <X className="w-4 h-4" style={{ color: "#3D3935" }} />
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {artist.notes || "No notes added for this artist."}
          </p>
          <div className="flex justify-end mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Add / Edit Artist modal ─────────────────────────────────────────────────

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  username: "",
  password: "",
  districts: [] as string[],
  services: [] as string[],
  notes: "",
};

function ArtistModal({
  editArtist,
  onClose,
  onSave,
}: {
  editArtist: NailArtist | null;
  onClose: () => void;
  onSave: (form: typeof EMPTY_FORM) => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    editArtist
      ? {
          firstName: editArtist.firstName,
          lastName: editArtist.lastName,
          phone: editArtist.phone,
          email: editArtist.email,
          username: editArtist.username,
          password: editArtist.password,
          districts: [...editArtist.districts],
          services: [...editArtist.services],
          notes: editArtist.notes,
        }
      : { ...EMPTY_FORM },
  );
  const [showPw, setShowPw] = useState(false);

  const set = (k: keyof typeof EMPTY_FORM, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const inputClass =
    "w-full px-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors";
  const inputStyle = {
    borderColor: "#DCD4CD",
    backgroundColor: "#FEFCFA",
    color: "#3D3935",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "#000000cc" }}
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <Card
          className="border-2"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b-2"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h3 className="font-semibold text-base" style={{ color: "#3D3935" }}>
              {editArtist ? "Edit Nail Artist" : "Add New Nail Artist"}
            </h3>
            <button onClick={onClose} className="hover:opacity-60 transition-opacity">
              <X className="w-4 h-4" style={{ color: "#3D3935" }} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Row: First + Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Sara"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Rossi"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row: Phone + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+44 7700 900000"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="artist@studio.co"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Panel credentials */}
            <div
              className="p-4 border-2 space-y-4"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3D3935" }}>
                Panel Credentials
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="sara_nails"
                    className={`${inputClass} font-mono`}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} font-mono pr-9`}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                    >
                      {showPw ? (
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Districts */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                Districts Covered
              </label>
              <MultiSelectDropdown
                label="districts"
                options={ALL_DISTRICTS}
                selected={form.districts}
                onChange={(v) => set("districts", v)}
              />
            </div>

            {/* Services */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                Services Offered
              </label>
              <MultiSelectDropdown
                label="services"
                options={ALL_SERVICES}
                selected={form.services}
                onChange={(v) => set("services", v)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D3935" }}>
                Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Special instructions, preferences, or client notes…"
                className="w-full px-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors resize-none"
                style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA", color: "#3D3935" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t-2"
            style={{ borderColor: "#DCD4CD" }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
            >
              Cancel
            </button>
            <Button
              onClick={() => onSave(form)}
              className="border-2 px-5"
              style={{
                backgroundColor: "#3D3935",
                borderColor: "#3D3935",
                color: "#FEFCFA",
              }}
            >
              {editArtist ? "Save Changes" : "Save Nail Artist"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function AdminSettings() {
  // ── Buffer settings state ──
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bufferMinutes, setBufferMinutes] = useState(30);
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [latestBookingDate, setLatestBookingDate] = useState<string | null>(null);

  const localToday = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const minAllowedDate =
    latestBookingDate && latestBookingDate > localToday
      ? latestBookingDate
      : localToday;

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

  // ── Section collapse state ──
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [artistsOpen, setArtistsOpen] = useState(false);

  // ── Nail Artists state ──
  const [artists, setArtists] = useState<NailArtist[]>(MOCK_ARTISTS);
  const [artistSearch, setArtistSearch] = useState("");
  const [viewNoteArtist, setViewNoteArtist] = useState<NailArtist | null>(null);
  const [credentialsArtist, setCredentialsArtist] = useState<NailArtist | null>(null);
  const [artistModal, setArtistModal] = useState<{
    open: boolean;
    editArtist: NailArtist | null;
  }>({ open: false, editArtist: null });

  const filteredArtists = artists.filter((a) => {
    if (!artistSearch) return true;
    const q = artistSearch.toLowerCase();
    return (
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q)
    );
  });

  const handleSaveArtist = (form: typeof EMPTY_FORM) => {
    if (artistModal.editArtist) {
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistModal.editArtist!.id
            ? { ...a, ...form }
            : a,
        ),
      );
      toast.success("Artist updated");
    } else {
      const newArtist: NailArtist = {
        ...form,
        id: String(Date.now()),
      };
      setArtists((prev) => [...prev, newArtist]);
      toast.success("Nail artist added");
    }
    setArtistModal({ open: false, editArtist: null });
  };

  const handleDeleteArtist = (id: string) => {
    setArtists((prev) => prev.filter((a) => a.id !== id));
    toast.success("Artist removed");
  };

  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set());
  const toggleActive = (id: string) => {
    setDeactivatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Artist reactivated");
      } else {
        next.add(id);
        toast("Artist deactivated");
      }
      return next;
    });
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
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
          <AlertTriangle
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: "#D0A096" }}
          />
          <p className="text-sm" style={{ color: "#3D3935" }}>
            {loadError}
          </p>
        </div>
      )}

      {/* ── Section 1: Booking & Schedule Preferences ── */}
      <Card
        className="border-2 mb-6 max-w-3xl"
        style={{ borderColor: "#DCD4CD" }}
      >
        <button
          onClick={() => setScheduleOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#FAF7F5]"
          style={scheduleOpen ? { borderBottom: "2px solid #DCD4CD" } : {}}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#3D3935" }}>
              Booking &amp; Schedule Preferences
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Controls how appointment slots are generated for clients.
            </p>
          </div>
          <ChevronDown
            className="w-4 h-4 shrink-0 ml-4 transition-transform"
            style={{
              color: "#3D3935",
              transform: scheduleOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {scheduleOpen && (isLoading ? (
          <div className="space-y-4 px-6 py-5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-14 rounded animate-pulse"
                style={{ backgroundColor: "#EDE8E3" }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6 px-6 py-5">
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
                    setBufferMinutes(
                      Math.max(0, Math.min(120, Number(e.target.value))),
                    )
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
                <strong>
                  {settings?.travel_buffer_minutes ?? 30} min
                </strong>{" "}
                in effect.
              </p>
            </div>

            {/* Effective from */}
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
                  borderColor:
                    effectiveFrom < minAllowedDate ? "#D0A096" : "#DCD4CD",
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
                  Date cannot be earlier than your latest scheduled booking (
                  {formatDate(latestBookingDate)}).
                </p>
              )}
            </div>

            {/* Helper */}
            <div
              className="flex items-start gap-3 p-4 border"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Sets the mandatory travel or rest gap between consecutive
                appointments. Confirmed existing bookings will{" "}
                <strong>never</strong> be shifted or deleted — only available
                time slots going forward will reflect the new gap.
              </p>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveClick}
                disabled={
                  !isDirty ||
                  isSaving ||
                  bufferMinutes < 0 ||
                  bufferMinutes > 120
                }
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
        ))}
      </Card>

      {/* ── Section 2: Nail Artists ── */}
      <Card className="border-2 mb-6" style={{ borderColor: "#DCD4CD" }}>
        {/* Section header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={artistsOpen ? { borderBottom: "2px solid #DCD4CD" } : {}}
        >
          <button
            onClick={() => setArtistsOpen((o) => !o)}
            className="flex items-center gap-3 flex-1 text-left transition-colors hover:opacity-80"
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#3D3935" }}>
                Nail Artists
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
                Manage technician profiles, coverage districts, panel credentials,
                and service capabilities.
              </p>
            </div>
            <ChevronDown
              className="w-4 h-4 shrink-0 ml-auto transition-transform"
              style={{
                color: "#3D3935",
                transform: artistsOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          <Button
            onClick={() => setArtistModal({ open: true, editArtist: null })}
            className="border-2 shrink-0 ml-6 flex items-center gap-2"
            style={{
              backgroundColor: "#3D3935",
              borderColor: "#3D3935",
              color: "#FEFCFA",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Nail Artist
          </Button>
        </div>

        {artistsOpen && <>
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b-2"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
        >
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            />
            <input
              type="text"
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              placeholder="Search artists, email, or username…"
              className="w-full pl-9 pr-3 py-2 border-2 text-sm outline-none focus:border-[#3D3935] transition-colors"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
                color: "#3D3935",
              }}
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {filteredArtists.length}{" "}
            {filteredArtists.length === 1 ? "artist" : "artists"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#FAF7F5" }}>
                {[
                  "Artist",
                  "Contact",
                  "Coverage Districts",
                  "Services",
                  "Panel Credentials",
                  "Notes",
                  "Status",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 text-center"
                    style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredArtists.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No artists match your search.
                  </td>
                </tr>
              ) : (
                filteredArtists.map((artist, idx) => {
                  const isLast = idx === filteredArtists.length - 1;
                  const isActive = !deactivatedIds.has(artist.id);
                  return (
                    <tr
                      key={artist.id}
                      className="group transition-colors hover:bg-[#FAF7F5]"
                      style={{
                        ...(isLast ? {} : { borderBottom: "1px solid #EDE8E3" }),
                        opacity: isActive ? 1 : 0.45,
                      }}
                    >
                      {/* Artist */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{
                              backgroundColor: getAvatarColor(artist.id),
                              color: "#3D3935",
                            }}
                          >
                            {getInitials(artist)}
                          </span>
                          <span
                            className="text-sm font-medium whitespace-nowrap"
                            style={{ color: "#3D3935" }}
                          >
                            {artist.firstName} {artist.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4">
                        <p className="text-sm" style={{ color: "#3D3935" }}>
                          {artist.phone}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {artist.email}
                        </p>
                      </td>

                      {/* Districts — count badge + popover */}
                      <td className="px-4 py-4">
                        <CountPopover
                          items={artist.districts}
                          total={ALL_DISTRICTS.length}
                          singularLabel="district"
                          pluralLabel="districts"
                          allLabel="All districts"
                          badgeBg="#FCEAE0"
                          tagBg="#FCEAE0"
                        />
                      </td>

                      {/* Services — count badge + popover */}
                      <td className="px-4 py-4">
                        <CountPopover
                          items={artist.services}
                          total={ALL_SERVICES.length}
                          singularLabel="service"
                          pluralLabel="services"
                          allLabel="All services"
                          badgeBg="#E9CFCA"
                          tagBg="#E9CFCA"
                        />
                      </td>

                      {/* Panel Credentials — key icon → modal */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setCredentialsArtist(artist)}
                          className="p-1.5 border-2 transition-colors hover:bg-[#EDE8E3]"
                          style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                          title="View credentials"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setViewNoteArtist(artist)}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border transition-colors hover:bg-[#EDE8E3]"
                          style={{
                            borderColor: "#DCD4CD",
                            color: "#3D3935",
                            backgroundColor: "#F1EDEA",
                          }}
                          title={artist.notes || "No notes"}
                        ><FileText className="w-2.5 h-2.5" strokeWidth={1.5} />View</button>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleActive(artist.id)}
                          title={isActive ? "Deactivate artist" : "Reactivate artist"}
                          className="relative inline-flex items-center shrink-0 w-9 h-5 border-2 transition-colors focus:outline-none"
                          style={{
                            borderColor: isActive ? "#3D3935" : "#DCD4CD",
                            backgroundColor: isActive ? "#3D3935" : "#EDE8E3",
                            borderRadius: "999px",
                          }}
                        >
                          <span
                            className="inline-block w-3 h-3 transition-transform"
                            style={{
                              borderRadius: "999px",
                              backgroundColor: "#FEFCFA",
                              transform: isActive ? "translateX(16px)" : "translateX(2px)",
                            }}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setArtistModal({
                                open: true,
                                editArtist: artist,
                              })
                            }
                            className="p-1.5 border-2 transition-colors hover:bg-[#EDE8E3]"
                            style={{
                              borderColor: "#DCD4CD",
                              color: "#3D3935",
                            }}
                            title="Edit artist"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteArtist(artist.id)}
                            className="p-1.5 border-2 transition-colors hover:bg-[#FDF0EE]"
                            style={{
                              borderColor: "#DCD4CD",
                              color: "#D0A096",
                            }}
                            title="Delete artist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </>}
      </Card>

      {/* ── Buffer confirmation modal ── */}
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
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: "#3D3935" }}
                >
                  Confirm Settings Change
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  You are about to update the travel/buffer time to{" "}
                  <strong>{bufferMinutes} minutes</strong>, effective from{" "}
                  <strong>{formatDate(effectiveFrom)}</strong>.
                </p>
                <div
                  className="mt-4 p-3 border text-sm"
                  style={{
                    borderColor: "#E9CFCA",
                    backgroundColor: "#FDF6F3",
                  }}
                >
                  This will only change available time slots for dates on or
                  after <strong>{formatDate(effectiveFrom)}</strong>. Existing
                  reservations remain <strong>unchanged</strong>.
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

      {/* ── Add/Edit Artist modal ── */}
      {artistModal.open && (
        <ArtistModal
          editArtist={artistModal.editArtist}
          onClose={() => setArtistModal({ open: false, editArtist: null })}
          onSave={handleSaveArtist}
        />
      )}

      {/* ── View Note modal ── */}
      {viewNoteArtist && (
        <NoteModal
          artist={viewNoteArtist}
          onClose={() => setViewNoteArtist(null)}
        />
      )}

      {/* ── Credentials modal ── */}
      {credentialsArtist && (
        <CredentialsModal
          artist={credentialsArtist}
          onClose={() => setCredentialsArtist(null)}
        />
      )}
    </div>
  );
}
