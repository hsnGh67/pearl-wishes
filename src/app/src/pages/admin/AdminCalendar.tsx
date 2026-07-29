import {
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  CreditCard,
  Search,
  GraduationCap,
  Plus,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useState, useEffect } from "react";
import { getAllBookings, updateBooking } from "../../lib/db/bookings";
import {
  Booking,
  BookingStatus,
  BOOKING_STATUS_LABELS,
  PaymentStatus,
  getBusinessHoursForDate,
} from "../../schema/booking.schema";
import { getAllUsers } from "../../lib/db/users";
import { getAllServices } from "../../lib/db/services";
import { getAllWorkshops } from "../../lib/db/workshops";
import {
  getAllWorkshopBookings,
  cancelWorkshopBooking,
  getWorkshopSessionsByDate,
  getAllWorkshopSessions,
} from "../../lib/db/workshop-bookings";
import { User as UserType } from "../../schema/user.schema";
import { Service } from "../../schema/service.schema";
import { Workshop } from "../../schema/workshop.schema";
import {
  WorkshopBooking,
  WorkshopBookingStatus,
  WORKSHOP_BOOKING_STATUS_LABELS,
  WORKSHOP_PAYMENT_STATUS_LABELS,
  WorkshopSession,
} from "../../schema/workshop-booking.schema";
import {
  getBookingTreatments,
  cancelBookingTreatment,
  getActiveTreatmentCount,
} from "../../lib/db/booking-treatments";
import {
  BookingTreatment,
  BookingTreatmentStatus,
} from "../../schema/booking-treatment.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  AdminBookingForm,
  GAP_MINUTES_PER_PEOPLE,
  GAP_MINUTES_PER_SERVICE,
} from "../../components/admin/AdminBookingForm";
import {
  ScheduleWorkshopDrawer,
  GeneratedSession,
} from "../../components/admin/ScheduleWorkshopDrawer";
import EditScheduleWorkshopDrawer from "../../components/admin/EditScheduleWorkshopDrawer";

type ViewType = "day" | "week" | "month";

interface ScheduledRun {
  sessions: GeneratedSession[];
  workshopTitle: string;
  studentCount: number;
  capacity: number;
}

const getStatusDotColor = (status?: string) => {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("cancel")) return "#F87171"; // red
  if (normalized.includes("pend")) return "#FBBF24"; // yellow
  return "#34D399"; // green
};

export function AdminCalendar() {
  const [viewType, setViewType] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopBookings, setWorkshopBookings] = useState<WorkshopBooking[]>(
    [],
  );
  const [workshopSessions, setWorkshopSessions] = useState<WorkshopSession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedWorkshopSession, setSelectedWorkshopSession] = useState<
    WorkshopSession | undefined
  >(undefined);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkshopBooking, setSelectedWorkshopBooking] =
    useState<WorkshopBooking | null>(null);
  const [isWorkshopDetailsOpen, setIsWorkshopDetailsOpen] = useState(false);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bookingFormMode, setBookingFormMode] = useState<
    "create" | "reschedule"
  >("create");
  const [bookingToReschedule, setBookingToReschedule] =
    useState<Booking | null>(null);
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [isEditWorkshopDrawerOpen, setIsEditWorkshopDrawerOpen] =
    useState(false);
  const [editWorkshopSessionId, setEditWorkshopSessionId] =
    useState<string>("");
  const [editWorkshopId, setEditWorkshopId] = useState<string>("");
  const [scheduledRuns, setScheduledRuns] = useState<ScheduledRun[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);

      let bookingsData: Booking[] = [];
      let usersData: UserType[] = [];
      let servicesData: Service[] = [];
      let workshopsData: Workshop[] = [];
      let workshopSessionsData: WorkshopSession[] = [];
      let workshopBookingsData: WorkshopBooking[] = [];

      try {
        bookingsData = await getAllBookings();
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      try {
        usersData = await getAllUsers();
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      try {
        servicesData = await getAllServices();
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      try {
        workshopsData = await getAllWorkshops();
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      try {
        workshopSessionsData = await getAllWorkshopSessions();
        console.log("workshopSessionsData ===========>", workshopSessionsData);
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      try {
        workshopBookingsData = await getAllWorkshopBookings();
      } catch (err) {
        // Silently handle - error already logged by dbLogger
      }

      console.log("📅 Calendar Data Loaded:", {
        bookings: bookingsData.length,
        users: usersData.length,
        services: servicesData.length,
        workshops: workshopsData.length,
        workshopBookings: workshopBookingsData.length,
        sampleBooking: bookingsData[0],
      });
      setBookings(bookingsData);
      setUsers(usersData);
      setServices(servicesData);
      setWorkshops(workshopsData);
      setWorkshopBookings(workshopBookingsData);
      setWorkshopSessions(workshopSessionsData);
    } catch (error) {
      // Silently handle - error already logged by dbLogger
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.full_name || "Unknown User";
  };

  const getUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.service_name || "Unknown Service1";
  };

  const getService = (serviceId: string) => {
    return services.find((s) => s.id === serviceId);
  };

  const getWorkshopName = (workshopId: string) => {
    const workshop = workshops.find((w) => w.id === workshopId);
    return workshop?.title || "Unknown Workshop";
  };

  const getWorkshop = (workshopId: string) => {
    return workshops.find((w) => w.id === workshopId);
  };

  const handleBookingClick = (
    data: Booking | WorkshopSession,
    type: "booking" | "workshop",
  ) => {
    console.log("booking ==> ", data);
    if (type === "booking") {
      setSelectedBooking(data as Booking);
      setIsDetailsOpen(true);
    } else {
      const session = data as WorkshopSession;
      setEditWorkshopSessionId(session.id);
      setEditWorkshopId(session.workshop_id);
      setIsEditWorkshopDrawerOpen(true);
    }
  };

  const handleWorkshopBookingClick = (workshopBooking: WorkshopBooking) => {
    setSelectedWorkshopBooking(workshopBooking);
    setIsWorkshopDetailsOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !selectedBooking.id) return;

    try {
      await updateBooking(
        {
          id: selectedBooking.id,
          status: BookingStatus.CANCELLED,
        },
        "Canceled",
      );

      // Refresh bookings
      await loadData();
      setIsDetailsOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (viewType === "day") {
      return currentDate.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (viewType === "week") {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Filter bookings based on search query
  const filterBookings = (bookingsToFilter: Booking[]) => {
    if (!searchQuery.trim()) return bookingsToFilter;

    const query = searchQuery.toLowerCase().trim();

    return bookingsToFilter.filter((booking) => {
      // Search by customer name
      const user = getUser(booking.user_id);
      const customerName = user?.full_name?.toLowerCase() || "";

      // Search by phone number (remove spaces and special characters)
      const phone = user?.phone?.replace(/[\s\-\(\)]/g, "").toLowerCase() || "";
      const searchPhone = query.replace(/[\s\-\(\)]/g, "");

      return customerName.includes(query) || phone.includes(searchPhone);
    });
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return filterBookings(bookings)
      .filter((booking) => {
        const d = new Date(booking.appointment_date);
        const bookingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return bookingDate === dateStr;
      })
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  };

  const getWorkshopSessionssForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return workshopSessions
      .filter((session) => {
        if (!session.date) return false;
        const d = new Date(session.date);
        const sessionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return sessionDate === dateStr;
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  };

  const getScheduledSessionsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return scheduledRuns.flatMap((run) =>
      run.sessions
        .filter((s) => s.date.toDateString() === dateStr)
        .map((s) => ({
          ...s,
          workshopTitle: run.workshopTitle,
          studentCount: run.studentCount,
          capacity: run.capacity,
        })),
    );
  };

  const getBookingsCount = (date: Date) => {
    return getBookingsForDate(date).length + getWorkshopSessionssForDate(date).length;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading calendar...</div>
        </div>
      </div>
    );
  }

  console.log("viewType=====>", viewType);
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">Calendar</h1>
          <p className="text-gray-600">Manage appointments and schedules</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={goToToday}
            className="border-2"
            style={{
              borderColor: "#DCD4CD",
              color: "#3D3935",
              backgroundColor: "transparent",
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            className="border-2"
            style={{
              backgroundColor: "#E9CFCA",
              borderColor: "#3D3935",
              color: "#3D3935",
            }}
            onClick={() => {
              setBookingFormMode("create");
              setBookingToReschedule(null);
              setIsBookingFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
          <Button
            type="button"
            className="border-2"
            style={{
              backgroundColor: "#3D3935",
              borderColor: "#3D3935",
              color: "#FEFCFA",
            }}
            onClick={() => {
              setSelectedWorkshopSession(undefined);
              setIsScheduleDrawerOpen(true);
            }}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Schedule Workshop
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6 border-2" style={{ borderColor: "#DCD4CD" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by customer name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-2"
            style={{
              borderColor: "#DCD4CD",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {filterBookings(bookings).length} result
            {filterBookings(bookings).length !== 1 ? "s" : ""} found
          </div>
        )}
      </Card>

      {/* Color Legend */}
      <Card className="p-4 mb-6 border-2" style={{ borderColor: "#DCD4CD" }}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: "#3D3935" }}>
              Appointment Types
            </h3>
            <div className="flex items-center gap-6">
              {/* Nail Treatments */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 border-2"
                  style={{
                    backgroundColor: "#E9CFCA",
                    borderColor: "#3D3935",
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" style={{ color: "#3D3935" }} />
                  <span className="text-sm" style={{ color: "#3D3935" }}>
                    Nail Treatments
                  </span>
                </div>
              </div>

              {/* Workshops */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 border-2"
                  style={{
                    backgroundColor: "#F1DFC0",
                    borderColor: "#3D3935",
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <GraduationCap
                    className="w-4 h-4"
                    style={{ color: "#3D3935" }}
                  />
                  <span className="text-sm" style={{ color: "#3D3935" }}>
                    Workshops
                  </span>
                </div>
              </div>

              {/* Cancelled */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 border-2"
                  style={{
                    backgroundColor: "#DCD4CD",
                    borderColor: "#3D3935",
                  }}
                />
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  Cancelled
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: "#3D3935" }}
            >
              Status Legend
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#34D399" }}
                />
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  Successful
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#FBBF24" }}
                />
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#F87171" }}
                />
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  Cancelled
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* View Selector & Navigation */}
      <Card className="p-6 mb-6 border-2" style={{ borderColor: "#DCD4CD" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6" style={{ color: "#3D3935" }} />
            <div>
              <h3 style={{ color: "#3D3935" }}>{formatDateHeader()}</h3>
              <p className="text-sm text-gray-600">
                {bookings.length} total appointments
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* View Type Selector */}
            <div
              className="flex gap-2 border-2 p-1"
              style={{ borderColor: "#DCD4CD" }}
            >
              <button
                type="button"
                onClick={() => setViewType("day")}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    viewType === "day" ? "#E9CFCA" : "transparent",
                  color: "#3D3935",
                }}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewType("week")}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    viewType === "week" ? "#E9CFCA" : "transparent",
                  color: "#3D3935",
                }}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewType("month")}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    viewType === "month" ? "#E9CFCA" : "transparent",
                  color: "#3D3935",
                }}
              >
                Month
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => navigateDate("prev")}
                className="border-2 w-10 h-10 p-0"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => navigateDate("next")}
                className="border-2 w-10 h-10 p-0"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Views */}
      {viewType === "day" && (
        <DayView
          date={currentDate}
          bookings={getBookingsForDate(currentDate)}
          workshopBookings={workshopSessions}
          getUserName={getUserName}
          getServiceName={getServiceName}
          getService={getService}
          onBookingClick={handleBookingClick}
          scheduledSessions={getScheduledSessionsForDate(currentDate)}
        />
      )}
      {viewType === "week" && (
        <WeekView
          date={currentDate}
          bookings={bookings}
          workshopBookings={workshopSessions}
          getUserName={getUserName}
          getServiceName={getServiceName}
          getBookingsForDate={getBookingsForDate}
          onBookingClick={handleBookingClick}
        />
      )}
      {viewType === "month" && (
        <MonthView date={currentDate} getBookingsCount={getBookingsCount} />
      )}

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <BookingDetailsDialog
          booking={selectedBooking}
          user={getUser(selectedBooking.user_id)}
          service={getService(selectedBooking.service_id)}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onCancel={handleCancelBooking}
          onReschedule={() => {
            setBookingToReschedule(selectedBooking);
            setBookingFormMode("reschedule");
            setIsBookingFormOpen(true);
          }}
        />
      )}

      {/* Workshop Booking Details Dialog */}
      {selectedWorkshopBooking && (
        <WorkshopBookingDetailsDialog
          workshopBooking={selectedWorkshopBooking}
          open={isWorkshopDetailsOpen}
          onOpenChange={setIsWorkshopDetailsOpen}
          onCancel={async () => {
            if (!selectedWorkshopBooking?.id) return;
            try {
              await cancelWorkshopBooking(selectedWorkshopBooking.id);
              await loadData();
              setIsWorkshopDetailsOpen(false);
              setSelectedWorkshopBooking(null);
            } catch (error) {
              console.error("Failed to cancel workshop booking:", error);
              alert("Failed to cancel workshop booking. Please try again.");
            }
          }}
        />
      )}

      {/* Admin Booking Form */}
      <AdminBookingForm
        open={isBookingFormOpen}
        onOpenChange={setIsBookingFormOpen}
        onSuccess={async () => {
          await loadData();
          setIsBookingFormOpen(false);
        }}
        existingBooking={bookingToReschedule || undefined}
        mode={bookingFormMode}
      />

      {/* Schedule Workshop Drawer */}

      <ScheduleWorkshopDrawer
        selectedWorkshopSession={selectedWorkshopSession}
        open={isScheduleDrawerOpen}
        onClose={() => {
          setIsScheduleDrawerOpen(false);
          setSelectedWorkshopSession(undefined);
        }}
        workshops={workshops}
        workshopBookings={workshopBookings}
        onScheduleCreated={(sessions, workshop) => {
          const capMatch = workshop.class_type?.match(/(\d+)\s*student/i);
          setScheduledRuns((prev) => [
            ...prev,
            {
              sessions,
              workshopTitle: workshop.title,
              studentCount: 0,
              capacity: capMatch ? parseInt(capMatch[1], 10) : 3,
            },
          ]);
        }}
      />

      <EditScheduleWorkshopDrawer
        open={isEditWorkshopDrawerOpen}
        onClose={() => {
          setIsEditWorkshopDrawerOpen(false);
          setEditWorkshopSessionId("");
          setEditWorkshopId("");
        }}
        workshopId={editWorkshopId}
        workshopSessionId={editWorkshopSessionId}
        onUpdated={loadData}
      />
    </div>
  );
}

// Booking Details Dialog Component
function BookingDetailsDialog({
  booking,
  user,
  service,
  open,
  onOpenChange,
  onCancel,
  onReschedule,
}: {
  booking: Booking;
  user?: UserType;
  service?: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onReschedule?: () => void;
}) {
  const [treatments, setTreatments] = useState<BookingTreatment[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [activeTreatmentCount, setActiveTreatmentCount] = useState(0);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>(
    [],
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    booking.payment_status,
  );
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    if (open && booking.id) {
      loadTreatments();
      setPaymentStatus(booking.payment_status);
    }
  }, [open, booking.id, booking.payment_status]);

  const loadTreatments = async () => {
    if (!booking.id) return;

    try {
      setLoadingTreatments(true);
      const data = await getBookingTreatments(booking.id);
      console.log("LLLLLLLLLLLLLLLLLLLLLL ==>", data);
      setTreatments(data);

      const activeCount = data.filter(
        (t) => t.status === BookingTreatmentStatus.ACTIVE,
      ).length;
      setActiveTreatmentCount(activeCount);
    } catch (error) {
      console.error("Failed to load treatments:", error);
    } finally {
      setLoadingTreatments(false);
    }
  };

  const handleOpenCancellationModal = () => {
    // Reset selections when opening modal
    setSelectedTreatmentIds([]);
    setIsCancellationModalOpen(true);
  };

  const handleToggleTreatment = (treatmentId: string) => {
    setSelectedTreatmentIds((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId],
    );
  };

  const handleSelectAll = () => {
    const activeTreatments = treatments.filter(
      (t) => t.status === BookingTreatmentStatus.ACTIVE,
    );
    if (selectedTreatmentIds.length === activeTreatments.length) {
      // Deselect all
      setSelectedTreatmentIds([]);
    } else {
      // Select all active
      setSelectedTreatmentIds(activeTreatments.map((t) => t.id!));
    }
  };

  const handleConfirmCancellation = async () => {
    if (selectedTreatmentIds.length === 0) {
      alert("Please select at least one treatment to cancel.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to cancel ${selectedTreatmentIds.length} treatment(s)?`,
      )
    ) {
      return;
    }

    try {
      // Cancel each selected treatment
      for (const treatmentId of selectedTreatmentIds) {
        await cancelBookingTreatment(treatmentId);
      }

      // Reload treatments
      await loadTreatments();

      // Check if all treatments are now cancelled
      const activeCount = await getActiveTreatmentCount(booking.id!);
      if (activeCount === 0) {
        // If no active treatments left, cancel the whole booking
        await onCancel();
      }

      // Close the cancellation modal
      setIsCancellationModalOpen(false);
      setSelectedTreatmentIds([]);
    } catch (error) {
      console.error("Failed to cancel treatments:", error);
      alert("Failed to cancel treatments. Please try again.");
    }
  };

  const handleCancelTreatment = async (treatmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this treatment?")) {
      return;
    }

    try {
      await cancelBookingTreatment(treatmentId);
      await loadTreatments();

      // Check if all treatments are now cancelled
      const activeCount = await getActiveTreatmentCount(booking.id!);
      if (activeCount === 0) {
        // If no active treatments left, cancel the whole booking
        await onCancel();
      }
    } catch (error) {
      console.error("Failed to cancel treatment:", error);
      alert("Failed to cancel treatment. Please try again.");
    }
  };

  const handleCancelAllTreatments = async () => {
    if (
      !window.confirm("Are you sure you want to cancel the entire appointment?")
    ) {
      return;
    }

    await onCancel();
  };

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    if (!booking.id) return;

    try {
      setIsUpdatingPayment(true);
      await updateBooking(
        {
          id: booking.id,
          payment_status: newStatus,
        },
        "",
      );
      setPaymentStatus(newStatus);
      // Successfully updated - status will persist in database
    } catch (error) {
      console.error("Failed to update payment status:", error);
      alert("Failed to update payment status. Please try again.");
      setPaymentStatus(booking.payment_status); // Revert on error
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const canBeCancelled =
    booking.status !== BookingStatus.CANCELLED &&
    booking.status !== BookingStatus.COMPLETED;

  const numberOfServices = treatments.length;
  const numberOfPeople = booking.people_numbers || 1; // Assuming each treatment is for one person

  const totalDuration =
    treatments.reduce(
      (total, treatment) => total + (treatment.duration || 0),
      0,
    ) +
    (numberOfServices - 1) * GAP_MINUTES_PER_SERVICE +
    (numberOfPeople - 1) * GAP_MINUTES_PER_PEOPLE; // Adding 10 minutes for each additional person

  console.log("admin Calendar selected booking ===>", booking);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderColor: "#DCD4CD", borderWidth: "2px" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#3D3935" }}>
            Booking Details
          </DialogTitle>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-6 overflow-y-auto pr-2"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {/* Status Badges with Titles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Booking Status</span>
                <div
                  className="px-4 py-2 font-semibold text-sm"
                  style={{
                    backgroundColor:
                      booking.status === "cancelled"
                        ? "#DCD4CD"
                        : booking.status === "confirmed"
                          ? "#E9CFCA"
                          : "#F1DFC0",
                    color: "#3D3935",
                  }}
                >
                  {BOOKING_STATUS_LABELS[booking.status]}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Payment Status</span>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) =>
                    handlePaymentStatusChange(value as PaymentStatus)
                  }
                  disabled={isUpdatingPayment}
                >
                  <SelectTrigger
                    className="px-4 py-2 text-sm border-2"
                    style={{
                      backgroundColor:
                        paymentStatus === PaymentStatus.PAID
                          ? "#E9CFCA"
                          : paymentStatus === PaymentStatus.UNPAID
                            ? "#F1DFC0"
                            : paymentStatus === PaymentStatus.PARTIALL_PAID
                              ? "#DCD4CD"
                              : "#EADDD5",
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={PaymentStatus.PARTIALL_PAID}>
                      Partially Paid
                    </SelectItem>
                    <SelectItem value={PaymentStatus.PARTIALL_REFUNDED}>
                      Partially Refunded
                    </SelectItem>
                    <SelectItem value={PaymentStatus.UNPAID}>
                      Pending
                    </SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED}>
                      Refunded
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-xl font-bold" style={{ color: "#3D3935" }}>
              £{booking.total_amount.toFixed(2)}
            </div>
          </div>

          {/* Treatments/People Section */}
          {treatments.length > 0 && (
            <div
              className="border-2 p-4 space-y-3"
              style={{ borderColor: "#DCD4CD" }}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold" style={{ color: "#3D3935" }}>
                  Treatments ({activeTreatmentCount} active)
                </h4>
                {canBeCancelled && activeTreatmentCount > 0 && (
                  <Button
                    type="button"
                    onClick={handleOpenCancellationModal}
                    className="text-xs border-2 px-3 py-1"
                    style={{
                      borderColor: "#D0A096",
                      backgroundColor: "transparent",
                      color: "#D0A096",
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              {loadingTreatments ? (
                <div className="text-sm text-gray-600">
                  Loading treatments...
                </div>
              ) : (
                <div className="space-y-3">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="border-2 p-3"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor:
                          treatment.status === BookingTreatmentStatus.CANCELLED
                            ? "#FAF7F5"
                            : "white",
                        opacity:
                          treatment.status === BookingTreatmentStatus.CANCELLED
                            ? 0.6
                            : 1,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600" />
                        <span
                          className="font-semibold"
                          style={{ color: "#3D3935" }}
                        >
                          {treatment.person_name}
                        </span>
                        {treatment.status ===
                          BookingTreatmentStatus.CANCELLED && (
                          <span
                            className="text-xs px-2 py-1"
                            style={{
                              backgroundColor: "#DCD4CD",
                              color: "#3D3935",
                            }}
                          >
                            Cancelled
                          </span>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: "#3D3935" }}>
                        {treatment.service_name}{" "}
                        {treatment.addOns.length > 0 ? "(" : ""}
                        {treatment.addOns.map((a) => `${a.name} `)}
                        {treatment.addOns.length > 0 ? ")" : ""}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {treatment.duration} minutes • £
                        {(
                          Number(treatment.price) +
                          treatment.addOns.reduce(
                            (sum, a) => sum + Number(a.price),
                            0,
                          )
                        ).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div
            className="border-2 p-4 space-y-3"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h4 className="font-semibold" style={{ color: "#3D3935" }}>
              Customer Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-600" />
                <span style={{ color: "#3D3935" }}>
                  {user?.full_name || "Unknown User"}
                </span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span style={{ color: "#3D3935" }}>{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span style={{ color: "#3D3935" }}>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          <div
            className="border-2 p-4 space-y-3"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h4 className="font-semibold" style={{ color: "#3D3935" }}>
              Appointment Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Service</div>
                {treatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="font-medium"
                    style={{ color: "#3D3935" }}
                  >
                    {treatment?.service_name || "Unknown Service"}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Duration</div>
                <div className="font-medium" style={{ color: "#3D3935" }}>
                  {totalDuration || 60} minutes
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Date</div>
                <div className="font-medium" style={{ color: "#3D3935" }}>
                  {new Date(booking.appointment_date).toLocaleDateString(
                    "en-GB",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Time</div>
                <div className="font-medium" style={{ color: "#3D3935" }}>
                  {booking.appointment_time}
                </div>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div
            className="border-2 p-4 space-y-3"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h4 className="font-semibold" style={{ color: "#3D3935" }}>
              Location
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-600 mt-1" />
                <div>
                  <div style={{ color: "#3D3935" }}>{booking.address}</div>
                  <div className="text-sm text-gray-600">
                    {booking.postcode} • {booking.district}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div
              className="border-2 p-4 space-y-3"
              style={{ borderColor: "#DCD4CD" }}
            >
              <h4 className="font-semibold" style={{ color: "#3D3935" }}>
                Notes
              </h4>
              <p className="text-sm" style={{ color: "#3D3935" }}>
                {booking.notes}
              </p>
            </div>
          )}

          {/* Payment Info */}
          {booking.stripe_payment_intent_id && (
            <div
              className="border-2 p-4 space-y-3"
              style={{ borderColor: "#DCD4CD" }}
            >
              <h4 className="font-semibold" style={{ color: "#3D3935" }}>
                Payment Information
              </h4>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 font-mono">
                  {booking.stripe_payment_intent_id}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="border-2"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "transparent",
              color: "#3D3935",
            }}
          >
            Close
          </Button>
          {canBeCancelled && onReschedule && (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onReschedule();
              }}
              className="border-2"
              style={{
                borderColor: "#3D3935",
                backgroundColor: "#E9CFCA",
                color: "#3D3935",
              }}
            >
              Reschedule
            </Button>
          )}
          {canBeCancelled && (
            <Button
              type="button"
              onClick={handleCancelAllTreatments}
              className="border-2"
              style={{
                borderColor: "#3D3935",
                backgroundColor: "#D0A096",
                color: "#3D3935",
              }}
            >
              Cancel Entire Appointment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Cancellation Modal */}
      <Dialog
        open={isCancellationModalOpen}
        onOpenChange={setIsCancellationModalOpen}
      >
        <DialogContent
          className="max-w-2xl"
          style={{ borderColor: "#DCD4CD", borderWidth: "2px" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#3D3935" }}>
              Select Treatments to Cancel
            </DialogTitle>
            <DialogDescription>
              Choose which treatments you want to cancel. You can select one,
              multiple, or all active treatments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select All Button */}
            <div
              className="flex items-center justify-between border-2 p-3"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FAF7F5",
              }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={
                    selectedTreatmentIds.length ===
                      treatments.filter(
                        (t) => t.status === BookingTreatmentStatus.ACTIVE,
                      ).length && selectedTreatmentIds.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                  style={{ borderColor: "#DCD4CD" }}
                />
                <label
                  htmlFor="select-all"
                  className="font-semibold cursor-pointer"
                  style={{ color: "#3D3935" }}
                >
                  Select All (
                  {
                    treatments.filter(
                      (t) => t.status === BookingTreatmentStatus.ACTIVE,
                    ).length
                  }{" "}
                  active treatments)
                </label>
              </div>
            </div>

            {/* Treatment List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {treatments
                .filter((t) => t.status === BookingTreatmentStatus.ACTIVE)
                .map((treatment) => (
                  <div
                    key={treatment.id}
                    className="flex items-start gap-3 border-2 p-3 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <Checkbox
                      checked={selectedTreatmentIds.includes(treatment.id!)}
                      onCheckedChange={() =>
                        handleToggleTreatment(treatment.id!)
                      }
                      id={`treatment-${treatment.id}`}
                      style={{
                        borderColor: "#DCD4CD",
                        marginTop: "2px",
                      }}
                    />
                    <label
                      htmlFor={`treatment-${treatment.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600" />
                        <span
                          className="font-semibold"
                          style={{ color: "#3D3935" }}
                        >
                          {treatment.person_name}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: "#3D3935" }}>
                        {treatment.service_name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {treatment.duration} minutes • £
                        {treatment.price.toFixed(2)}
                      </div>
                    </label>
                  </div>
                ))}
            </div>

            {/* Selected Count */}
            <div className="text-sm text-gray-600">
              {selectedTreatmentIds.length} treatment
              {selectedTreatmentIds.length !== 1 ? "s" : ""} selected
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              onClick={() => setIsCancellationModalOpen(false)}
              className="border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancellation}
              disabled={selectedTreatmentIds.length === 0}
              className="border-2"
              style={{
                borderColor: "#3D3935",
                backgroundColor:
                  selectedTreatmentIds.length === 0 ? "#DCD4CD" : "#D0A096",
                color: "#3D3935",
                opacity: selectedTreatmentIds.length === 0 ? 0.5 : 1,
                cursor:
                  selectedTreatmentIds.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Workshop Booking Details Dialog Component
function WorkshopBookingDetailsDialog({
  workshopBooking,
  open,
  onOpenChange,
  onCancel,
}: {
  workshopBooking: WorkshopBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
}) {
  const canBeCancelled =
    workshopBooking.booking_status !== WorkshopBookingStatus.CANCELLED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderColor: "#DCD4CD", borderWidth: "2px" }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" style={{ color: "#3D3935" }} />
            <DialogTitle style={{ color: "#3D3935" }}>
              Workshop Booking Details
            </DialogTitle>
          </div>
          <DialogDescription>
            View and manage workshop booking information
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-6 overflow-y-auto pr-2"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {/* Status Badges with Titles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Booking Status</span>
                <div
                  className="px-4 py-2 font-semibold text-sm"
                  style={{
                    backgroundColor:
                      workshopBooking.booking_status ===
                      WorkshopBookingStatus.CANCELLED
                        ? "#DCD4CD"
                        : "#F1DFC0",
                    color: "#3D3935",
                  }}
                >
                  {workshopBooking.booking_status ===
                  WorkshopBookingStatus.CANCELLED
                    ? "Cancelled"
                    : "Confirmed"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Payment Status</span>
                <div
                  className="px-4 py-2 text-sm"
                  style={{
                    backgroundColor: "#EADDD5",
                    color: "#3D3935",
                  }}
                >
                  {
                    WORKSHOP_PAYMENT_STATUS_LABELS[
                      workshopBooking.payment_status
                    ]
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Participant Info */}
          <div
            className="border-2 p-4 space-y-3"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h4 className="font-semibold" style={{ color: "#3D3935" }}>
              Participant Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-600" />
                <span style={{ color: "#3D3935" }}>
                  {workshopBooking.participant_name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <span style={{ color: "#3D3935" }}>
                  {workshopBooking.participant_email}
                </span>
              </div>
              {workshopBooking.participant_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span style={{ color: "#3D3935" }}>
                    {workshopBooking.participant_phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Workshop Session Info */}
          <div
            className="border-2 p-4 space-y-3"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#F1DFC0",
            }}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: "#3D3935" }} />
              <h4 className="font-semibold" style={{ color: "#3D3935" }}>
                Workshop Booking
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              Workshop booking received. Coordination details will be sent via
              WhatsApp.
            </p>
          </div>

          {/* Payment Info */}
          {workshopBooking.payment_intent_id && (
            <div
              className="border-2 p-4 space-y-3"
              style={{ borderColor: "#DCD4CD" }}
            >
              <h4 className="font-semibold" style={{ color: "#3D3935" }}>
                Payment Information
              </h4>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 font-mono">
                  {workshopBooking.payment_intent_id}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="border-2"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "transparent",
              color: "#3D3935",
            }}
          >
            Close
          </Button>
          {canBeCancelled && (
            <Button
              type="button"
              onClick={async () => {
                if (
                  window.confirm(
                    "Are you sure you want to cancel this workshop booking?",
                  )
                ) {
                  await onCancel();
                }
              }}
              className="border-2"
              style={{
                borderColor: "#3D3935",
                backgroundColor: "#D0A096",
                color: "#3D3935",
              }}
            >
              Cancel Workshop Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Day View Component
function DayView({
  date,
  bookings,
  workshopBookings,
  getUserName,
  getServiceName,
  getService,
  onBookingClick,
}: {
  date: Date;
  bookings: Booking[];
  workshopBookings: WorkshopSession[];
  getUserName: (id: string) => string;
  getServiceName: (id: string) => string;
  getService: (id: string) => Service | undefined;
  onBookingClick: (booking: Booking, type: "booking" | "workshop") => void;
}) {
  // Get business hours for this specific date
  const { startHour, endHour } = getBusinessHoursForDate(date);
  const hoursCount = endHour - startHour;

  const timeSlots = Array.from({ length: hoursCount }, (_, i) => {
    const hour = i + startHour;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  // Helper function to calculate end time
  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  };

  // Helper to calculate position and height
  const getBookingStyle = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const offsetHours = hours - startHour; // Use the startHour from business hours
    const offsetMinutes = minutes;

    const topPosition = offsetHours * 80 + (offsetMinutes / 60) * 80;
    const height = (duration / 60) * 80;

    return {
      top: `${topPosition}px`,
      height: `${height - 4}px`,
    };
  };

  const dayDate = `${date.getFullYear()}-${date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1}-${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}`;
  console.log("dayView date ==>", dayDate);
  return (
    <div className="relative">
      {/* Time slots background */}
      {timeSlots.map((time) => (
        <div key={time} className="flex gap-4" style={{ height: "80px" }}>
          <div className="w-20 pt-2 text-right">
            <span className="text-sm font-medium" style={{ color: "#3D3935" }}>
              {time}
            </span>
          </div>
          <div className="flex-1 border-2" style={{ borderColor: "#DCD4CD" }} />
        </div>
      ))}

      {/* Absolute positioned bookings */}
      <div
        className="absolute top-0 left-24 right-0"
        style={{ height: "800px" }}
      >
        {bookings.map((booking) => {
          const service = getService(booking.service_id);
          const duration = service?.duration || 90;
          const endTime = getEndTime(booking.appointment_time, duration);
          const style = getBookingStyle(booking.appointment_time, duration);

          return (
            <Card
              key={booking.id}
              className="absolute left-2 right-2 p-3 border-2 cursor-pointer hover:shadow-md transition-shadow z-10"
              style={{
                ...style,
                borderColor: "#3D3935",
                backgroundColor:
                  booking.status === "cancelled"
                    ? "#DCD4CD"
                    : booking.status === "confirmed"
                      ? "#E9CFCA"
                      : "#F1DFC0",
              }}
              onClick={() => onBookingClick(booking, "booking")}
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: getStatusDotColor(booking.status),
                      }}
                    />
                    <Clock
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: "#3D3935" }}
                    />
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#3D3935" }}
                    >
                      {booking.appointment_time} - {endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <User
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: "#3D3935" }}
                    />
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: "#3D3935" }}
                    >
                      {getUserName(booking.user_id)}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: "#3D3935" }}>
                    {getServiceName(booking.service_id)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-gray-600" />
                    <span className="text-xs text-gray-600 truncate">
                      {booking.district}
                    </span>
                  </div>
                </div>
                <div
                  className="text-xs font-semibold px-2 py-1 flex-shrink-0"
                  style={{
                    backgroundColor: "#FEFCFA",
                    color: "#3D3935",
                  }}
                >
                  £{booking.total_price}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Scheduled workshop sessions */}
        {workshopBookings
          .filter((s) => s.date === dayDate)
          .map((s, i) => {
            const startStr = s.starts_at.split(":").slice(0, 2).join(":");
            const endStr = s.ends_at.split(":").slice(0, 2).join(":");
            const style = getBookingStyle(startStr, 120);
            return (
              <Card
                key={`scheduled-${i}`}
                className="absolute left-2 right-2 p-3 border-2 z-10"
                style={{
                  ...style,
                  borderColor: "#3D3935",
                  backgroundColor: "#F1DFC0",
                  cursor: "pointer",
                }}
                onClick={() => onBookingClick(s, "workshop")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getStatusDotColor(s.status) }}
                  />
                  <GraduationCap
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: "#3D3935" }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#3D3935" }}
                  >
                    {s.starts_at.split(":").slice(0, 2).join(":")}
                    {endStr ? ` - ${endStr}` : ""}
                  </span>
                </div>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "#3D3935" }}
                >
                  {s.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 ml-1">
                    {Array.from({ length: 3 }).map((_, di) => (
                      <span
                        key={di}
                        style={{
                          display: "inline-block",
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          backgroundColor:
                            di < s.people_numbers ? "#3D3935" : "transparent",
                          border: "1px solid #3D3935",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </span>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  date,
  bookings,
  workshopBookings,
  getUserName,
  getServiceName,
  getBookingsForDate,
  onBookingClick,
}: {
  date: Date;
  bookings: Booking[];
  workshopBookings: WorkshopSession[];
  getUserName: (id: string) => string;
  getServiceName: (id: string) => string;
  getBookingsForDate: (date: Date) => WorkshopSession[];
  onBookingClick: (
    session: WorkshopSession,
    type: "booking" | "workshop",
  ) => void;
}) {
  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const weekStart = getWeekStart(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Show 10 AM to 6 PM for weekly view (covering all business hours)
  const timeSlots = Array.from({ length: 8 }, (_, i) => {
    const hour = i + 10;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Day Headers */}
        <div className="flex gap-2 mb-4">
          <div className="w-16"></div>
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={idx}
                className="flex-1 text-center p-2 border-2 h-16 overflow-hidden"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: isToday ? "#E9CFCA" : "transparent",
                }}
              >
                <div className="text-xs text-gray-600 truncate">
                  {day.toLocaleDateString("en-GB", {
                    weekday: "short",
                  })}
                </div>
                <div className="font-semibold truncate" style={{ color: "#3D3935" }}>
                  {day.getDate()}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {(() => {
                    const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                    const wsCount = workshopBookings.filter((s) => s.date === dayDateStr).length;
                    return getBookingsForDate(day).length + wsCount;
                  })()} appts
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="space-y-1">
          {timeSlots.map((time) => (
            <div key={time} className="flex gap-2">
              <div className="w-16 text-right pt-1">
                <span className="text-xs" style={{ color: "#3D3935" }}>
                  {time}
                </span>
              </div>
              {weekDays.map((day, idx) => {
                const dayDate = `${day.getFullYear()}-${day.getMonth() < 9 ? "0" + (day.getMonth() + 1) : day.getMonth() + 1}-${day.getDate() < 10 ? "0" + day.getDate() : day.getDate()}`;
                const dayBookings = bookings.filter((b) => {
                  if (!b.appointment_time) return false;
                  const bookingTime = b.appointment_date;
                  return bookingTime === day.toISOString().split("T")[0];
                });

                const workshopSessions = workshopBookings.filter((s) => {
                  if (!s.date) return false;
                  return s.date === dayDate;
                });

                // Check if this time slot is outside business hours for this day
                const isSunday = day.getDay() === 0;
                const timeHour = parseInt(time.split(":")[0]);
                const isOutsideHours =
                  isSunday && (timeHour < 11 || timeHour >= 17);

                return (
                  <div
                    key={idx}
                    className="flex-1 min-h-[50px] max-h-[60px] border p-1 overflow-hidden"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: isOutsideHours
                        ? "#F5F5F5"
                        : "transparent",
                      opacity: isOutsideHours ? 0.5 : 1,
                    }}
                  >
                    {dayBookings
                      .filter((b) =>
                        b.appointment_time.startsWith(time.split(":")[0]),
                      )
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="text-xs p-1 mb-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                          style={{
                            backgroundColor:
                              booking.status === "cancelled"
                                ? "#DCD4CD"
                                : booking.status === "confirmed"
                                  ? "#E9CFCA"
                                  : "#F1DFC0",
                            borderLeft: "3px solid #3D3935",
                          }}
                          onClick={() => onBookingClick(booking, "booking")}
                          title={`${getUserName(booking.user_id)} - ${getServiceName(booking.service_id)}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: getStatusDotColor(
                                  booking.status,
                                ),
                              }}
                            />
                            <div
                              className="font-semibold truncate"
                              style={{ color: "#3D3935" }}
                            >
                              {booking.appointment_time}
                            </div>
                          </div>
                          <div className="truncate text-gray-600">
                            {getUserName(booking.user_id)}
                          </div>
                          <div className="truncate text-gray-600 flex-row align-middle flex">
                            {new Array(parseInt(booking.people_numbers))
                              .fill(null)
                              .map((_, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: 3,
                                    border: "1px solid #5f5e5e",
                                    margin: "2px",
                                    backgroundColor:
                                      booking.payment_status ===
                                      PaymentStatus.PAID
                                        ? "#5f5e5e"
                                        : "transparent",
                                  }}
                                />
                              ))}
                          </div>
                        </div>
                      ))}
                    {workshopSessions
                      .filter((s) => s.starts_at.startsWith(time.split(":")[0]))
                      .map((s, si) => (
                        <div
                          key={`ws-${si}`}
                          className="text-xs p-1 mb-1 overflow-hidden"
                          style={{
                            backgroundColor: "#F1DFC0",
                            borderLeft: "3px solid #3D3935",
                            cursor: "pointer",
                          }}
                          title={`${s.title} `}
                          onClick={() => onBookingClick(s, "workshop")}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: getStatusDotColor(s.status),
                              }}
                            />
                            <div
                              className="font-semibold truncate"
                              style={{ color: "#3D3935" }}
                            >
                              {s.starts_at.split(":").slice(0, 2).join(":")} -{" "}
                              {s.ends_at.split(":").slice(0, 2).join(":")}
                            </div>
                          </div>
                          <div
                            className="truncate"
                            style={{ color: "#6b7280" }}
                          >
                            {s.title}
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({
                              length: 3,
                            }).map((_, di) => (
                              <span
                                key={di}
                                style={{
                                  display: "inline-block",
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    di < s.people_numbers
                                      ? "#3D3935"
                                      : "transparent",
                                  border: "1px solid #3D3935",
                                  flexShrink: 0,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Month View Component
function MonthView({
  date,
  getBookingsCount,
}: {
  date: Date;
  getBookingsCount: (date: Date) => number;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Adjust start day (Monday = 0)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center p-2 font-semibold text-sm"
            style={{ color: "#3D3935" }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const bookingsCount = getBookingsCount(day.date);

          return (
            <div
              key={idx}
              className="h-24 border-2 p-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: isToday
                  ? "#E9CFCA"
                  : day.isCurrentMonth
                    ? "white"
                    : "#FAF7F5",
                opacity: day.isCurrentMonth ? 1 : 0.5,
              }}
            >
              <div className="text-right">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  {day.date.getDate()}
                </span>
              </div>
              {bookingsCount > 0 && (
                <div className="mt-1">
                  <div
                    className="text-xs px-2 py-1 text-center truncate"
                    style={{
                      backgroundColor: "#3D3935",
                      color: "white",
                    }}
                  >
                    {bookingsCount} {bookingsCount === 1 ? "appt" : "appts"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
