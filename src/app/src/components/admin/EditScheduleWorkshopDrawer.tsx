import { useEffect, useRef, useState } from "react";
import {
  X,
  GraduationCap,
  Phone,
  Mail,
  UserPlus,
  UserCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Workshop } from "../../schema/workshop.schema";
import {
  WorkshopBookingWithUser,
  WorkshopBookingStatus,
} from "../../schema/workshop-booking.schema";
import { getWorkshopById } from "../../lib/db/workshops";
import {
  createWorkshopBookingStudent,
  getAllPendingBookedCandidates,
  getClassStudents,
  getWorkshopSessionById,
  getWorkshopSessionsByClassId,
  removeStudentFromClass,
  updateWorkshopBookingStatus,
  updateWorkshopSession,
} from "../../lib/db/workshop-bookings";

type DrawerStep = "sessions" | "students";

interface EditableSession {
  id: string;
  index: number;
  date: string;
  startsAt: string;
  endsAt: string;
}

interface ClassStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bookingId?: string;
  source: "assigned" | "booked";
}

interface Props {
  open: boolean;
  onClose: () => void;
  workshopId: string;
  workshopSessionId: string;
  onUpdated?: () => void;
}

function parseCapacity(classType: string | undefined, fallback = 3): number {
  if (!classType) return fallback;
  const match = classType.match(/(\d+)\s*student/i);
  return match ? parseInt(match[1], 10) : fallback;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(
    dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`,
  );
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function normalizeTime(value: string): string {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function participantToStudent(
  participant: {
    user_id: string;
    name: string;
    email: string;
    phone: string;
  },
  bookingId?: string,
): ClassStudent {
  return {
    id: participant.user_id,
    userId: participant.user_id,
    name: participant.name,
    email: participant.email || "",
    phone: participant.phone || "",
    bookingId,
    source: bookingId ? "booked" : "assigned",
  };
}

function bookingToStudent(booking: WorkshopBookingWithUser): ClassStudent {
  return {
    id: booking.user_id || booking.id,
    userId: booking.user_id || booking.id,
    name: booking.participant_name,
    email: booking.participant_email || booking.user?.email || "",
    phone: booking.participant_phone || booking.user?.phone || "",
    bookingId: booking.id,
    source: "booked",
  };
}

export default function EditScheduleWorkshopDrawer({
  open,
  onClose,
  workshopId,
  workshopSessionId,
  onUpdated,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<DrawerStep>("sessions");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [classId, setClassId] = useState<string>("");
  const [sessions, setSessions] = useState<EditableSession[]>([]);
  const [originalSessions, setOriginalSessions] = useState<EditableSession[]>(
    [],
  );

  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [initialStudents, setInitialStudents] = useState<ClassStudent[]>([]);
  const [initialStudentIds, setInitialStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingCandidates, setPendingCandidates] = useState<
    WorkshopBookingWithUser[]
  >([]);

  useEffect(() => {
    if (!open || !workshopId || !workshopSessionId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setStep("sessions");

        const [workshopData, anchorSession] = await Promise.all([
          getWorkshopById(workshopId),
          getWorkshopSessionById(workshopSessionId),
        ]);

        if (!workshopData) {
          throw new Error("Workshop not found");
        }
        if (!anchorSession) {
          throw new Error("Workshop session not found");
        }

        const resolvedClassId = anchorSession.class_id;
        const [classSessions, classStudents, pendingBookings] =
          await Promise.all([
            getWorkshopSessionsByClassId(resolvedClassId),
            getClassStudents(resolvedClassId),
            getAllPendingBookedCandidates(workshopId),
          ]);

        const editableSessions: EditableSession[] = classSessions.map(
          (session, index) => ({
            id: session.id,
            index: index + 1,
            date: session.date,
            startsAt: normalizeTime(session.starts_at),
            endsAt: normalizeTime(session.ends_at),
          }),
        );

        const assignedStudents = classStudents.map((participant) =>
          participantToStudent(participant),
        );

        setWorkshop(workshopData);
        setClassId(resolvedClassId);
        setSessions(editableSessions);
        setOriginalSessions(editableSessions);
        setStudents(assignedStudents);
        setInitialStudents(assignedStudents);
        setInitialStudentIds(
          new Set(assignedStudents.map((student) => student.userId)),
        );
        setPendingCandidates(pendingBookings);
      } catch (error) {
        console.error("Failed to load workshop edit data:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load workshop details",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, workshopId, workshopSessionId]);

  useEffect(() => {
    if (!open) {
      setStep("sessions");
      setLoadError(null);
      setWorkshop(null);
      setClassId("");
      setSessions([]);
      setOriginalSessions([]);
      setStudents([]);
      setInitialStudents([]);
      setInitialStudentIds(new Set());
      setPendingCandidates([]);
    }
  }, [open]);

  const capacity = workshop
    ? workshop.capacity || parseCapacity(workshop.class_type)
    : 3;
  const isFull = students.length >= capacity;

  const assignedUserIds = new Set(students.map((student) => student.userId));
  const availablePendingCandidates = pendingCandidates.filter((candidate) => {
    const candidateUserId = candidate.user_id || candidate.id;
    return !assignedUserIds.has(candidateUserId);
  });

  const updateSession = (
    sessionId: string,
    patch: Partial<Pick<EditableSession, "date" | "startsAt" | "endsAt">>,
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...patch } : session,
      ),
    );
  };

  const addStudentFromBooking = (booking: WorkshopBookingWithUser) => {
    if (isFull) return;
    const student = bookingToStudent(booking);
    if (assignedUserIds.has(student.userId)) return;
    setStudents((prev) => [...prev, student]);
  };

  const removeStudent = (userId: string) => {
    setStudents((prev) => prev.filter((student) => student.userId !== userId));
  };

  const saveSessionChanges = async () => {
    const changedSessions = sessions.filter((session) => {
      const original = originalSessions.find((item) => item.id === session.id);
      if (!original) return true;
      return (
        original.date !== session.date ||
        original.startsAt !== session.startsAt ||
        original.endsAt !== session.endsAt
      );
    });

    await Promise.all(
      changedSessions.map((session) =>
        updateWorkshopSession(session.id, {
          date: session.date,
          starts_at: session.startsAt,
          ends_at: session.endsAt,
        }),
      ),
    );

    setOriginalSessions(sessions);
  };

  const saveStudentChanges = async () => {
    if (!workshop || !classId || !sessions.length) return;

    const currentStudentIds = new Set(
      students.map((student) => student.userId),
    );
    const addedStudents = students.filter(
      (student) => !initialStudentIds.has(student.userId),
    );
    const removedStudentIds = [...initialStudentIds].filter(
      (userId) => !currentStudentIds.has(userId),
    );

    const promises: Promise<unknown>[] = [];

    for (const student of addedStudents) {
      for (const session of sessions) {
        promises.push(
          createWorkshopBookingStudent({
            workshop_id: workshop.id,
            workshop_session_id: session.id,
            workshop_class_id: classId,
            user_id: student.userId,
            name: student.name,
            email: student.email,
            phone: student.phone,
          }),
        );
      }
      if (student.bookingId) {
        promises.push(
          updateWorkshopBookingStatus(
            student.bookingId,
            WorkshopBookingStatus.SCHEDULED,
          ),
        );
      }
    }

    for (const userId of removedStudentIds) {
      promises.push(removeStudentFromClass(classId, userId));
      const removedStudent = initialStudents.find(
        (student) => student.userId === userId,
      );
      if (removedStudent?.bookingId) {
        promises.push(
          updateWorkshopBookingStatus(
            removedStudent.bookingId,
            WorkshopBookingStatus.PENDING,
          ),
        );
      }
    }

    await Promise.all(promises);
  };

  const handleContinueToStudents = async () => {
    try {
      setSaving(true);
      await saveSessionChanges();
      setStep("students");
    } catch (error) {
      alert("Error saving session changes: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    try {
      setSaving(true);
      await saveSessionChanges();
      await saveStudentChanges();
      onUpdated?.();
      onClose();
    } catch (error) {
      alert("Error saving workshop changes: " + error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ backgroundColor: "rgba(61,57,53,0.25)" }}
        onClick={onClose}
      />

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
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "#3D3935" }}
              >
                {step === "sessions" ? "Edit Schedule" : "Edit Students"}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                {workshop?.title ?? "Workshop"} ·{" "}
                {step === "sessions"
                  ? "Update session dates and times"
                  : "Manage class participants"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" style={{ color: "#6b7280" }} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {(["sessions", "students"] as DrawerStep[]).map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor:
                      step === item
                        ? "#3D3935"
                        : step === "students" && item === "sessions"
                          ? "#E9CFCA"
                          : "#DCD4CD",
                    color:
                      step === item
                        ? "#FEFCFA"
                        : step === "students" && item === "sessions"
                          ? "#3D3935"
                          : "#9ca3af",
                  }}
                >
                  {step === "students" && item === "sessions" ? "✓" : index + 1}
                </div>
                {index < 1 && (
                  <div
                    className="h-px w-8"
                    style={{
                      backgroundColor:
                        step === "students" ? "#E9CFCA" : "#DCD4CD",
                    }}
                  />
                )}
              </div>
            ))}
            <span className="ml-1 text-xs" style={{ color: "#9ca3af" }}>
              {step === "sessions" ? "Sessions" : "Students"}
            </span>
          </div>

          <div
            className="mt-4 h-px w-full"
            style={{ backgroundColor: "#e5e7eb" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="flex items-center justify-center h-full py-16">
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Loading workshop details...
              </p>
            </div>
          ) : loadError ? (
            <div
              className="rounded-md border px-4 py-6 text-center"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
            >
              <AlertTriangle
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: "#D0A096" }}
              />
              <p className="text-sm" style={{ color: "#3D3935" }}>
                {loadError}
              </p>
            </div>
          ) : step === "sessions" ? (
            <div className="space-y-6">
              <section>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#3D3935" }}
                >
                  Workshop
                </label>
                <div
                  className="rounded-md border px-3 py-3"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FAF7F5",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: "#3D3935" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {workshop?.title}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#9ca3af" }}
                      >
                        Capacity: {capacity} students · {sessions.length}{" "}
                        session{sessions.length !== 1 ? "s" : ""}
                        {workshop?.session_duration_hours
                          ? ` × ${workshop.session_duration_hours}h`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#3D3935" }}
                  >
                    Class Sessions
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "#E9CFCA",
                      color: "#3D3935",
                    }}
                  >
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {sessions.length > 0 ? (
                  <div
                    className="rounded-md border divide-y"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    {sessions.map((session) => (
                      <div key={session.id} className="px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#9ca3af" }}
                          >
                            Session {session.index}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "#6b7280" }}
                          >
                            {formatSessionDate(session.date)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="date"
                            value={session.date}
                            onChange={(e) =>
                              updateSession(session.id, {
                                date: e.target.value,
                              })
                            }
                            className="col-span-1 px-2 py-1.5 text-xs rounded border outline-none"
                            style={{
                              borderColor: "#DCD4CD",
                              backgroundColor: "#FEFCFA",
                              color: "#3D3935",
                            }}
                          />
                          <input
                            type="time"
                            value={session.startsAt}
                            onChange={(e) =>
                              updateSession(session.id, {
                                startsAt: e.target.value,
                              })
                            }
                            className="px-2 py-1.5 text-xs rounded border outline-none"
                            style={{
                              borderColor: "#DCD4CD",
                              backgroundColor: "#FEFCFA",
                              color: "#3D3935",
                            }}
                          />
                          <input
                            type="time"
                            value={session.endsAt}
                            onChange={(e) =>
                              updateSession(session.id, {
                                endsAt: e.target.value,
                              })
                            }
                            className="px-2 py-1.5 text-xs rounded border outline-none"
                            style={{
                              borderColor: "#DCD4CD",
                              backgroundColor: "#FEFCFA",
                              color: "#3D3935",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-md border border-dashed px-4 py-6 text-center"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      No sessions found for this class.
                    </p>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-5 py-2">
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
                    {workshop?.title}
                  </p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>
                    {sessions.length} sessions · Seats {students.length}/
                    {capacity}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#3D3935" }}
                  >
                    Class Students
                  </p>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                    style={{
                      backgroundColor: isFull ? "#DCD4CD" : "#E9CFCA",
                      borderColor: "#3D3935",
                      color: "#3D3935",
                    }}
                  >
                    {students.length}/{capacity}
                  </span>
                </div>

                {students.length > 0 ? (
                  <div
                    className="rounded-md border divide-y mb-4"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    {students.map((student) => (
                      <div
                        key={student.userId}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: "#E9CFCA",
                            color: "#3D3935",
                          }}
                        >
                          {student.name?.charAt(0)?.toUpperCase()}
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
                          onClick={() => removeStudent(student.userId)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                          <Trash2
                            className="w-3.5 h-3.5"
                            style={{ color: "#9ca3af" }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-md border border-dashed py-5 text-center mb-4"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <UserCheck
                      className="w-5 h-5 mx-auto mb-1.5"
                      style={{ color: "#DCD4CD" }}
                    />
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      No students assigned to this class yet.
                    </p>
                  </div>
                )}

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

                {availablePendingCandidates.length > 0 && (
                  <div>
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#6b7280" }}
                    >
                      Pending Booked Candidates
                    </p>
                    <div
                      className="rounded-md border divide-y"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      {availablePendingCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: "#F1DFC0",
                              color: "#3D3935",
                            }}
                          >
                            {candidate.participant_name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: "#3D3935" }}
                            >
                              {candidate.participant_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {(candidate.participant_phone ||
                                candidate.user?.phone) && (
                                <span
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: "#9ca3af" }}
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  {candidate.participant_phone ||
                                    candidate.user?.phone}
                                </span>
                              )}
                              {(candidate.participant_email ||
                                candidate.user?.email) && (
                                <span
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: "#9ca3af" }}
                                >
                                  <Mail className="w-2.5 h-2.5" />
                                  {candidate.participant_email ||
                                    candidate.user?.email}
                                </span>
                              )}
                              {candidate.preferred_month && (
                                <span
                                  className="text-xs"
                                  style={{ color: "#9ca3af" }}
                                >
                                  ·{" "}
                                  {candidate.preferred_month
                                    .charAt(0)
                                    .toUpperCase() +
                                    candidate.preferred_month.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0"
                            style={{
                              backgroundColor: "#FCEAE0",
                              color: "#3D3935",
                            }}
                          >
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => addStudentFromBooking(candidate)}
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
              </div>
            </div>
          )}
        </div>

        {!loading && !loadError && (
          <div
            className="flex-shrink-0 px-6 py-4 flex items-center justify-end gap-3"
            style={{
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#FEFCFA",
            }}
          >
            {step === "sessions" ? (
              <>
                <Button
                  type="button"
                  onClick={onClose}
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
                  onClick={handleContinueToStudents}
                  disabled={sessions.length === 0 || saving}
                  style={{
                    backgroundColor:
                      sessions.length === 0 || saving ? "#DCD4CD" : "#3D3935",
                    borderColor:
                      sessions.length === 0 || saving ? "#DCD4CD" : "#3D3935",
                    color: "#FEFCFA",
                  }}
                >
                  {saving ? "Saving..." : "Continue to Students"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => setStep("sessions")}
                  className="border"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAndClose}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? "#DCD4CD" : "#3D3935",
                    borderColor: saving ? "#DCD4CD" : "#3D3935",
                    color: "#FEFCFA",
                  }}
                >
                  {saving ? "Saving..." : "Save & Close"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
