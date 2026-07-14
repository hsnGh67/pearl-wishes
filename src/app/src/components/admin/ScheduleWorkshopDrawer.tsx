import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Pencil,
  Check,
  GraduationCap,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
  UserPlus,
  UserCheck,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Workshop } from "../../schema/workshop.schema";
import {
  WorkshopBooking,
  WorkshopBookingStatus,
  WorkshopSession,
} from "../../schema/workshop-booking.schema";
import {
  createWorkshopBookingStudent,
  createWorkshopSession,
  getBookedCandidatesByMonth,
  updateWorkshopBookingStatusToScheduled,
} from "../../lib/db/workshop-bookings";

// ─── types ────────────────────────────────────────────────────────────────────

export interface GeneratedSession {
  id?: string;
  index: number;
  date: Date;
  time: string;
}

type DrawerStep = "form" | "created" | "details";

interface StudentPayment {
  id: string;
  amount: number;
  date: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: "booked" | "manual";
  bookingMonth?: string;
  // financial
  baseFee: number;
  payments: StudentPayment[];
  // transient UI
  newPaymentAmount: string;
  newPaymentDate: string;
  showHistory: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseSessionCount(workshop: {
  session_count?: number;
  duration?: string;
}): number {
  if (workshop.session_count && workshop.session_count > 0)
    return workshop.session_count;
  if (!workshop.duration) return 6;
  const match = workshop.duration.match(/(\d+)\s*session/i);
  return match ? parseInt(match[1], 10) : 6;
}

function parseCapacity(classType: string | undefined): number {
  if (!classType) return 3;
  const match = classType.match(/(\d+)\s*student/i);
  return match ? parseInt(match[1], 10) : 3;
}

const WEEKDAYS = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "Th", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
  { label: "Su", value: 0 },
];

function formatSessionDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function generateSessions(
  firstDate: Date,
  weekdays: number[],
  count: number,
  timeRange: string,
): GeneratedSession[] {
  if (!weekdays.length || !count) return [];
  const sessions: GeneratedSession[] = [];
  const cursor = new Date(firstDate);
  cursor.setHours(0, 0, 0, 0);
  while (sessions.length < count) {
    if (weekdays.includes(cursor.getDay())) {
      sessions.push({
        index: sessions.length + 1,
        date: new Date(cursor),
        time: timeRange || "10:00 - 12:00",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getTime() - firstDate.getTime() > 365 * 86400000) break;
  }
  return sessions;
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

function studentTotalPaid(s: Student) {
  return s.payments.reduce((sum, p) => sum + p.amount, 0);
}

function studentRemaining(s: Student) {
  return s.baseFee - studentTotalPaid(s);
}

function makeStudent(
  overrides: Partial<Student> &
    Pick<Student, "id" | "name" | "phone" | "source">,
  basePrice: number,
): Student {
  return {
    email: "",
    bookingMonth: undefined,
    payments: [],
    newPaymentAmount: "",
    newPaymentDate: new Date().toISOString().split("T")[0],
    showHistory: false,
    baseFee: basePrice,
    ...overrides,
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function WarningModal({
  onContinue,
  onClose,
}: {
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: "rgba(61,57,53,0.5)" }}
    >
      <div
        className="rounded-lg shadow-xl p-6 mx-4 flex flex-col gap-4"
        style={{
          width: "400px",
          backgroundColor: "#FEFCFA",
          border: "1px solid #e5e7eb",
        }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 mt-0.5 flex-shrink-0"
            style={{ color: "#D0A096" }}
          />
          <div>
            <h3
              className="font-semibold text-sm mb-1"
              style={{ color: "#3D3935" }}
            >
              Workshop setup not complete
            </h3>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              The workshop schedule has been created, but student and payment
              details are not completed. You can finish this later from the
              calendar.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            className="border text-sm"
            style={{
              backgroundColor: "transparent",
              borderColor: "#DCD4CD",
              color: "#3D3935",
            }}
          >
            Close for now
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="text-sm"
            style={{
              backgroundColor: "#3D3935",
              color: "#FEFCFA",
              border: "none",
            }}
          >
            Continue setup
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Financial Summary ────────────────────────────────────────────────────────

function FinancialSummary({
  students,
  firstSessionDate,
}: {
  students: Student[];
  firstSessionDate: string;
}) {
  const expectedIncome = students.reduce((s, st) => s + st.baseFee, 0);
  const totalPaid = students.reduce((s, st) => s + studentTotalPaid(st), 0);
  const remaining = expectedIncome - totalPaid;
  const hasUnpaid = remaining > 0;
  const isUpcoming = firstSessionDate
    ? new Date(firstSessionDate + "T00:00:00") >= new Date()
    : true;

  const cards = [
    {
      label: "Expected",
      value: expectedIncome,
      accent: "#FAF7F5",
      border: "#DCD4CD",
    },
    {
      label: "Paid",
      value: totalPaid,
      accent: "#E9CFCA",
      border: "#DCD4CD",
    },
    {
      label: "Remaining",
      value: remaining,
      accent: hasUnpaid && isUpcoming ? "#F1DFC0" : "#FAF7F5",
      border: hasUnpaid && isUpcoming ? "#D0A096" : "#DCD4CD",
    },
  ];

  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3">
        <CircleDollarSign
          className="w-3.5 h-3.5"
          style={{ color: "#3D3935" }}
        />
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#3D3935" }}
        >
          Financial Summary
        </p>
        {hasUnpaid && isUpcoming && (
          <span
            className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: "#F1DFC0",
              color: "#3D3935",
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            Outstanding balance
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-md border px-3 py-2.5 text-center"
            style={{
              backgroundColor: c.accent,
              borderColor: c.border,
            }}
          >
            <p className="text-xs mb-0.5" style={{ color: "#6b7280" }}>
              {c.label}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#3D3935" }}>
              {fmt(c.value)}
            </p>
          </div>
        ))}
      </div>
      {students.length === 0 && (
        <p className="text-xs mt-2 text-center" style={{ color: "#9ca3af" }}>
          Add students to see financial totals.
        </p>
      )}
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  student,
  onChange,
  onRemove,
}: {
  student: Student;
  onChange: (updated: Partial<Student>) => void;
  onRemove: () => void;
}) {
  const totalPaid = studentTotalPaid(student);
  const remaining = studentRemaining(student);
  const overpaid = totalPaid > student.baseFee && student.baseFee > 0;

  const addPayment = () => {
    const amt = parseFloat(student.newPaymentAmount);
    if (!amt || amt <= 0) return;
    onChange({
      payments: [
        ...student.payments,
        {
          id: crypto.randomUUID(),
          amount: amt,
          date: student.newPaymentDate,
        },
      ],
      newPaymentAmount: "",
    });
  };

  const removePayment = (pid: string) => {
    onChange({
      payments: student.payments.filter((p) => p.id !== pid),
    });
  };

  return (
    <div
      className="rounded-md border overflow-hidden"
      style={{ borderColor: "#DCD4CD" }}
    >
      {/* ── Row 1: Student info ── */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: "#E9CFCA",
            color: "#3D3935",
          }}
        >
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "#3D3935" }}
            >
              {student.name}
            </p>
            {student.source === "booked" && (
              <span
                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  backgroundColor: "#F1DFC0",
                  color: "#3D3935",
                }}
              >
                Booked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {student.phone && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "#9ca3af" }}
              >
                <Phone className="w-2.5 h-2.5" />
                {student.phone}
              </span>
            )}
            {student.email && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "#9ca3af" }}
              >
                <Mail className="w-2.5 h-2.5" />
                {student.email}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} />
        </button>
      </div>

      {/* ── Row 2: Financial fields ── */}
      <div
        className="px-3 py-3 space-y-2.5"
        style={{
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#FAF7F5",
        }}
      >
        {/* Base Amount — read-only from workshop definition */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#6b7280" }}>
            Base Amount
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              backgroundColor: "#EADDD5",
              color: "#3D3935",
            }}
          >
            {fmt(student.baseFee)}
          </span>
        </div>

        {/* Total Paid + Remaining */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded px-2 py-1.5 text-center"
            style={{
              backgroundColor: "#E9CFCA",
              border: "1px solid #DCD4CD",
            }}
          >
            <p className="text-xs mb-0.5" style={{ color: "#6b7280" }}>
              Total Paid
            </p>
            <p className="text-xs font-semibold" style={{ color: "#3D3935" }}>
              {fmt(totalPaid)}
            </p>
          </div>
        </div>

        {overpaid && (
          <p
            className="text-xs flex items-center gap-1"
            style={{ color: "#D0A096" }}
          >
            <AlertTriangle className="w-3 h-3" />
            Paid amount exceeds base amount
          </p>
        )}

        {/* Add Payment row */}
        <div className="flex gap-2 pt-0.5">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (£)"
            value={student.newPaymentAmount}
            onChange={(e) => onChange({ newPaymentAmount: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs rounded border outline-none"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#FEFCFA",
              color: "#3D3935",
            }}
          />
          <input
            type="date"
            value={student.newPaymentDate}
            onChange={(e) => onChange({ newPaymentDate: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs rounded border outline-none"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#FEFCFA",
              color: "#3D3935",
            }}
          />
          <button
            type="button"
            onClick={addPayment}
            disabled={
              !student.newPaymentAmount ||
              parseFloat(student.newPaymentAmount) <= 0
            }
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded font-medium flex-shrink-0 transition-colors"
            style={{
              backgroundColor:
                !student.newPaymentAmount ||
                parseFloat(student.newPaymentAmount) <= 0
                  ? "#DCD4CD"
                  : "#3D3935",
              color: "#FEFCFA",
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* ── Row 3: Payment history (collapsible) ── */}
      {student.payments.length > 0 && (
        <div style={{ borderTop: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={() => onChange({ showHistory: !student.showHistory })}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
              Payment history ({student.payments.length})
            </span>
            {student.showHistory ? (
              <ChevronUp className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} />
            ) : (
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: "#9ca3af" }}
              />
            )}
          </button>
          {student.showHistory && (
            <div
              className="divide-y"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              {student.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      {fmt(p.amount)}
                    </span>
                    <span className="text-xs" style={{ color: "#9ca3af" }}>
                      {new Date(p.date + "T00:00:00").toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePayment(p.id)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3 h-3" style={{ color: "#9ca3af" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  workshops: Workshop[];
  workshopBookings: WorkshopBooking[];
  selectedWorkshopSession?: WorkshopSession;
  onScheduleCreated: (sessions: GeneratedSession[], workshop: Workshop) => void;
}

type AvailableMonth = {
  id: string;
  label: string;
  year: string;
};

export const getAvailableMonths = (count: number = 4): AvailableMonth[] => {
  const months: AvailableMonth[] = [];

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
  });

  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);

    const monthName = formatter.format(date);

    months.push({
      id: monthName.toLowerCase(),
      label: monthName,
      year: String(date.getFullYear()),
    });
  }

  return months;
};

const availableMonths = getAvailableMonths();

export function ScheduleWorkshopDrawer({
  open,
  onClose,
  selectedWorkshopSession,
  workshops,
  workshopBookings,
  onScheduleCreated,
}: Props) {
  // ── form state ──
  const [isCreatingWorkshopSessions, setIsCreatingWorkshopSessions] =
    useState(false);
  const [
    isCreatingWorkshopBookingStudents,
    setIsCreatingWorkshopBookingStudents,
  ] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(
    () => selectedWorkshopSession?.workshop_id || "",
  );
  const [firstSessionDate, setFirstSessionDate] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("10:00 - 12:00");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([2, 4]);
  const [sessions, setSessions] = useState<GeneratedSession[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDateVal, setEditDateVal] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [bookedCandidates, setBookedCandidates] = useState<Student[]>([]);
  const [loadingBookedCandidates, setLoadingBookedCandidates] = useState(false);
  // ── step / flow state ──
  const [step, setStep] = useState<DrawerStep>("form");
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  // ── details step state ──
  const [students, setStudents] = useState<Student[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const drawerRef = useRef<HTMLDivElement>(null);

  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId);
  const sessionCount = selectedWorkshop
    ? parseSessionCount(selectedWorkshop)
    : 6;
  const basePrice = selectedWorkshop?.price ?? 0;

  // Regenerate sessions
  useEffect(() => {
    if (!firstSessionDate || !selectedWeekdays.length) {
      setSessions([]);
      return;
    }
    const first = new Date(firstSessionDate + "T00:00:00");
    setSessions(
      generateSessions(first, selectedWeekdays, sessionCount, timeRange),
    );
  }, [firstSessionDate, selectedWeekdays, timeRange, sessionCount]);

  // Full reset on close
  useEffect(() => {
    if (!open) {
      setSelectedWorkshopId("");
      setFirstSessionDate("");
      setTimeRange("10:00 - 12:00");
      setSelectedWeekdays([2, 4]);
      setSessions([]);
      setEditingIdx(null);
      setSelectedMonth("");
      setStep("form");
      setShowCloseWarning(false);
      setStudents([]);
      setAddingStudent(false);
      setNewStudent({ name: "", email: "", phone: "" });
      setIsCreatingWorkshopBookingStudents(false);
      setIsCreatingWorkshopSessions(false);
    }
  }, [open]);

  useEffect(() => {
    if (!selectedMonth || !selectedWorkshopId) return setBookedCandidates([]);
    getBookedCandidates();
  }, [selectedMonth, selectedWorkshopId]);

  const isEditMode = !!selectedWorkshopSession;

  useEffect(() => {
    if (!open || !selectedWorkshopSession) return;

    setSelectedWorkshopId(selectedWorkshopSession.workshop_id);

    const sessionDate = new Date(
      selectedWorkshopSession.date.includes("T")
        ? selectedWorkshopSession.date
        : selectedWorkshopSession.date + "T00:00:00",
    );
    if (!Number.isNaN(sessionDate.getTime())) {
      const monthName = sessionDate
        .toLocaleDateString("en-US", { month: "long" })
        .toLowerCase();
      setSelectedMonth(monthName);
    }

    if (selectedWorkshopSession.starts_at && selectedWorkshopSession.ends_at) {
      setTimeRange(
        `${selectedWorkshopSession.starts_at} - ${selectedWorkshopSession.ends_at}`,
      );
    }
  }, [open, selectedWorkshopSession]);

  // ── handlers ──

  const getBookedCandidates = async () => {
    try {
      setLoadingBookedCandidates(true);
      const fullMonth =
        availableMonths.find((m) => m.id === selectedMonth) ||
        availableMonths[0];
      const bookedCandidates = await getBookedCandidatesByMonth(
        selectedWorkshopId,
        `${fullMonth.label}-${fullMonth.year}`,
      );
      setBookedCandidates(
        bookedCandidates.map((bc) => makeStudent(bc, basePrice)),
      );
      setLoadingBookedCandidates(false);
    } catch (e) {
      setLoadingBookedCandidates(false);
      console.error("Error getting booked candidates for month:", e);
    }
  };

  const toggleWeekday = (val: number) =>
    setSelectedWeekdays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val],
    );

  const commitEditDate = (idx: number) => {
    if (!editDateVal) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.index === idx
          ? { ...s, date: new Date(editDateVal + "T00:00:00") }
          : s,
      ),
    );
    setEditingIdx(null);
    setEditDateVal("");
  };

  const handleCreateWorkshopSessions = async () => {
    if (!selectedWorkshop || !sessions.length) return;
    try {
      setIsCreatingWorkshopSessions(true);
      let newSessions: any[] = [];
      for (const session of sessions) {
        const startTime = session.time.split("-")[0]?.trim();
        const endTime = session.time.split("-")[1]?.trim();
        const date = `${session.date.getFullYear()}-${session.date.getMonth() + 1}-${session.date.getDate()}`;

        const newSession = await createWorkshopSession({
          workshop_id: selectedWorkshop.id,
          weekdays: selectedWeekdays,
          starts_at: startTime,
          ends_at: endTime,
          date: date,
          status: "scheduled",
        });

        newSessions.push({ ...session, id: newSession.id });
        console.log("newSessions ===>", newSessions);
      }
      setSessions(newSessions);
      setIsCreatingWorkshopSessions(false);
      onScheduleCreated(sessions, selectedWorkshop);
      setStep("created");
      setIsCreatingWorkshopSessions(false);
    } catch (e) {
      alert("Error creating workshop sessions: " + e);
      setIsCreatingWorkshopSessions(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedWorkshop || !sessions.length) return;
    try {
      setIsCreatingWorkshopBookingStudents(true);
      let promises: Promise<void>[] = [];
      for (const student of students) {
        for (const session of sessions) {
          console.log("session ===>", session);
          console.log("student ===>", student);
          promises.push(
            createWorkshopBookingStudent({
              workshop_id: selectedWorkshop.id,
              workshop_session_id: session.id,
              user_id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
            }),
          );
        }
        promises.push(
          updateWorkshopBookingStatusToScheduled(student.bookingId),
        );
      }
      await Promise.all(promises);
      setIsCreatingWorkshopBookingStudents(false);
      onClose();
    } catch (e) {
      alert("Error saving schedule: " + e);
    }
    setIsCreatingWorkshopBookingStudents(false);
  };

  const handleCloseRequest = () => {
    if (step === "form") onClose();
    else setShowCloseWarning(true);
  };

  const updateStudent = (id: string, patch: Partial<Student>) =>
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );

  const removeStudent = (id: string) =>
    setStudents((prev) => prev.filter((s) => s.id !== id));

  const addManualStudent = () => {
    if (!newStudent.name.trim() || !newStudent.phone.trim()) return;
    setStudents((prev) => [
      ...prev,
      makeStudent(
        {
          id: crypto.randomUUID(),
          name: newStudent.name,
          phone: newStudent.phone,
          email: newStudent.email,
          source: "manual",
        },
        basePrice,
      ),
    ]);
    setNewStudent({ name: "", email: "", phone: "" });
    setAddingStudent(false);
  };

  // ── render ──

  const isFull =
    students.length >= (selectedWorkshop ? selectedWorkshop?.capacity || 1 : 1);

  const selectedMonthName = selectedMonth
    ? new Date(selectedMonth + "-01T00:00:00")
        .toLocaleDateString("en-US", { month: "long" })
        .toLowerCase()
    : null;
  const assignedBookingIds = new Set(
    students.filter((s) => s.source === "booked").map((s) => s.id),
  );

  const addFromBooking = (wb: WorkshopBooking) => {
    if (isFull) return;
    const monthLabel = wb.preferred_month
      ? wb.preferred_month.charAt(0).toUpperCase() + wb.preferred_month.slice(1)
      : "";
    setStudents((prev) => [
      ...prev,
      makeStudent(
        {
          id: wb.user_id,
          bookingId: wb.id,
          name: wb.participant_name,
          phone: wb.phone ?? "",
          email: wb.participant_email ?? "",
          source: "booked",
          bookingMonth: monthLabel,
        },
        basePrice,
      ),
    ]);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ backgroundColor: "rgba(61,57,53,0.25)" }}
        onClick={handleCloseRequest}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          width: "460px",
          backgroundColor: "#FEFCFA",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-4px 0 24px rgba(61,57,53,0.10)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "#3D3935" }}
              >
                {step === "details"
                  ? "Workshop Details"
                  : isEditMode
                    ? "Edit Session"
                    : "Schedule Workshop"}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                {step === "details"
                  ? `${selectedWorkshop?.title ?? "Workshop"} · ${sessions.length} sessions`
                  : isEditMode
                    ? "Update this workshop session"
                    : "Create a scheduled run for an existing workshop"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseRequest}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" style={{ color: "#6b7280" }} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {(["form", "created", "details"] as DrawerStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor:
                      step === s
                        ? "#3D3935"
                        : (step === "created" && s === "form") ||
                            step === "details"
                          ? "#E9CFCA"
                          : "#DCD4CD",
                    color:
                      step === s
                        ? "#FEFCFA"
                        : (step === "created" && s === "form") ||
                            step === "details"
                          ? "#3D3935"
                          : "#9ca3af",
                  }}
                >
                  {(step === "created" && s === "form") || step === "details"
                    ? "✓"
                    : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className="h-px w-8"
                    style={{
                      backgroundColor:
                        (i === 0 &&
                          (step === "created" || step === "details")) ||
                        (i === 1 && step === "details")
                          ? "#E9CFCA"
                          : "#DCD4CD",
                    }}
                  />
                )}
              </div>
            ))}
            <span className="ml-1 text-xs" style={{ color: "#9ca3af" }}>
              {step === "form"
                ? "Set schedule"
                : step === "created"
                  ? "Created!"
                  : "Add details"}
            </span>
          </div>

          <div
            className="mt-4 h-px w-full"
            style={{ backgroundColor: "#e5e7eb" }}
          />
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {/* ══ STEP: FORM ══ */}
          {step === "form" && (
            <div className="space-y-6">
              {/* Workshop */}
              <section>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#3D3935" }}
                >
                  Workshop
                </label>
                <>
                  {" "}
                  {console.log(
                    "selectedWorkshopId =======>",
                    selectedWorkshopId,
                  )}
                </>

                <Select
                  value={selectedWorkshopId}
                  onValueChange={setSelectedWorkshopId}
                >
                  <SelectTrigger
                    className="w-full border text-sm"
                    style={{
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                  >
                    <SelectValue placeholder="Select workshop type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops
                      .filter((w) => w.is_active)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedWorkshop && (
                  <p className="mt-2 text-xs" style={{ color: "#9ca3af" }}>
                    Capacity: {parseCapacity(selectedWorkshop.class_type)}{" "}
                    students
                    {" • "}Sessions: {parseSessionCount(selectedWorkshop)}
                    {selectedWorkshop.session_duration_hours
                      ? ` × ${selectedWorkshop.session_duration_hours}h`
                      : ""}
                    {selectedWorkshop.price != null &&
                      ` • Base price: £${selectedWorkshop.price}`}
                  </p>
                )}
              </section>

              {/* Booking Month */}
              <section>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#3D3935" }}
                >
                  Booking Month
                </label>
                <div className="flex gap-2">
                  {availableMonths.map((m) => {
                    const isSel = selectedMonth === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMonth(m.id)}
                        className="flex-1 flex flex-col items-center justify-center py-3 rounded-lg border text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: isSel ? "#F1DFC0" : "#FAF7F5",
                          borderColor: isSel ? "#3D3935" : "#DCD4CD",
                          color: "#3D3935",
                          borderWidth: isSel ? "2px" : "1px",
                        }}
                      >
                        {isSel && (
                          <span className="mb-1 text-base leading-none">✓</span>
                        )}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "#9ca3af" }}>
                  Students who booked this workshop for this month will be
                  suggested when adding participants.
                </p>

                {!selectedMonth ||
                !selectedWorkshopId ? null : loadingBookedCandidates ? (
                  <div className="flex items-center justify-center mt-2">
                    <div
                      className="text-sm mt-1.5"
                      style={{ color: "#9ca3af" }}
                    >
                      Loading booked candidates...
                    </div>
                  </div>
                ) : bookedCandidates.length > 0 ? (
                  <div className="flex items-center justify-center mt-2">
                    <p className="mt-1.5 text-sm" style={{ color: "#9ca3af" }}>
                      {bookedCandidates.length} booked candidates found
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center mt-2">
                    <p className="mt-1.5 text-sm" style={{ color: "#9ca3af" }}>
                      No booked candidates found
                    </p>
                  </div>
                )}
              </section>

              {/* Session Schedule */}
              <section>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "#3D3935" }}
                >
                  Session Schedule
                </p>
                <div className="space-y-4">
                  {!isEditMode && (
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "#3D3935" }}
                      >
                        First Session Date
                      </label>
                      <input
                        type="date"
                        value={firstSessionDate}
                        onChange={(e) => setFirstSessionDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FEFCFA",
                          color: "#3D3935",
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "#3D3935" }}
                    >
                      Session Time
                    </label>
                    <input
                      type="text"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      placeholder="10:00 - 12:00"
                      className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        color: "#3D3935",
                      }}
                    />
                  </div>
                  {!isEditMode && (
                    <div>
                      <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: "#3D3935" }}
                      >
                        Repeat on
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {WEEKDAYS.map((day) => {
                          const active = selectedWeekdays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleWeekday(day.value)}
                              className="w-9 h-9 rounded-md text-xs font-medium border transition-colors"
                              style={{
                                backgroundColor: active ? "#3D3935" : "#FAF7F5",
                                borderColor: active ? "#3D3935" : "#DCD4CD",
                                color: active ? "#FEFCFA" : "#3D3935",
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Selected / Generated Sessions */}
              {isEditMode && selectedWorkshopSession ? (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#3D3935" }}
                    >
                      Session
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "#E9CFCA",
                        color: "#3D3935",
                      }}
                    >
                      1 session
                    </span>
                  </div>
                  <div
                    className="rounded-md border"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-medium w-16 flex-shrink-0"
                          style={{ color: "#9ca3af" }}
                        >
                          Session
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#3D3935" }}
                        >
                          {formatSessionDate(
                            new Date(
                              selectedWorkshopSession.date.includes("T")
                                ? selectedWorkshopSession.date
                                : selectedWorkshopSession.date + "T00:00:00",
                            ),
                          )}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#6b7280" }}
                        >
                          {timeRange ||
                            `${selectedWorkshopSession.starts_at} - ${selectedWorkshopSession.ends_at}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              ) : sessions.length > 0 ? (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#3D3935" }}
                    >
                      Generated Sessions
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "#E9CFCA",
                        color: "#3D3935",
                      }}
                    >
                      {sessions.length} session
                      {sessions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    className="rounded-md border divide-y"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    {sessions.map((s) => (
                      <div
                        key={s.index}
                        className="flex items-center justify-between px-3 py-2.5"
                      >
                        {editingIdx === s.index ? (
                          <div className="flex items-center gap-2 flex-1">
                            <span
                              className="text-xs font-medium w-16 flex-shrink-0"
                              style={{ color: "#9ca3af" }}
                            >
                              Session {s.index}
                            </span>
                            <input
                              type="date"
                              value={editDateVal}
                              onChange={(e) => setEditDateVal(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs rounded border"
                              style={{ borderColor: "#DCD4CD" }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => commitEditDate(s.index)}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <Check
                                className="w-3.5 h-3.5"
                                style={{ color: "#3D3935" }}
                              />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs font-medium w-16 flex-shrink-0"
                                style={{ color: "#9ca3af" }}
                              >
                                Session {s.index}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "#3D3935" }}
                              >
                                {formatSessionDate(s.date)}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "#6b7280" }}
                              >
                                {s.time}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIdx(s.index);
                                setEditDateVal(
                                  s.date.toISOString().split("T")[0],
                                );
                              }}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <Pencil
                                className="w-3 h-3"
                                style={{ color: "#9ca3af" }}
                              />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <div
                  className="rounded-md border border-dashed px-4 py-6 text-center"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <GraduationCap
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: "#DCD4CD" }}
                  />
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Select a workshop, first session date, and repeat days to
                    preview generated sessions.
                  </p>
                </div>
              )}
              <div className="h-4" />
            </div>
          )}

          {/* ══ STEP: CREATED ══ */}
          {step === "created" && (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E9CFCA" }}
              >
                <CheckCircle className="w-9 h-9" style={{ color: "#3D3935" }} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1" style={{ color: "#3D3935" }}>
                  Workshop run created!
                </h3>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {sessions.length} session
                  {sessions.length !== 1 ? "s" : ""} have been added to the
                  calendar.
                </p>
                {selectedWorkshop && (
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                    {selectedWorkshop.title}
                  </p>
                )}
              </div>
              <div
                className="w-full rounded-md border divide-y"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                {sessions.slice(0, 4).map((s) => (
                  <div
                    key={s.index}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span
                      className="text-xs font-medium w-16 flex-shrink-0"
                      style={{ color: "#9ca3af" }}
                    >
                      Session {s.index}
                    </span>
                    <span className="text-xs" style={{ color: "#3D3935" }}>
                      {formatSessionDate(s.date)}
                    </span>
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      {s.time}
                    </span>
                  </div>
                ))}
                {sessions.length > 4 && (
                  <div className="px-3 py-2 text-center">
                    <span className="text-xs" style={{ color: "#9ca3af" }}>
                      +{sessions.length - 4} more session
                      {sessions.length - 4 !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full py-3 rounded-md text-sm font-semibold border-2 transition-colors"
                  style={{
                    backgroundColor: "#3D3935",
                    borderColor: "#3D3935",
                    color: "#FEFCFA",
                  }}
                >
                  Continue setup (recommended)
                </button>
                <button
                  type="button"
                  onClick={handleCloseRequest}
                  className="w-full py-3 rounded-md text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                  }}
                >
                  Close for now
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP: DETAILS ══ */}
          {step === "details" && (
            <div className="space-y-5 py-2">
              {/* Workshop summary */}
              <div
                className="rounded-md border p-3 flex items-center gap-3"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#F1DFC0",
                }}
              >
                <GraduationCap
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "#3D3935" }}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#3D3935" }}
                  >
                    {selectedWorkshop?.title}
                  </p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>
                    {sessions.length} sessions ·{" "}
                    {sessions[0] && formatSessionDate(sessions[0].date)} –{" "}
                    {sessions[sessions.length - 1] &&
                      formatSessionDate(sessions[sessions.length - 1].date)}
                  </p>
                </div>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: "#E9CFCA",
                    color: "#3D3935",
                  }}
                >
                  Scheduled
                </span>
              </div>

              {/* ── Financial Summary ── */}
              <FinancialSummary
                students={students}
                firstSessionDate={firstSessionDate}
              />

              <div
                className="h-px w-full"
                style={{ backgroundColor: "#e5e7eb" }}
              />

              {/* ── Students ── */}
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#3D3935" }}
                  >
                    Students
                  </p>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                    style={{
                      backgroundColor: isFull ? "#DCD4CD" : "#E9CFCA",
                      borderColor: "#3D3935",
                      color: "#3D3935",
                    }}
                  >
                    Seats: {students.length} /
                    {selectedWorkshop ? selectedWorkshop?.capacity || 1 : 1}
                  </span>
                </div>
                {isFull && (
                  <p
                    className="text-xs mb-3 text-center py-1.5 rounded"
                    style={{
                      backgroundColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                  >
                    Workshop capacity reached
                  </p>
                )}

                {/* Booked candidates */}
                {bookedCandidates.length > 0 && (
                  <div className="mb-4">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#6b7280" }}
                    >
                      Booked Students
                    </p>
                    <div
                      className="rounded-md border divide-y"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      {bookedCandidates
                        .filter(
                          (wb) =>
                            students.length === 0 ||
                            students.some((s) => s.id !== wb.user_id),
                        )
                        .map((wb) => (
                          <div
                            key={wb.id}
                            className="flex items-center gap-3 px-3 py-2.5"
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: "#F1DFC0",
                                color: "#3D3935",
                              }}
                            >
                              {wb.participant_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs font-medium truncate"
                                style={{ color: "#3D3935" }}
                              >
                                {wb.participant_name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {wb.phone ? (
                                  <span
                                    className="flex items-center gap-1 text-xs"
                                    style={{ color: "#9ca3af" }}
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    {wb.phone}
                                  </span>
                                ) : wb.email ? (
                                  <span
                                    className="flex items-center gap-1 text-xs"
                                    style={{ color: "#9ca3af" }}
                                  >
                                    <Mail className="w-2.5 h-2.5" />
                                    {wb.email}
                                  </span>
                                ) : null}
                                {wb.preferred_month && (
                                  <span
                                    className="text-xs"
                                    style={{ color: "#9ca3af" }}
                                  >
                                    ·{" "}
                                    {wb.preferred_month
                                      .charAt(0)
                                      .toUpperCase() +
                                      wb.preferred_month.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0"
                              style={{
                                backgroundColor: "#E9CFCA",
                                color: "#3D3935",
                              }}
                            >
                              Booked
                            </span>
                            <button
                              type="button"
                              onClick={() => addFromBooking(wb)}
                              disabled={isFull}
                              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border font-medium transition-colors flex-shrink-0"
                              style={{
                                backgroundColor: isFull
                                  ? "transparent"
                                  : "#3D3935",
                                borderColor: isFull ? "#DCD4CD" : "#3D3935",
                                color: isFull ? "#9ca3af" : "#FEFCFA",
                                cursor: isFull ? "not-allowed" : "pointer",
                              }}
                            >
                              <UserPlus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Assigned students */}
                {students.length > 0 && (
                  <div className="mb-4">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#6b7280" }}
                    >
                      Assigned Students
                    </p>
                    <div className="space-y-3">
                      {students.map((student) => (
                        <StudentCard
                          key={student.id}
                          student={student}
                          onChange={(patch) => updateStudent(student.id, patch)}
                          onRemove={() => removeStudent(student.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {students.length === 0 && bookedCandidates.length === 0 && (
                  <div
                    className="rounded-md border border-dashed py-5 text-center mb-4"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <UserCheck
                      className="w-5 h-5 mx-auto mb-1.5"
                      style={{ color: "#DCD4CD" }}
                    />
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {selectedMonth
                        ? "No bookings found for this month. Add students manually below."
                        : "No booking month selected. Add students manually below."}
                    </p>
                  </div>
                )}

                {/* Add manually */}
                {!addingStudent && !isFull && (
                  <button
                    type="button"
                    onClick={() => setAddingStudent(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed text-xs font-medium transition-colors hover:bg-gray-50"
                    style={{
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Student Manually
                  </button>
                )}

                {addingStudent && (
                  <div
                    className="rounded-md border p-3 space-y-2"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: "#3D3935" }}
                    >
                      Add Student Manually
                    </p>
                    <input
                      type="text"
                      placeholder="Full name *"
                      value={newStudent.name}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        color: "#3D3935",
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={newStudent.phone}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        color: "#3D3935",
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newStudent.email}
                      onChange={(e) =>
                        setNewStudent((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        color: "#3D3935",
                      }}
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingStudent(false);
                          setNewStudent({
                            name: "",
                            email: "",
                            phone: "",
                          });
                        }}
                        className="flex-1 py-1.5 text-xs rounded border"
                        style={{
                          borderColor: "#DCD4CD",
                          color: "#6b7280",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addManualStudent}
                        disabled={
                          !newStudent.name.trim() || !newStudent.phone.trim()
                        }
                        className="flex-1 py-1.5 text-xs rounded font-medium"
                        style={{
                          backgroundColor:
                            !newStudent.name.trim() || !newStudent.phone.trim()
                              ? "#DCD4CD"
                              : "#3D3935",
                          color: "#FEFCFA",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-4" />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step === "form" && (
          <div
            className="flex-shrink-0 px-6 py-4 flex items-center justify-end gap-3"
            style={{
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#FEFCFA",
            }}
          >
            <Button
              type="button"
              onClick={handleCloseRequest}
              className="border"
              style={{
                backgroundColor: "transparent",
                borderColor: "#DCD4CD",
                color: "#3D3935",
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateWorkshopSessions}
              disabled={!selectedWorkshop || sessions.length === 0}
              style={{
                backgroundColor:
                  !selectedWorkshop ||
                  sessions.length === 0 ||
                  isCreatingWorkshopSessions
                    ? "#DCD4CD"
                    : "#3D3935",
                borderColor:
                  !selectedWorkshop ||
                  sessions.length === 0 ||
                  isCreatingWorkshopSessions
                    ? "#DCD4CD"
                    : "#3D3935",
                color: "#FEFCFA",
              }}
            >
              {isCreatingWorkshopSessions
                ? "Creating Sessions..."
                : "Create Schedule"}
            </Button>
          </div>
        )}

        {step === "details" && (
          <div
            className="flex-shrink-0 px-6 py-4 flex items-center justify-end gap-3"
            style={{
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#FEFCFA",
            }}
          >
            <Button
              type="button"
              onClick={handleCloseRequest}
              className="border"
              style={{
                backgroundColor: "transparent",
                borderColor: "#DCD4CD",
                color: "#3D3935",
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSaveSchedule}
              style={{
                backgroundColor: isCreatingWorkshopBookingStudents
                  ? "#DCD4CD"
                  : "#3D3935",
                color: isCreatingWorkshopBookingStudents
                  ? "#9ca3af"
                  : "#FEFCFA",
                border: isCreatingWorkshopBookingStudents
                  ? "#DCD4CD"
                  : "#3D3935",
                borderColor: isCreatingWorkshopBookingStudents
                  ? "#DCD4CD"
                  : "#3D3935",
                cursor: isCreatingWorkshopBookingStudents
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {isCreatingWorkshopBookingStudents ? "Saving..." : "Save & Close"}
            </Button>
          </div>
        )}
      </div>

      {/* Warning modal */}
      {showCloseWarning &&
        createPortal(
          <WarningModal
            onContinue={() => {
              setShowCloseWarning(false);
              setStep("details");
            }}
            onClose={() => {
              setShowCloseWarning(false);
              onClose();
            }}
          />,
          document.body,
        )}
    </>
  );
}
