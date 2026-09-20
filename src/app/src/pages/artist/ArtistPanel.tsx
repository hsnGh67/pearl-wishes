import { useState, useMemo, useEffect, ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Scissors,
  Phone,
  Mail,
  X,
  MapPin,
  Unlock,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Link } from "react-router";
import { toast } from "sonner";
import { Toaster } from "../../../components/ui/sonner";
import { useAuthContext } from "../../providers/AuthProvider";
import type { WeeklyRhythmDay } from "../../schema/artist-availability.schema";
import {
  getArtistAvailability,
  upsertArtistWeeklyRhythm,
  upsertArtistMonthWeeklyRhythm,
  upsertArtistDayOverride,
  deleteArtistDayOverride,
  applyRhythmToMonth,
  submitArtistMonth,
  unlockArtistMonth,
  toYearMonth,
} from "../../lib/db/artist-availability";
import {
  getBookingsForArtist,
  type ArtistScheduleBooking,
} from "../../lib/db/bookings";
import { GAP_MINUTES_PER_SERVICE } from "../../lib/booking-schedule";
import { BookingStatus } from "../../schema/booking.schema";
import { BookingTreatmentStatus } from "../../schema/booking-treatment.schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavTab     = "availability" | "schedule" | "history";
type DayStatus  = "working" | "off";
type CalView    = "day" | "week" | "month";
type ApptStatus = "confirmed" | "pending" | "completed";

interface WeeklyDay {
  dow:       number;
  dayName:   string;
  dayAbbr:   string;
  isWorking: boolean;
  startTime: string;
  endTime:   string;
}

interface Override {
  status:    DayStatus;
  startTime: string;
  endTime:   string;
}

interface DayEntry {
  key:     string;
  dateNum: number;
  dow:     number;
}

interface EditDraft {
  status:    DayStatus;
  startTime: string;
  endTime:   string;
}

interface ScheduleAppt {
  id:            string;
  date:          string;
  startTime:     string;
  endTime:       string;
  durationMin:   number;
  clientName:    string;
  clientPhone:   string;
  clientEmail:   string;
  clientAddress: string;
  service:       string;
  status:        ApptStatus;
  notes:         string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOW_ABBR      = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WK_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const OPEN_HOUR   = 9;
const CLOSE_HOUR  = 19;
const HOUR_H_DAY  = 64;
const HOUR_H_WK   = 52;

const STATUS_CFG: Record<ApptStatus, { label: string; bg: string; accent: string; dotBg: string }> = {
  confirmed: { label: "Confirmed", bg: "#E9CFCA", accent: "#3D3935", dotBg: "#3D3935" },
  pending:   { label: "Pending",   bg: "#F1DFC0", accent: "#C4883A", dotBg: "#C4883A" },
  completed: { label: "Completed", bg: "#DCD4CD", accent: "#9C9088", dotBg: "#9C9088" },
};

const INITIAL_RHYTHM: WeeklyDay[] = [
  { dow: 1, dayName: "Monday",    dayAbbr: "Mon", isWorking: true,  startTime: "10:00", endTime: "18:00" },
  { dow: 2, dayName: "Tuesday",   dayAbbr: "Tue", isWorking: true,  startTime: "10:00", endTime: "18:00" },
  { dow: 3, dayName: "Wednesday", dayAbbr: "Wed", isWorking: true,  startTime: "10:00", endTime: "18:00" },
  { dow: 4, dayName: "Thursday",  dayAbbr: "Thu", isWorking: true,  startTime: "10:00", endTime: "18:00" },
  { dow: 5, dayName: "Friday",    dayAbbr: "Fri", isWorking: true,  startTime: "10:00", endTime: "18:00" },
  { dow: 6, dayName: "Saturday",  dayAbbr: "Sat", isWorking: true,  startTime: "10:00", endTime: "15:00" },
  { dow: 0, dayName: "Sunday",    dayAbbr: "Sun", isWorking: false, startTime: "10:00", endTime: "18:00" },
];

const DOW_META: Record<number, { dayName: string; dayAbbr: string }> = {
  0: { dayName: "Sunday",    dayAbbr: "Sun" },
  1: { dayName: "Monday",    dayAbbr: "Mon" },
  2: { dayName: "Tuesday",   dayAbbr: "Tue" },
  3: { dayName: "Wednesday", dayAbbr: "Wed" },
  4: { dayName: "Thursday",  dayAbbr: "Thu" },
  5: { dayName: "Friday",    dayAbbr: "Fri" },
  6: { dayName: "Saturday",  dayAbbr: "Sat" },
};

const AVATAR_BG = "#E9CFCA";

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof CalendarDays }[] = [
  { id: "availability", label: "Monthly Availability", icon: CalendarDays },
  { id: "schedule",     label: "Schedule",             icon: Clock },
  { id: "history",      label: "Client History",       icon: Users },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMonthDays(year: number, month: number): DayEntry[] {
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => {
    const d = i + 1;
    const date = new Date(year, month, d);
    return {
      key: dateKey(date),
      dateNum: d,
      dow: date.getDay(),
    };
  });
}

function rhythmFromApi(days: WeeklyRhythmDay[]): WeeklyDay[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dow) => {
    const meta = DOW_META[dow];
    const row = days.find((d) => d.dow === dow);
    return {
      dow,
      dayName: meta.dayName,
      dayAbbr: meta.dayAbbr,
      isWorking: row?.is_working ?? false,
      startTime: row?.start_time ?? "10:00",
      endTime: row?.end_time ?? "18:00",
    };
  });
}

function rhythmToApi(days: WeeklyDay[]): WeeklyRhythmDay[] {
  return days.map((d) => ({
    dow: d.dow,
    is_working: d.isWorking,
    start_time: d.startTime,
    end_time: d.endTime,
  }));
}

function overridesFromApi(
  rows: Array<{
    work_date: string;
    status: string;
    start_time?: string | null;
    end_time?: string | null;
  }>,
): Record<string, Override> {
  const map: Record<string, Override> = {};
  for (const row of rows) {
    map[row.work_date] = {
      status: row.status === "working" ? "working" : "off",
      startTime: row.start_time ?? "10:00",
      endTime: row.end_time ?? "18:00",
    };
  }
  return map;
}

function resolveDay(
  entry:     DayEntry,
  rhythm:    WeeklyDay[],
  overrides: Record<string, Override>,
): Override {
  if (overrides[entry.key]) return overrides[entry.key];
  const r = rhythm.find((d) => d.dow === entry.dow);
  return {
    status:    r?.isWorking ? "working" : "off",
    startTime: r?.startTime ?? "10:00",
    endTime:   r?.endTime   ?? "18:00",
  };
}

function groupByWeek(days: DayEntry[]): DayEntry[][] {
  const weeks: DayEntry[][] = [];
  let week: DayEntry[] = [];
  for (const day of days) {
    if (day.dow === 1 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

function weekLabel(week: DayEntry[], monthAbbr: string): string {
  const first = week[0];
  const last  = week[week.length - 1];
  return `${monthAbbr} ${first.dateNum}–${last.dateNum}`;
}

function dateKey(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekStart(d: Date): Date {
  const result = new Date(d);
  const dow    = d.getDay();
  result.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  result.setHours(0, 0, 0, 0);
  return result;
}

function scheduleRangeForView(view: CalView, date: Date): { from: Date; to: Date } {
  if (view === "day") {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return { from: day, to: day };
  }
  if (view === "week") {
    const from = getWeekStart(date);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from, to };
  }
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from, to };
}

function addMinutesToTime(startTime: string, durationMin: number): string {
  const [h, m] = startTime.slice(0, 5).split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + durationMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function mapBookingStatus(status: string | undefined): ApptStatus | null {
  switch (status) {
    case BookingStatus.PENDING:
      return "pending";
    case BookingStatus.CONFIRMED:
    case BookingStatus.IN_PROGRESS:
      return "confirmed";
    case BookingStatus.COMPLETED:
      return "completed";
    default:
      return null;
  }
}

function mapBookingToScheduleAppt(booking: ArtistScheduleBooking): ScheduleAppt | null {
  const status = mapBookingStatus(booking.status);
  if (!status || !booking.id) return null;

  const activeTreatments = (booking.services ?? []).filter(
    (t) => !t.status || t.status === BookingTreatmentStatus.ACTIVE,
  );
  const durationMin =
    activeTreatments.length === 0
      ? 60
      : activeTreatments.reduce((sum, t) => sum + (Number(t.duration) || 0), 0) +
        Math.max(activeTreatments.length - 1, 0) * GAP_MINUTES_PER_SERVICE;

  const startTime = String(booking.appointment_time).slice(0, 5);
  const dateRaw = booking.appointment_date;
  const date =
    typeof dateRaw === "string"
      ? dateRaw.slice(0, 10)
      : dateKey(new Date(dateRaw));

  return {
    id: booking.id,
    date,
    startTime,
    endTime: addMinutesToTime(startTime, durationMin),
    durationMin,
    clientName: booking.user?.full_name?.trim() || "Client",
    clientPhone: booking.user?.phone?.trim() || "—",
    clientEmail: booking.user?.email?.trim() || "—",
    clientAddress: booking.address || "—",
    service:
      activeTreatments
        .map((t) => t.service_name)
        .filter(Boolean)
        .join(" · ") || "Service",
    status,
    notes: booking.notes?.trim() || "",
  };
}

function buildMonthCells(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const lastDow  = (lastDay.getDay() + 6) % 7;
  const endPad   = lastDow === 6 ? 0 : 6 - lastDow;
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startPad; i > 0; i--) {
    const pd = new Date(firstDay);
    pd.setDate(firstDay.getDate() - i);
    cells.push({ date: pd, isCurrentMonth: false });
  }
  for (let n = 1; n <= lastDay.getDate(); n++) {
    cells.push({ date: new Date(year, month, n), isCurrentMonth: true });
  }
  for (let i = 1; i <= endPad; i++) {
    const td = new Date(lastDay);
    td.setDate(lastDay.getDate() + i);
    cells.push({ date: td, isCurrentMonth: false });
  }
  return cells;
}

// ─── Drawer detail row ────────────────────────────────────────────────────────

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs font-medium" style={{ color: "#9C9088" }}>{label}</div>
        <div className="text-sm mt-0.5" style={{ color: "#3D3935" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Appointment Drawer ───────────────────────────────────────────────────────

function AppointmentDrawer({
  appt,
  notes,
  onNotesChange,
  onClose,
}: {
  appt:          ScheduleAppt;
  notes:         string;
  onNotesChange: (v: string) => void;
  onClose:       () => void;
}) {
  const cfg = STATUS_CFG[appt.status];

  const formatDate = (ds: string) => {
    const [y, mo, d] = ds.split("-").map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(61,57,53,0.25)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{ width: 360, backgroundColor: "#FEFCFA", borderLeft: "2px solid #DCD4CD" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "#3D3935" }}>
              {appt.clientName}
            </h2>
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 mt-1.5 font-medium"
              style={{ backgroundColor: cfg.bg, color: cfg.accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dotBg }} />
              {cfg.label}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ color: "#9C9088" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <DetailRow icon={<Scissors className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Service">
            {appt.service}
          </DetailRow>

          <DetailRow icon={<CalendarDays className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Date & Time">
            <div>{formatDate(appt.date)}</div>
            <div className="mt-0.5">{appt.startTime} – {appt.endTime}</div>
          </DetailRow>

          <DetailRow icon={<Clock className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Duration">
            {formatDuration(appt.durationMin)}
          </DetailRow>

          <DetailRow icon={<Phone className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Phone">
            {appt.clientPhone}
          </DetailRow>

          <DetailRow icon={<Mail className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Email">
            {appt.clientEmail}
          </DetailRow>

          <DetailRow icon={<MapPin className="w-4 h-4" style={{ color: "#9C9088" }} />} label="Address">
            {appt.clientAddress}
          </DetailRow>

          <div style={{ borderTop: "1px solid #DCD4CD" }} />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#9C9088" }}>
              Session Notes <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add notes about this session..."
              rows={4}
              className="w-full text-sm border p-2.5 resize-none"
              style={{
                borderColor:     "#DCD4CD",
                color:           "#3D3935",
                backgroundColor: "#FAF7F5",
                outline:         "none",
              }}
            />
          </div>
        </div>

        {/* Footer — read-only role: Close only, no admin actions */}
        <div className="p-5 border-t-2" style={{ borderColor: "#DCD4CD" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border-2 text-sm font-medium transition-colors"
            style={{ borderColor: "#3D3935", color: "#3D3935", backgroundColor: "transparent" }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function ArtistDayView({
  date,
  appointments,
  onSelect,
}: {
  date:         Date;
  appointments: ScheduleAppt[];
  onSelect:     (a: ScheduleAppt) => void;
}) {
  const totalH   = (CLOSE_HOUR - OPEN_HOUR) * HOUR_H_DAY;
  const hours    = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const dateStr  = dateKey(date);
  const dayAppts = appointments.filter((a) => a.date === dateStr);

  return (
    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
      <div className="flex" style={{ height: totalH }}>
        {/* Time labels */}
        <div className="flex-shrink-0" style={{ width: 56 }}>
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_H_DAY }}
              className="flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs" style={{ color: "#9C9088" }}>
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 relative border-l" style={{ borderColor: "#DCD4CD" }}>
          {hours.map((h) => (
            <div
              key={h}
              style={{
                position:  "absolute",
                top:       (h - OPEN_HOUR) * HOUR_H_DAY,
                left:      0,
                right:     0,
                borderTop: "1px solid #EDE8E3",
              }}
            />
          ))}

          {dayAppts.map((appt) => {
            const [sh, sm] = appt.startTime.split(":").map(Number);
            const top    = (sh - OPEN_HOUR) * HOUR_H_DAY + (sm / 60) * HOUR_H_DAY;
            const height = Math.max(44, (appt.durationMin / 60) * HOUR_H_DAY);
            const cfg    = STATUS_CFG[appt.status];

            return (
              <button
                key={appt.id}
                type="button"
                onClick={() => onSelect(appt)}
                style={{
                  position:        "absolute",
                  top,
                  left:            6,
                  right:           6,
                  height,
                  backgroundColor: cfg.bg,
                  borderLeft:      `3px solid ${cfg.accent}`,
                }}
                className="text-left px-2 py-1.5 overflow-hidden"
              >
                <div className="text-xs font-semibold truncate" style={{ color: cfg.accent }}>
                  {appt.clientName}
                </div>
                <div className="text-xs truncate" style={{ color: cfg.accent, opacity: 0.8 }}>
                  {appt.service}
                </div>
                {height > 52 && (
                  <div className="text-xs" style={{ color: cfg.accent, opacity: 0.65 }}>
                    {appt.startTime} – {appt.endTime}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function ArtistWeekView({
  date,
  appointments,
  onSelect,
}: {
  date:         Date;
  appointments: ScheduleAppt[];
  onSelect:     (a: ScheduleAppt) => void;
}) {
  const weekStart = getWeekStart(date);
  const days      = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const totalH   = (CLOSE_HOUR - OPEN_HOUR) * HOUR_H_WK;
  const hours    = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const todayStr = dateKey(new Date());

  return (
    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
      {/* Day headers */}
      <div
        className="flex sticky top-0 z-10 border-b"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
      >
        <div style={{ width: 56, flexShrink: 0 }} />
        {days.map((d, i) => {
          const isToday = dateKey(d) === todayStr;
          return (
            <div
              key={i}
              className="flex-1 text-center py-2 border-l"
              style={{ borderColor: "#DCD4CD" }}
            >
              <div className="text-xs" style={{ color: "#9C9088" }}>{WK_DAY_LABELS[i]}</div>
              <div
                className="text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: isToday ? "#3D3935" : "transparent",
                  color:           isToday ? "#FEFCFA" : "#3D3935",
                }}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: totalH }}>
        {/* Hour labels */}
        <div className="flex-shrink-0" style={{ width: 56 }}>
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_H_WK }} className="flex items-start justify-end pr-2 pt-1">
              <span className="text-xs" style={{ color: "#9C9088" }}>
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, i) => {
          const ds       = dateKey(d);
          const dayAppts = appointments.filter((a) => a.date === ds);

          return (
            <div
              key={i}
              className="flex-1 relative border-l"
              style={{ borderColor: "#DCD4CD" }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position:  "absolute",
                    top:       (h - OPEN_HOUR) * HOUR_H_WK,
                    left:      0,
                    right:     0,
                    borderTop: "1px solid #EDE8E3",
                  }}
                />
              ))}

              {dayAppts.map((appt) => {
                const [sh, sm] = appt.startTime.split(":").map(Number);
                const top    = (sh - OPEN_HOUR) * HOUR_H_WK + (sm / 60) * HOUR_H_WK;
                const height = Math.max(32, (appt.durationMin / 60) * HOUR_H_WK);
                const cfg    = STATUS_CFG[appt.status];

                return (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => onSelect(appt)}
                    style={{
                      position:        "absolute",
                      top,
                      left:            2,
                      right:           2,
                      height,
                      backgroundColor: cfg.bg,
                      borderLeft:      `2px solid ${cfg.accent}`,
                    }}
                    className="text-left px-1.5 py-0.5 overflow-hidden"
                  >
                    <div
                      className="text-xs font-medium leading-tight truncate"
                      style={{ color: cfg.accent }}
                    >
                      {appt.clientName.split(" ")[0]}
                    </div>
                    {height > 38 && (
                      <div
                        className="text-xs leading-tight"
                        style={{ color: cfg.accent, opacity: 0.75 }}
                      >
                        {appt.startTime}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function ArtistMonthView({
  date,
  appointments,
  onSelect,
}: {
  date:         Date;
  appointments: ScheduleAppt[];
  onSelect:     (a: ScheduleAppt) => void;
}) {
  const cells    = buildMonthCells(date.getFullYear(), date.getMonth());
  const todayStr = dateKey(new Date());

  return (
    <div>
      {/* Header row */}
      <div
        className="grid grid-cols-7 border-b"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
      >
        {WK_DAY_LABELS.map((h) => (
          <div key={h} className="py-2 text-center text-xs font-semibold" style={{ color: "#9C9088" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-7"
        style={{ borderLeft: "1px solid #DCD4CD", borderTop: "1px solid #DCD4CD" }}
      >
        {cells.map((cell, i) => {
          const ds       = dateKey(cell.date);
          const dayAppts = appointments.filter((a) => a.date === ds);
          const isToday  = ds === todayStr;
          const dateNum  = cell.date.getDate();
          const dateColor = isToday ? "#FEFCFA" : cell.isCurrentMonth ? "#3D3935" : "#C4BAB3";

          return (
            <div
              key={i}
              style={{
                borderRight:     "1px solid #DCD4CD",
                borderBottom:    "1px solid #DCD4CD",
                minHeight:       90,
                backgroundColor: cell.isCurrentMonth ? "#FEFCFA" : "#FAF7F5",
              }}
              className="p-1.5"
            >
              <div
                className="text-xs font-medium w-6 h-6 flex items-center justify-center mb-1 rounded-full"
                style={{
                  backgroundColor: isToday ? "#3D3935" : "transparent",
                  color:           dateColor,
                }}
              >
                {dateNum}
              </div>

              {dayAppts.slice(0, 2).map((appt) => {
                const cfg = STATUS_CFG[appt.status];
                return (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => onSelect(appt)}
                    className="w-full text-left text-xs px-1 py-0.5 mb-0.5 truncate block"
                    style={{
                      backgroundColor: cfg.bg,
                      borderLeft:      `2px solid ${cfg.accent}`,
                      color:           cfg.accent,
                    }}
                  >
                    {appt.clientName.split(" ")[0]} · {appt.startTime}
                  </button>
                );
              })}

              {dayAppts.length > 2 && (
                <div className="text-xs px-1 mt-0.5" style={{ color: "#9C9088" }}>
                  +{dayAppts.length - 2} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule View (tab root) ─────────────────────────────────────────────────

function ScheduleView({ artistId }: { artistId: string | null }) {
  const [view,     setView]     = useState<CalView>("week");
  const [date,     setDate]     = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selected, setSelected] = useState<ScheduleAppt | null>(null);
  const [notes,    setNotes]    = useState<Record<string, string>>({});
  const [appointments, setAppointments] = useState<ScheduleAppt[]>([]);
  const [loading, setLoading] = useState(false);

  const { from: rangeFrom, to: rangeTo } = useMemo(
    () => scheduleRangeForView(view, date),
    [view, date],
  );
  const rangeKey = `${dateKey(rangeFrom)}_${dateKey(rangeTo)}`;

  useEffect(() => {
    if (!artistId) {
      setAppointments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const rows = await getBookingsForArtist(artistId, rangeFrom, rangeTo);
        if (cancelled) return;
        const mapped = rows
          .map(mapBookingToScheduleAppt)
          .filter((a): a is ScheduleAppt => a !== null);
        setAppointments(mapped);
        setNotes((prev) => {
          const next = { ...prev };
          for (const appt of mapped) {
            if (next[appt.id] === undefined && appt.notes) {
              next[appt.id] = appt.notes;
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) {
          setAppointments([]);
          toast.error("Failed to load schedule bookings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artistId, rangeKey, rangeFrom, rangeTo]);

  const navigate = (dir: -1 | 1) => {
    setDate((d) => {
      const nd = new Date(d);
      if (view === "day")   nd.setDate(d.getDate() + dir);
      if (view === "week")  nd.setDate(d.getDate() + dir * 7);
      if (view === "month") nd.setMonth(d.getMonth() + dir);
      return nd;
    });
  };

  const navLabel = (() => {
    if (view === "day") {
      return date.toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      });
    }
    if (view === "week") {
      const ws = getWeekStart(date);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `${fmt(ws)} – ${fmt(we)}, ${we.getFullYear()}`;
    }
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  })();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "#3D3935" }}>Schedule</h1>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border-2" style={{ borderColor: "#DCD4CD" }}>
            {(["day", "week", "month"] as CalView[]).map((v, idx) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium"
                style={{
                  borderRight:     idx < 2 ? "1px solid #DCD4CD" : "none",
                  backgroundColor: view === v ? "#3D3935" : "transparent",
                  color:           view === v ? "#FEFCFA" : "#3D3935",
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center border-2" style={{ borderColor: "#DCD4CD" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center"
              style={{ borderRight: "1px solid #DCD4CD", color: "#3D3935" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="px-4 text-sm font-medium text-center"
              style={{ color: "#3D3935", minWidth: 190 }}
            >
              {navLabel}
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center"
              style={{ borderLeft: "1px solid #DCD4CD", color: "#3D3935" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <Card className="border-2 overflow-hidden relative" style={{ borderColor: "#DCD4CD" }}>
        {loading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center text-sm"
            style={{ backgroundColor: "rgba(254,252,250,0.7)", color: "#9C9088" }}
          >
            Loading schedule…
          </div>
        )}
        {view === "day"   && (
          <ArtistDayView   date={date} appointments={appointments} onSelect={setSelected} />
        )}
        {view === "week"  && (
          <ArtistWeekView  date={date} appointments={appointments} onSelect={setSelected} />
        )}
        {view === "month" && (
          <ArtistMonthView date={date} appointments={appointments} onSelect={setSelected} />
        )}
      </Card>

      {/* Status legend */}
      <div className="flex items-center gap-5">
        {(["confirmed", "pending", "completed"] as ApptStatus[]).map((key) => {
          const cfg = STATUS_CFG[key];
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dotBg }} />
              <span className="text-xs" style={{ color: "#9C9088" }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Appointment details drawer */}
      {selected && (
        <AppointmentDrawer
          appt={selected}
          notes={notes[selected.id] ?? selected.notes ?? ""}
          onNotesChange={(v) => setNotes((n) => ({ ...n, [selected!.id]: v }))}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArtistPanel() {
  const { artist, isLoading: authLoading, signOut } = useAuthContext();

  const [activeTab, setActiveTab] = useState<NavTab>("availability");
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rhythm, setRhythm] = useState<WeeklyDay[]>(INITIAL_RHYTHM);
  const [defaultRhythm, setDefaultRhythm] = useState<WeeklyDay[]>(INITIAL_RHYTHM);
  const [hasMonthRhythm, setHasMonthRhythm] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [submitted, setSubmitted] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [saving, setSaving] = useState(false);

  const artistId = artist?.id ?? null;
  const artistName = artist
    ? `${artist.first_name} ${artist.last_name}`.trim()
    : "Artist";
  const artistInitials = artist
    ? `${artist.first_name.charAt(0)}${artist.last_name.charAt(0)}`.toUpperCase()
    : "PW";

  const monthDays = useMemo(
    () => buildMonthDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );
  const weekGroups = useMemo(() => groupByWeek(monthDays), [monthDays]);
  const monthTitle = viewMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const monthAbbr = viewMonth.toLocaleDateString("en-GB", { month: "short" });
  const yearMonthKey = toYearMonth(viewMonth);

  useEffect(() => {
    if (!artistId) return;

    let cancelled = false;
    setLoadingAvail(true);
    setEditingKey(null);
    setEditDraft(null);

    (async () => {
      try {
        const bundle = await getArtistAvailability(artistId, yearMonthKey);
        if (cancelled) return;
        const defaults = rhythmFromApi(bundle.rhythm);
        setDefaultRhythm(defaults);
        const customized = Boolean(
          bundle.has_month_rhythm && (bundle.month_rhythm?.length ?? 0) > 0,
        );
        setHasMonthRhythm(customized);
        setRhythm(
          customized
            ? rhythmFromApi(bundle.month_rhythm ?? [])
            : defaults,
        );
        setOverrides(overridesFromApi(bundle.overrides));
        setSubmitted(bundle.month.status === "submitted");
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        toast.error("Failed to load availability.");
      } finally {
        if (!cancelled) setLoadingAvail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artistId, yearMonthKey]);

  const shiftMonth = (dir: -1 | 1) => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1),
    );
  };

  const updateRhythmDay = (dow: number, patch: Partial<WeeklyDay>) => {
    if (submitted || !artistId) return;
    setRhythm((prev) => {
      const next = prev.map((d) => (d.dow === dow ? { ...d, ...patch } : d));
      // Month-scoped override — never clobber global defaults
      void upsertArtistMonthWeeklyRhythm(
        artistId,
        yearMonthKey,
        rhythmToApi(next),
      )
        .then(() => setHasMonthRhythm(true))
        .catch(() => {
          toast.error("Failed to save month weekly rhythm.");
        });
      return next;
    });
  };

  /** Clear month custom week + day overrides; fall back to global defaults. */
  const resetMonthToDefault = async () => {
    if (!artistId || submitted) return;
    setSaving(true);
    try {
      await applyRhythmToMonth(artistId, yearMonthKey);
      setRhythm(defaultRhythm);
      setHasMonthRhythm(false);
      setOverrides({});
      if (editingKey) {
        setEditingKey(null);
        setEditDraft(null);
      }
      toast.success(`${monthTitle} reset to default weekly rhythm.`);
    } catch {
      toast.error("Failed to reset month to defaults.");
    } finally {
      setSaving(false);
    }
  };

  /** Persist current editor hours into the global default template (other months unchanged). */
  const saveAsDefaultRhythm = async () => {
    if (!artistId || submitted) return;
    setSaving(true);
    try {
      await upsertArtistWeeklyRhythm(artistId, rhythmToApi(rhythm));
      setDefaultRhythm(rhythm);
      toast.success("Saved as default weekly rhythm for months without a custom week.");
    } catch {
      toast.error("Failed to save default rhythm.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: DayEntry) => {
    if (submitted) return;
    const resolved = resolveDay(entry, rhythm, overrides);
    setEditingKey(entry.key);
    setEditDraft({
      status: resolved.status,
      startTime: resolved.startTime,
      endTime: resolved.endTime,
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditDraft(null);
  };

  const saveEdit = async (key: string) => {
    if (!editDraft || !artistId || submitted) return;
    setSaving(true);
    try {
      await upsertArtistDayOverride({
        artistId,
        workDate: key,
        status: editDraft.status,
        startTime: editDraft.startTime,
        endTime: editDraft.endTime,
      });
      setOverrides((prev) => ({ ...prev, [key]: { ...editDraft } }));
      setEditingKey(null);
      setEditDraft(null);
      toast.success("Day updated.");
    } catch {
      toast.error("Failed to save day override.");
    } finally {
      setSaving(false);
    }
  };

  const resetOverride = async (key: string) => {
    if (!artistId || submitted) return;
    setSaving(true);
    try {
      await deleteArtistDayOverride(artistId, key);
      setOverrides((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      toast.success("Reset to weekly default.");
    } catch {
      toast.error("Failed to reset day.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!artistId || submitted) return;
    setSaving(true);
    try {
      // Persist the week shown for this month as a month override if customized
      // or if the editor differs from defaults (first submit with edits).
      await upsertArtistMonthWeeklyRhythm(
        artistId,
        yearMonthKey,
        rhythmToApi(rhythm),
      );
      setHasMonthRhythm(true);
      await submitArtistMonth(artistId, yearMonthKey);
      const count = monthDays.filter(
        (d) => resolveDay(d, rhythm, overrides).status === "working",
      ).length;
      setSubmitted(true);
      setEditingKey(null);
      setEditDraft(null);
      toast.success(
        `Schedule submitted for ${monthTitle} — ${count} working days.`,
      );
    } catch {
      toast.error("Failed to submit schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!artistId || !submitted) return;
    setSaving(true);
    try {
      await unlockArtistMonth(artistId, yearMonthKey);
      setSubmitted(false);
      toast.success(`${monthTitle} unlocked for editing.`);
    } catch {
      toast.error("Failed to unlock month.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FEFCFA", color: "#9C9088" }}
      >
        Loading…
      </div>
    );
  }

  if (!artist) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: "#FEFCFA" }}
      >
        <p className="text-sm" style={{ color: "#9C9088" }}>
          No artist profile linked to this account.
        </p>
        <Link to="/" className="text-sm underline" style={{ color: "#3D3935" }}>
          Back to Website
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "#FEFCFA" }}>
      <aside
        className="w-64 border-r-2 flex flex-col shrink-0 h-screen"
        style={{ borderColor: "#3D3935", backgroundColor: "#FAF7F5" }}
      >
        <div className="p-6 border-b-2" style={{ borderColor: "#3D3935" }}>
          <Link to="/" className="flex items-center gap-3" style={{ color: "#3D3935" }}>
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#3D3935" }}
            >
              <span className="text-white font-semibold text-sm">PW</span>
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "#3D3935" }}>Pearl Wishes</div>
              <div className="text-xs" style={{ color: "#3D3935", opacity: 0.6 }}>Artist Panel</div>
            </div>
          </Link>
        </div>

        <div className="p-4 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{ backgroundColor: AVATAR_BG, color: "#3D3935" }}
            >
              {artistInitials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: "#3D3935" }}>{artistName}</div>
              <div className="text-xs" style={{ color: "#3D3935", opacity: 0.55 }}>Nail Artist</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 transition-all text-left"
                style={{
                  borderColor: active ? "#3D3935" : "#DCD4CD",
                  backgroundColor: active ? "#3D3935" : "transparent",
                  color: active ? "#FEFCFA" : "#3D3935",
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 space-y-2" style={{ borderColor: "#3D3935" }}>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 px-4 py-3 border-2 transition-all"
            style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign Out</span>
          </button>
          <Link
            to="/"
            className="flex items-center px-4 py-3 border-2 transition-all"
            style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
          >
            <span className="text-sm px-6">Back to Website</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        {activeTab === "availability" && (
          <div className="p-8" style={{ maxWidth: 950 }}>
            <div className="mb-1 flex items-center gap-1 text-xs" style={{ color: "#3D3935", opacity: 0.45 }}>
              <span>Artist Panel</span>
              <span>/</span>
              <span style={{ fontWeight: 600 }}>Monthly Availability</span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold" style={{ color: "#3D3935" }}>
                {monthTitle} Availability
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center border" style={{ borderColor: "#DCD4CD" }}>
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="w-8 h-8 flex items-center justify-center border-r"
                    style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-medium" style={{ color: "#3D3935" }}>
                    {monthTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="w-8 h-8 flex items-center justify-center border-l"
                    style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {submitted && (
                  <Button
                    type="button"
                    onClick={() => void handleUnlock()}
                    disabled={saving}
                    className="text-sm h-8 border-2 flex items-center gap-1.5 px-3"
                    style={{
                      backgroundColor: "transparent",
                      color: "#3D3935",
                      borderColor: "#DCD4CD",
                    }}
                  >
                    <Unlock className="w-3.5 h-3.5" /> Unlock
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitted || saving || loadingAvail}
                  className="text-sm h-8 border-2 flex items-center gap-1.5 px-4"
                  style={{
                    backgroundColor: submitted ? "#DCD4CD" : "#3D3935",
                    color: submitted ? "#3D3935" : "#FEFCFA",
                    borderColor: submitted ? "#DCD4CD" : "#3D3935",
                  }}
                >
                  {submitted ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</>
                  ) : (
                    "Submit Schedule"
                  )}
                </Button>
              </div>
            </div>

            {loadingAvail ? (
              <p className="text-sm" style={{ color: "#9C9088" }}>Loading availability…</p>
            ) : (
              <Card className="border-2 overflow-hidden" style={{ borderColor: "#DCD4CD" }}>
                <div className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                  <div
                    className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
                  >
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "#3D3935" }}>
                        Weekly Rhythm
                      </span>
                      <span className="text-xs ml-2" style={{ color: "#9C9088" }}>
                        {hasMonthRhythm
                          ? `Custom for ${monthAbbr}`
                          : "Using studio default"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void saveAsDefaultRhythm()}
                        disabled={submitted || saving}
                        className="text-xs px-3 py-1.5 border-2 font-medium transition-all"
                        style={{
                          borderColor: submitted ? "#DCD4CD" : "#DCD4CD",
                          color: submitted ? "#9C9088" : "#3D3935",
                          backgroundColor: "transparent",
                        }}
                      >
                        Save as default
                      </button>
                      {hasMonthRhythm && (
                        <button
                          type="button"
                          onClick={() => void resetMonthToDefault()}
                          disabled={submitted || saving}
                          className="text-xs px-3 py-1.5 border-2 font-medium transition-all"
                          style={{
                            borderColor: submitted ? "#DCD4CD" : "#3D3935",
                            color: submitted ? "#9C9088" : "#3D3935",
                            backgroundColor: "transparent",
                          }}
                        >
                          Reset to default
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 divide-x" style={{ borderColor: "#DCD4CD" }}>
                    {rhythm.map((day) => (
                      <div
                        key={day.dow}
                        className="p-3 flex flex-col gap-2"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: day.isWorking ? "#FEFCFA" : "#FAF7F5",
                        }}
                      >
                        <label
                          className="flex items-center justify-between cursor-pointer"
                          style={{ opacity: submitted ? 0.6 : 1 }}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{ color: day.isWorking ? "#3D3935" : "#9C9088" }}
                          >
                            {day.dayAbbr}
                          </span>
                          <input
                            type="checkbox"
                            checked={day.isWorking}
                            disabled={submitted || saving}
                            onChange={(e) => updateRhythmDay(day.dow, { isWorking: e.target.checked })}
                            className="w-3.5 h-3.5 accent-[#3D3935] cursor-pointer"
                          />
                        </label>

                        {day.isWorking ? (
                          <div className="space-y-1.5">
                            <input
                              type="time"
                              value={day.startTime}
                              disabled={submitted || saving}
                              onChange={(e) => updateRhythmDay(day.dow, { startTime: e.target.value })}
                              className="w-full text-xs border px-1.5 py-1"
                              style={{
                                borderColor: "#DCD4CD",
                                color: "#3D3935",
                                backgroundColor: "#FEFCFA",
                                outline: "none",
                              }}
                            />
                            <input
                              type="time"
                              value={day.endTime}
                              disabled={submitted || saving}
                              onChange={(e) => updateRhythmDay(day.dow, { endTime: e.target.value })}
                              className="w-full text-xs border px-1.5 py-1"
                              style={{
                                borderColor: "#DCD4CD",
                                color: "#3D3935",
                                backgroundColor: "#FEFCFA",
                                outline: "none",
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-center py-1" style={{ color: "#C4BAB3" }}>
                            Off
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div
                    className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "#3D3935" }}>
                      {monthAbbr} Schedule
                    </span>
                    <span className="text-xs" style={{ color: "#9C9088" }}>
                      {monthDays.filter((d) => resolveDay(d, rhythm, overrides).status === "working").length} working days
                      {Object.keys(overrides).length > 0 && (
                        <span className="ml-2" style={{ color: "#E9CFCA" }}>
                          · {Object.keys(overrides).length} override{Object.keys(overrides).length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="divide-y" style={{ borderColor: "#DCD4CD" }}>
                    {weekGroups.map((week, wi) => (
                      <div key={wi}>
                        <div
                          className="px-5 py-1.5 flex items-center gap-2"
                          style={{ backgroundColor: "#FAF7F5", borderBottom: "1px solid #DCD4CD" }}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9C9088" }}>
                            Week {wi + 1}
                          </span>
                          <span className="text-xs" style={{ color: "#C4BAB3" }}>
                            — {weekLabel(week, monthAbbr)}
                          </span>
                        </div>

                        {week.map((entry) => {
                          const resolved = resolveDay(entry, rhythm, overrides);
                          const isWorking = resolved.status === "working";
                          const isModified = Boolean(overrides[entry.key]);
                          const isExpanded = editingKey === entry.key;

                          return (
                            <div
                              key={entry.key}
                              style={{
                                borderBottom: "1px solid #DCD4CD",
                                backgroundColor: isModified
                                  ? "#FDF5F0"
                                  : isExpanded
                                    ? "#FAF7F5"
                                    : "#FEFCFA",
                              }}
                            >
                              <div className="flex items-center gap-4 px-5 py-3">
                                <span
                                  className="text-sm font-medium w-28 flex-shrink-0"
                                  style={{ color: "#3D3935" }}
                                >
                                  {DOW_ABBR[entry.dow]}, {monthAbbr} {entry.dateNum}
                                </span>

                                <span
                                  className="text-sm flex-shrink-0 w-32"
                                  style={{ color: isWorking ? "#3D3935" : "#9C9088" }}
                                >
                                  {isWorking
                                    ? `${resolved.startTime}–${resolved.endTime}`
                                    : "Off"}
                                </span>

                                <span
                                  className="text-xs px-2 py-0.5 font-medium flex-shrink-0"
                                  style={{
                                    backgroundColor: isModified ? "#FCEAE0" : "#EDE8E3",
                                    color: isModified ? "#3D3935" : "#9C9088",
                                  }}
                                >
                                  {isModified ? "Modified" : "Default"}
                                </span>

                                <div className="flex-1" />

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isModified && !isExpanded && (
                                    <button
                                      type="button"
                                      onClick={() => void resetOverride(entry.key)}
                                      disabled={submitted || saving}
                                      className="flex items-center gap-1 text-xs py-1 px-2 border"
                                      style={{
                                        borderColor: "#DCD4CD",
                                        color: "#9C9088",
                                        backgroundColor: "transparent",
                                      }}
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Reset
                                    </button>
                                  )}

                                  {!submitted && (
                                    <button
                                      type="button"
                                      onClick={() => (isExpanded ? cancelEdit() : startEdit(entry))}
                                      disabled={saving}
                                      className="flex items-center gap-1 text-xs py-1 px-2.5 border-2 font-medium transition-all"
                                      style={{
                                        borderColor: isExpanded ? "#3D3935" : "#DCD4CD",
                                        color: isExpanded ? "#FEFCFA" : "#3D3935",
                                        backgroundColor: isExpanded ? "#3D3935" : "transparent",
                                      }}
                                    >
                                      {isExpanded ? (
                                        "Cancel"
                                      ) : (
                                        <><Pencil className="w-3 h-3" /> Edit</>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isExpanded && editDraft && (
                                <div
                                  className="px-5 py-4 border-t"
                                  style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
                                >
                                  <div className="flex items-start gap-6 flex-wrap">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-xs font-medium" style={{ color: "#9C9088" }}>
                                        Status
                                      </span>
                                      <div className="flex">
                                        {(["working", "off"] as DayStatus[]).map((s) => (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() =>
                                              setEditDraft((d) => (d ? { ...d, status: s } : d))
                                            }
                                            className="px-3 py-1.5 text-xs font-medium border-2 first:border-r-0 transition-all"
                                            style={{
                                              borderColor: editDraft.status === s ? "#3D3935" : "#DCD4CD",
                                              backgroundColor: editDraft.status === s ? "#3D3935" : "transparent",
                                              color: editDraft.status === s ? "#FEFCFA" : "#3D3935",
                                            }}
                                          >
                                            {s === "working" ? "Working" : "Day Off"}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {editDraft.status === "working" && (
                                      <div className="flex items-end gap-3">
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-medium" style={{ color: "#9C9088" }}>
                                            Start time
                                          </span>
                                          <input
                                            type="time"
                                            value={editDraft.startTime}
                                            onChange={(e) =>
                                              setEditDraft((d) =>
                                                d ? { ...d, startTime: e.target.value } : d,
                                              )
                                            }
                                            className="border text-sm px-2 py-1.5 w-32"
                                            style={{
                                              borderColor: "#DCD4CD",
                                              color: "#3D3935",
                                              backgroundColor: "#FEFCFA",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                        <span className="pb-2 text-xs" style={{ color: "#9C9088" }}>to</span>
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-medium" style={{ color: "#9C9088" }}>
                                            End time
                                          </span>
                                          <input
                                            type="time"
                                            value={editDraft.endTime}
                                            onChange={(e) =>
                                              setEditDraft((d) =>
                                                d ? { ...d, endTime: e.target.value } : d,
                                              )
                                            }
                                            className="border text-sm px-2 py-1.5 w-32"
                                            style={{
                                              borderColor: "#DCD4CD",
                                              color: "#3D3935",
                                              backgroundColor: "#FEFCFA",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        onClick={() => void saveEdit(entry.key)}
                                        disabled={saving}
                                        className="text-sm h-9 px-4 border-2"
                                        style={{
                                          backgroundColor: "#3D3935",
                                          color: "#FEFCFA",
                                          borderColor: "#3D3935",
                                        }}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="p-8">
            <div className="mb-4 flex items-center gap-1 text-xs" style={{ color: "#3D3935", opacity: 0.45 }}>
              <span>Artist Panel</span>
              <span>/</span>
              <span style={{ fontWeight: 600 }}>Schedule</span>
            </div>
            <ScheduleView artistId={artistId} />
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-8" style={{ maxWidth: 950 }}>
            <div className="mb-1 flex items-center gap-1 text-xs" style={{ color: "#3D3935", opacity: 0.45 }}>
              <span>Artist Panel</span>
              <span>/</span>
              <span style={{ fontWeight: 600 }}>Client History</span>
            </div>
            <Card
              className="p-12 border-2 flex flex-col items-center gap-3 mt-8"
              style={{ borderColor: "#DCD4CD" }}
            >
              <Users className="w-10 h-10" style={{ color: "#DCD4CD" }} />
              <p className="text-sm" style={{ color: "#9C9088" }}>Client history — coming soon.</p>
            </Card>
          </div>
        )}
      </main>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
