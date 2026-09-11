import { useState, useEffect } from "react";
import { AdminPagination } from "../../components/admin/AdminPagination";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Eye,
  X,
  FileText,
  Plus,
  PenLine,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  getAllUsers,
  updateUser,
  deleteUser as dbDeleteUser,
  addUserNote,
  updateUserNote,
  deleteUserNote,
} from "../../lib/db/users";
import { adminCreateUser } from "../../lib/db/admin-create-user";
import {
  User,
  UserRole,
  Note,
  USER_ROLE_LABELS,
  ASSIGNABLE_USER_ROLES,
} from "../../schema/user.schema";
import {
  Booking,
  BookingStatus,
  BOOKING_STATUS_LABELS,
  PaymentStatus,
} from "../../schema/booking.schema";
import {
  WORKSHOP_BOOKING_STATUS_LABELS,
  WORKSHOP_PAYMENT_STATUS_LABELS,
  WorkshopBookingStatus,
  WorkshopPaymentStatus,
} from "../../schema/workshop-booking.schema";

type UserWorkshop = {
  id?: string;
  workshop_id?: string;
  preferred_month?: string;
  participant_name?: string;
  participant_phone?: string;
  participant_email?: string;
  status?: string;
  payment_status?: string;
  notes?: string;
  scheduled_date?: string | null;
  created_at?: string;
  workshops?: { title?: string; price?: number } | null;
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PaymentStatus.UNPAID]: "Unpaid",
  [PaymentStatus.PARTIALL_PAID]: "Partially Paid",
  [PaymentStatus.PARTIALL_REFUNDED]: "Partially Refunded",
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.REFUNDED]: "Refunded",
};

const getBookingStatusStyle = (status: string) => {
  if (
    status === BookingStatus.CANCELLED ||
    status === BookingStatus.NO_SHOW
  ) {
    return { backgroundColor: "#DCD4CD", color: "#3D3935" };
  }
  if (
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  ) {
    return { backgroundColor: "#E9CFCA", color: "#3D3935" };
  }
  return { backgroundColor: "#F1DFC0", color: "#3D3935" };
};

const getPaymentStatusStyle = (status: string) => {
  if (
    status === PaymentStatus.PAID ||
    status === WorkshopPaymentStatus.PAID
  ) {
    return { backgroundColor: "#E9CFCA", color: "#3D3935" };
  }
  if (
    status === PaymentStatus.UNPAID ||
    status === WorkshopPaymentStatus.PENDING
  ) {
    return { backgroundColor: "#F1DFC0", color: "#3D3935" };
  }
  if (
    status === PaymentStatus.REFUNDED ||
    status === WorkshopPaymentStatus.REFUNDED
  ) {
    return { backgroundColor: "#EADDD5", color: "#3D3935" };
  }
  return { backgroundColor: "#DCD4CD", color: "#3D3935" };
};

type TreatmentAddon = {
  id?: string;
  name: string;
  price: number;
  duration?: number;
};

type EnrichedTreatment = {
  id?: string;
  service_name: string;
  person_name: string;
  price: number;
  duration: number;
  status: string;
  addOns: TreatmentAddon[];
};

type EnrichedBooking = {
  booking: Booking & { id: string };
  treatments: EnrichedTreatment[];
};

type WorkshopSession = {
  id?: string;
  date: string;
  status?: string;
  workshop_id?: string;
};

type EnrichedWorkshop = {
  booking: UserWorkshop;
  sessions: WorkshopSession[];
};

type UserHistoryData = {
  bookings: EnrichedBooking[];
  workshops: EnrichedWorkshop[];
};

const formatMoney = (amount?: number | null) =>
  `£${Number(amount ?? 0).toFixed(2)}`;

const formatDateLabel = (dateValue?: string | Date | null) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<
    string | null
  >(null);
  const [bookingsUser, setBookingsUser] = useState<User | null>(
    null,
  );
  const [workshopsUser, setWorkshopsUser] =
    useState<User | null>(null);
  const [notesUser, setNotesUser] = useState<User | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<
    string | null
  >(null);
  const [editingNoteContent, setEditingNoteContent] =
    useState("");
  const [showAddUserModal, setShowAddUserModal] =
    useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [filterWorkshopUsers, setFilterWorkshopUsers] =
    useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(
    null,
  );
  const [newUserData, setNewUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    houseNumber: "",
    street: "",
    postal_code: "",
    district: "",
    role: UserRole.CLIENT as (typeof ASSIGNABLE_USER_ROLES)[number],
  });
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<
    string | null
  >(null);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  const [expandedUserId, setExpandedUserId] = useState<
    string | null
  >(null);
  const [historyTab, setHistoryTab] = useState<
    Record<string, "treatments" | "workshops">
  >({});
  const [historyCache, setHistoryCache] = useState<
    Record<string, UserHistoryData>
  >({});
  const [historyLoading, setHistoryLoading] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setDbError(null);
        const { data: fetchedUsers, totalCount: count } =
          await getAllUsers({
            page: currentPage,
            limit: PAGE_SIZE,
          });
        console.log("fetchedUsers", fetchedUsers);
        setUsers(fetchedUsers ?? []);
        setTotalCount(count ?? 0);
      } catch (error) {
        // Silently handle - error already logged by dbLogger
        setDbError(
          "Unable to connect to database. Please check your Supabase configuration.",
        );
        // Keep users as empty array if database is not available
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWorkshopUsers]);

  const handleCloseAddUserModal = () => {
    if (isAddingUser) return;
    setShowAddUserModal(false);
    // Reset form data when modal is closed
    setNewUserData({
      fullName: "",
      email: "",
      phone: "",
      houseNumber: "",
      street: "",
      postal_code: "",
      district: "",
      role: UserRole.CLIENT,
    });
  };

  const handleChangeUserRole = async (
    user: User,
    nextRole: (typeof ASSIGNABLE_USER_ROLES)[number],
  ) => {
    if (!user.id || user.role === nextRole) return;
    if (user.role === UserRole.ADMIN) return;

    try {
      setUpdatingRoleUserId(user.id);
      const updated = await updateUser({
        id: user.id,
        role: nextRole,
      });
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === updated.id
            ? { ...u, role: updated.role }
            : u,
        ),
      );
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Failed to update user role. Please try again.");
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleAddNote = async () => {
    if (!notesUser || !newNoteContent.trim()) return;

    try {
      const newNote = await addUserNote(
        notesUser.id!,
        newNoteContent,
      );

      // Optimistically update users array and notesUser state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === notesUser.id
            ? {
                ...user,
                notes: [...(user.notes ?? []), newNote],
              }
            : user,
        ),
      );

      setNotesUser((prev) =>
        prev
          ? { ...prev, notes: [...(prev.notes ?? []), newNote] }
          : null,
      );

      // Clear the input
      setNewNoteContent("");
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!notesUser || !editingNoteContent.trim()) return;

    try {
      const updatedNote = await updateUserNote(
        noteId,
        editingNoteContent,
      );

      const replaceNote = (notes: Note[]) =>
        notes.map((n) => (n.id === noteId ? updatedNote : n));

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === notesUser.id
            ? { ...user, notes: replaceNote(user.notes ?? []) }
            : user,
        ),
      );

      setNotesUser((prev) =>
        prev
          ? { ...prev, notes: replaceNote(prev.notes ?? []) }
          : null,
      );

      setEditingNoteId(null);
      setEditingNoteContent("");
    } catch (error) {
      console.error("Failed to update note:", error);
      alert("Failed to update note. Please try again.");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!notesUser) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteUserNote(noteId);

      const filterNote = (notes: Note[]) =>
        notes.filter((n) => n.id !== noteId);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === notesUser.id
            ? { ...user, notes: filterNote(user.notes ?? []) }
            : user,
        ),
      );

      setNotesUser((prev) =>
        prev
          ? { ...prev, notes: filterNote(prev.notes ?? []) }
          : null,
      );
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleAddUser = async () => {
    if (isAddingUser) return;
    if (
      !newUserData.fullName.trim() ||
      !newUserData.email.trim() ||
      !newUserData.phone.trim()
    )
      return;

    // Check if user already exists by email
    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() ===
        newUserData.email.toLowerCase(),
    );

    if (emailExists) {
      alert("A user with this email already exists.");
      return;
    }

    const fullAddress =
      `${newUserData.houseNumber} ${newUserData.street}`.trim();
    const normalizedPostalCode = newUserData.postal_code
      .trim()
      .toUpperCase();

    if (
      normalizedPostalCode &&
      !/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/.test(
        normalizedPostalCode,
      )
    ) {
      alert("Invalid postcode format (e.g. SW1A 1AA).");
      return;
    }

    setIsAddingUser(true);
    try {
      const createdUser = await adminCreateUser({
        full_name: newUserData.fullName,
        email: newUserData.email,
        phone: newUserData.phone,
        address: fullAddress,
        postal_code: normalizedPostalCode || undefined,
        district: newUserData.district,
        role: newUserData.role,
      });

      // Add the new user to the state
      setUsers((prevUsers) => [createdUser, ...prevUsers]);

      // Close the modal
      setIsAddingUser(false);
      handleCloseAddUserModal();
    } catch (error) {
      console.error("Failed to create user:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to create user. Please try again.";
      alert(message);
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete the user from the database first
      await dbDeleteUser(userToDelete.id);

      // Remove the user from the users array after successful deletion
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id),
      );

      // Close the modal
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
      // Keep the modal open on error
    }
  };

  const fetchUserHistory = async (user: User) => {
    const userId = user.id!;
    if (historyCache[userId] || historyLoading[userId]) return;
    setHistoryLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const enrichedBookings: EnrichedBooking[] =
        await Promise.all(
          (user.bookings ?? []).map(async (booking) => {
            const { data } = await supabase
              .from("booking_treatments")
              .select("*, addOns:booking_treatment_addons(*)")
              .eq("booking_id", booking.id!)
              .order("created_at", { ascending: true });
            return {
              booking,
              treatments: (data ?? []) as EnrichedTreatment[],
            };
          }),
        );

      const enrichedWorkshops: EnrichedWorkshop[] =
        await Promise.all(
          ((user.workshops as UserWorkshop[]) ?? []).map(
            async (wb) => {
              if (!wb.workshop_id)
                return { booking: wb, sessions: [] };
              const { data } = await supabase
                .from("workshop_sessions")
                .select("*")
                .eq("workshop_id", wb.workshop_id)
                .order("date", { ascending: true });
              return {
                booking: wb,
                sessions: (data ?? []) as WorkshopSession[],
              };
            },
          ),
        );

      setHistoryCache((prev) => ({
        ...prev,
        [userId]: {
          bookings: enrichedBookings,
          workshops: enrichedWorkshops,
        },
      }));
    } catch (err) {
      console.error("Failed to fetch user history:", err);
      setHistoryCache((prev) => ({
        ...prev,
        [userId]: { bookings: [], workshops: [] },
      }));
    } finally {
      setHistoryLoading((prev) => ({
        ...prev,
        [userId]: false,
      }));
    }
  };

  const toggleHistory = (user: User) => {
    const userId = user.id!;
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      if (!historyTab[userId]) {
        setHistoryTab((prev) => ({
          ...prev,
          [userId]: "treatments",
        }));
      }
      fetchUserHistory(user);
    }
  };

  // Helper function to parse date strings like "Feb 14, 2026"
  const parseAppointmentDate = (
    dateStr: string,
  ): Date | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  };

  // Filter users based on search term and workshop filter
  const filteredUsers = (users ?? []).filter((user) => {
    const searchLower = searchTerm.toLowerCase().trim();

    // Check search term match
    let matchesSearch = true;
    if (searchLower) {
      // Remove all non-alphanumeric characters for phone comparison
      const searchClean = searchLower.replace(
        /[^a-z0-9@.]/g,
        "",
      );
      const phoneClean = (user.phone || "").replace(
        /[^0-9]/g,
        "",
      );
      const emailClean = user.email
        .toLowerCase()
        .replace(/\s/g, "");

      matchesSearch =
        (user.full_name || "")
          .toLowerCase()
          .includes(searchLower) ||
        emailClean.includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        phoneClean.includes(searchClean) ||
        (user.phone || "").includes(searchLower);
    }

    return matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">Users</h1>
          <p className="text-gray-600">
            Manage your customer database
          </p>
        </div>
        <Button
          className="flex items-center gap-2 border-2"
          style={{
            backgroundColor: "#E9CFCA",
            borderColor: "#3D3935",
            color: "#3D3935",
          }}
          onClick={() => setShowAddUserModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card
        className="p-4 mb-6 border-2"
        style={{ borderColor: "#DCD4CD" }}
      >
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterWorkshopUsers}
                  onChange={(e) =>
                    setFilterWorkshopUsers(e.target.checked)
                  }
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: "#E9CFCA" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Show Workshops
                </span>
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div
            className="flex items-center gap-4 pt-3 border-t"
            style={{ borderColor: "#DCD4CD" }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "#3D3935" }}
            >
              Last Appointment:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">
                From:
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 border-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  backgroundColor: "#FEFCFA",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">
                To:
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 border-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  backgroundColor: "#FEFCFA",
                }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-sm px-3 py-1.5 border-2 transition-colors hover:bg-gray-100"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  backgroundColor: "transparent",
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card
        className="border-2 overflow-hidden"
        style={{ borderColor: "#DCD4CD" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#FAF7F5" }}>
              <tr
                className="border-b-2"
                style={{ borderColor: "#DCD4CD" }}
              >
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Name
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Role
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Contact
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Address
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Appointments
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Workshops
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Joined
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Last Appointment
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Actions
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isExpanded = expandedUserId === user.id;
                const activeTab =
                  historyTab[user.id!] ?? "treatments";
                const history = historyCache[user.id!];
                const isHistoryLoading =
                  historyLoading[user.id!];

                return (
                  <>
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      <td className="p-4">
                        <p
                          className="font-semibold"
                          style={{ color: "#3D3935" }}
                        >
                          {user.full_name}
                        </p>
                      </td>
                      <td className="p-4">
                        {user.role === UserRole.ADMIN ? (
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {USER_ROLE_LABELS[UserRole.ADMIN]}
                          </span>
                        ) : (
                          <select
                            value={
                              user.role === UserRole.ARTIST
                                ? UserRole.ARTIST
                                : UserRole.CLIENT
                            }
                            disabled={
                              updatingRoleUserId === user.id
                            }
                            onChange={(e) =>
                              handleChangeUserRole(
                                user,
                                e.target
                                  .value as (typeof ASSIGNABLE_USER_ROLES)[number],
                              )
                            }
                            className="p-2 border-2 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-60"
                            style={{
                              borderColor: "#DCD4CD",
                              color: "#3D3935",
                              backgroundColor: "#FEFCFA",
                            }}
                            aria-label={`Role for ${user.full_name}`}
                          >
                            {ASSIGNABLE_USER_ROLES.map(
                              (role) => (
                                <option key={role} value={role}>
                                  {USER_ROLE_LABELS[role]}
                                </option>
                              ),
                            )}
                          </select>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {user.phone || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Auth:{" "}
                            {user.auth_id
                              ? "Linked"
                              : "Not linked"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-500 text-sm">
                          {user?.address || "-"}
                        </span>
                      </td>
                      <td
                        className="p-0 cursor-pointer"
                        onClick={() => setBookingsUser(user)}
                      >
                        <div className="w-full h-full p-4">
                          {(user.bookings?.length ?? 0) > 0 ? (
                            <span
                              className="text-sm font-semibold underline transition-colors hover:opacity-70"
                              style={{ color: "#3D3935" }}
                            >
                              {user.bookings?.length > 0
                                ? user.bookings.length
                                : "-"}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              0
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="p-0 cursor-pointer"
                        onClick={() => setWorkshopsUser(user)}
                      >
                        <div className="w-full h-full p-4">
                          {(user.workshops?.length ?? 0) > 0 ? (
                            <span
                              className="text-sm font-semibold underline transition-colors hover:opacity-70"
                              style={{ color: "#3D3935" }}
                            >
                              {user.workshops?.length > 0
                                ? user.workshops.length
                                : "-"}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              0
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(
                          user.created_at || "",
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-gray-600">-</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleHistory(user)}
                            className="flex items-center justify-center w-8 h-8 border-2 transition-colors hover:bg-[#FCEAE0]"
                            style={{
                              borderColor: isExpanded
                                ? "#3D3935"
                                : "#DCD4CD",
                              color: isExpanded
                                ? "#3D3935"
                                : "#A09080",
                              backgroundColor: isExpanded
                                ? "#FCEAE0"
                                : "transparent",
                            }}
                            title="View History"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <History className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setUserToDelete(user)
                            }
                            className="flex items-center justify-center w-8 h-8 border-2 transition-colors hover:bg-red-50"
                            style={{
                              borderColor: "#D0A096",
                              color: "#D0A096",
                              backgroundColor: "transparent",
                            }}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td
                        className="p-0 cursor-pointer"
                        onClick={() => setNotesUser(user)}
                      >
                        <div className="w-full h-full p-4">
                          {user.notes &&
                          user.notes.length > 0 ? (
                            <span
                              className="text-sm underline transition-colors hover:opacity-70"
                              style={{ color: "#3D3935" }}
                            >
                              View
                            </span>
                          ) : (
                            <PenLine className="w-4 h-4 text-gray-400 hover:text-[#3D3935] transition-colors" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable history row */}
                    {isExpanded && (
                      <tr
                        key={`${user.id}-history`}
                        style={{ backgroundColor: "#FAF7F5" }}
                      >
                        <td colSpan={10} className="p-0">
                          <div
                            className="border-b-2"
                            style={{ borderColor: "#DCD4CD" }}
                          >
                            {/* Tab strip */}
                            <div
                              className="flex items-center gap-0 border-b"
                              style={{ borderColor: "#DCD4CD" }}
                            >
                              <button
                                onClick={() =>
                                  setHistoryTab((prev) => ({
                                    ...prev,
                                    [user.id!]: "treatments",
                                  }))
                                }
                                className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                                style={{
                                  borderColor:
                                    activeTab === "treatments"
                                      ? "#3D3935"
                                      : "transparent",
                                  color:
                                    activeTab === "treatments"
                                      ? "#3D3935"
                                      : "#9CA3AF",
                                  backgroundColor:
                                    "transparent",
                                }}
                              >
                                Treatments &amp; Appointments
                                {history && (
                                  <span
                                    className="ml-2 px-1.5 py-0.5 text-xs rounded-full"
                                    style={{
                                      backgroundColor:
                                        "#E9CFCA",
                                      color: "#3D3935",
                                    }}
                                  >
                                    {history.bookings.length}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  setHistoryTab((prev) => ({
                                    ...prev,
                                    [user.id!]: "workshops",
                                  }))
                                }
                                className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                                style={{
                                  borderColor:
                                    activeTab === "workshops"
                                      ? "#3D3935"
                                      : "transparent",
                                  color:
                                    activeTab === "workshops"
                                      ? "#3D3935"
                                      : "#9CA3AF",
                                  backgroundColor:
                                    "transparent",
                                }}
                              >
                                Workshops &amp; Classes
                                {history && (
                                  <span
                                    className="ml-2 px-1.5 py-0.5 text-xs rounded-full"
                                    style={{
                                      backgroundColor:
                                        "#DCD4CD",
                                      color: "#3D3935",
                                    }}
                                  >
                                    {history.workshops.length}
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Content area */}
                            <div className="p-5">
                              {isHistoryLoading ? (
                                <div className="space-y-3">
                                  {[1, 2].map((n) => (
                                    <div
                                      key={n}
                                      className="h-20 rounded animate-pulse"
                                      style={{
                                        backgroundColor:
                                          "#EDE8E3",
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : !history ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                  Failed to load history. Try
                                  collapsing and expanding
                                  again.
                                </p>
                              ) : activeTab === "treatments" ? (
                                /* ── Treatments tab ── */
                                <div className="space-y-4">
                                  {history.bookings.length ===
                                  0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                      No appointment history
                                    </p>
                                  ) : (
                                    [...history.bookings]
                                      .sort(
                                        (a, b) =>
                                          new Date(
                                            b.booking
                                              .appointment_date as string,
                                          ).getTime() -
                                          new Date(
                                            a.booking
                                              .appointment_date as string,
                                          ).getTime(),
                                      )
                                      .map(
                                        ({
                                          booking,
                                          treatments,
                                        }) => (
                                          <div
                                            key={booking.id}
                                            className="border-2 rounded-sm overflow-hidden"
                                            style={{
                                              borderColor:
                                                "#DCD4CD",
                                            }}
                                          >
                                            {/* Booking header */}
                                            <div
                                              className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
                                              style={{
                                                backgroundColor:
                                                  "#FEFCFA",
                                                borderColor:
                                                  "#DCD4CD",
                                              }}
                                            >
                                              <span
                                                className="text-sm font-semibold"
                                                style={{
                                                  color:
                                                    "#3D3935",
                                                }}
                                              >
                                                {formatDateLabel(
                                                  booking.appointment_date,
                                                )}
                                              </span>
                                              <span className="text-sm text-gray-500">
                                                {
                                                  booking.appointment_time
                                                }
                                              </span>
                                              <span
                                                className="px-2 py-0.5 text-xs font-semibold"
                                                style={getBookingStatusStyle(
                                                  booking.status,
                                                )}
                                              >
                                                {BOOKING_STATUS_LABELS[
                                                  booking.status as BookingStatus
                                                ] ||
                                                  booking.status}
                                              </span>
                                              <span
                                                className="px-2 py-0.5 text-xs font-semibold"
                                                style={getPaymentStatusStyle(
                                                  booking.payment_status,
                                                )}
                                              >
                                                {PAYMENT_STATUS_LABELS[
                                                  booking
                                                    .payment_status
                                                ] ||
                                                  booking.payment_status}
                                              </span>
                                              <span
                                                className="ml-auto text-sm font-bold"
                                                style={{
                                                  color:
                                                    "#3D3935",
                                                }}
                                              >
                                                {formatMoney(
                                                  booking.total_amount,
                                                )}
                                              </span>
                                            </div>

                                            {/* Staff row */}
                                            <div
                                              className="px-4 py-2 text-xs flex items-center gap-2 border-b"
                                              style={{
                                                borderColor:
                                                  "#DCD4CD",
                                                backgroundColor:
                                                  "#FAF7F5",
                                                color:
                                                  "#9CA3AF",
                                              }}
                                            >
                                              <span className="font-medium">
                                                Nail Artist:
                                              </span>
                                              <span>
                                                Not assigned
                                              </span>
                                            </div>

                                            {/* Treatments */}
                                            <div
                                              className="divide-y"
                                              style={{
                                                borderColor:
                                                  "#DCD4CD",
                                              }}
                                            >
                                              {treatments.length ===
                                              0 ? (
                                                <p className="px-4 py-3 text-xs text-gray-400">
                                                  No treatment
                                                  breakdown
                                                  recorded
                                                </p>
                                              ) : (
                                                treatments.map(
                                                  (t, ti) => (
                                                    <div
                                                      key={
                                                        t.id ??
                                                        ti
                                                      }
                                                      className="px-4 py-3"
                                                    >
                                                      <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                          <p
                                                            className="text-sm font-medium"
                                                            style={{
                                                              color:
                                                                "#3D3935",
                                                            }}
                                                          >
                                                            {
                                                              t.service_name
                                                            }
                                                          </p>
                                                          <p className="text-xs text-gray-500 mt-0.5">
                                                            {
                                                              t.person_name
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                              t.duration
                                                            }{" "}
                                                            min
                                                          </p>
                                                        </div>
                                                        <span
                                                          className="text-sm font-semibold shrink-0"
                                                          style={{
                                                            color:
                                                              "#3D3935",
                                                          }}
                                                        >
                                                          {formatMoney(
                                                            t.price,
                                                          )}
                                                        </span>
                                                      </div>
                                                      {t.addOns &&
                                                        t.addOns
                                                          .length >
                                                          0 && (
                                                          <div
                                                            className="mt-2 pl-3 border-l-2 space-y-1"
                                                            style={{
                                                              borderColor:
                                                                "#E9CFCA",
                                                            }}
                                                          >
                                                            {t.addOns.map(
                                                              (
                                                                addon,
                                                                ai,
                                                              ) => (
                                                                <div
                                                                  key={
                                                                    addon.id ??
                                                                    ai
                                                                  }
                                                                  className="flex items-center justify-between text-xs text-gray-500"
                                                                >
                                                                  <span>
                                                                    +{" "}
                                                                    {
                                                                      addon.name
                                                                    }
                                                                  </span>
                                                                  <span>
                                                                    {formatMoney(
                                                                      addon.price,
                                                                    )}
                                                                  </span>
                                                                </div>
                                                              ),
                                                            )}
                                                          </div>
                                                        )}
                                                    </div>
                                                  ),
                                                )
                                              )}
                                            </div>

                                            {/* Notes */}
                                            {booking.notes && (
                                              <div
                                                className="px-4 py-2 border-t text-xs"
                                                style={{
                                                  borderColor:
                                                    "#DCD4CD",
                                                  backgroundColor:
                                                    "#FAF7F5",
                                                }}
                                              >
                                                <span className="text-gray-400 font-medium">
                                                  Customer
                                                  note:{" "}
                                                </span>
                                                <span
                                                  style={{
                                                    color:
                                                      "#3D3935",
                                                  }}
                                                >
                                                  {
                                                    booking.notes
                                                  }
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ),
                                      )
                                  )}
                                </div>
                              ) : (
                                /* ── Workshops tab ── */
                                <div className="space-y-4">
                                  {history.workshops.length ===
                                  0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                      No workshop history
                                    </p>
                                  ) : (
                                    [...history.workshops]
                                      .sort(
                                        (a, b) =>
                                          new Date(
                                            b.booking
                                              .created_at || 0,
                                          ).getTime() -
                                          new Date(
                                            a.booking
                                              .created_at || 0,
                                          ).getTime(),
                                      )
                                      .map(
                                        (
                                          {
                                            booking: wb,
                                            sessions,
                                          },
                                          wi,
                                        ) => {
                                          const today =
                                            new Date();
                                          today.setHours(
                                            0,
                                            0,
                                            0,
                                            0,
                                          );
                                          const doneSessions =
                                            sessions.filter(
                                              (s) =>
                                                new Date(
                                                  s.date,
                                                ) < today,
                                            );
                                          const title =
                                            wb.workshops
                                              ?.title ||
                                            "Workshop booking";

                                          return (
                                            <div
                                              key={wb.id ?? wi}
                                              className="border-2 rounded-sm overflow-hidden"
                                              style={{
                                                borderColor:
                                                  "#DCD4CD",
                                              }}
                                            >
                                              {/* Workshop header */}
                                              <div
                                                className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
                                                style={{
                                                  backgroundColor:
                                                    "#FEFCFA",
                                                  borderColor:
                                                    "#DCD4CD",
                                                }}
                                              >
                                                <span
                                                  className="text-sm font-semibold"
                                                  style={{
                                                    color:
                                                      "#3D3935",
                                                  }}
                                                >
                                                  {title}
                                                </span>
                                                {sessions.length >
                                                  0 && (
                                                  <span
                                                    className="text-xs px-2 py-0.5 font-medium"
                                                    style={{
                                                      backgroundColor:
                                                        "#E9CFCA",
                                                      color:
                                                        "#3D3935",
                                                    }}
                                                  >
                                                    {
                                                      doneSessions.length
                                                    }{" "}
                                                    of{" "}
                                                    {
                                                      sessions.length
                                                    }{" "}
                                                    sessions
                                                    done
                                                  </span>
                                                )}
                                                {wb.status && (
                                                  <span
                                                    className="px-2 py-0.5 text-xs font-semibold"
                                                    style={getBookingStatusStyle(
                                                      wb.status,
                                                    )}
                                                  >
                                                    {WORKSHOP_BOOKING_STATUS_LABELS[
                                                      wb.status as WorkshopBookingStatus
                                                    ] ||
                                                      wb.status}
                                                  </span>
                                                )}
                                                {wb.payment_status && (
                                                  <span
                                                    className="px-2 py-0.5 text-xs font-semibold"
                                                    style={getPaymentStatusStyle(
                                                      wb.payment_status,
                                                    )}
                                                  >
                                                    {WORKSHOP_PAYMENT_STATUS_LABELS[
                                                      wb.payment_status as WorkshopPaymentStatus
                                                    ] ||
                                                      wb.payment_status}
                                                  </span>
                                                )}
                                                {wb.workshops
                                                  ?.price !=
                                                  null && (
                                                  <span
                                                    className="ml-auto text-sm font-bold"
                                                    style={{
                                                      color:
                                                        "#3D3935",
                                                    }}
                                                  >
                                                    {formatMoney(
                                                      wb
                                                        .workshops
                                                        .price,
                                                    )}
                                                  </span>
                                                )}
                                              </div>

                                              {/* Session progress */}
                                              {sessions.length >
                                              0 ? (
                                                <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                  {sessions.map(
                                                    (
                                                      session,
                                                      si,
                                                    ) => {
                                                      const sessionDate =
                                                        new Date(
                                                          session.date,
                                                        );
                                                      const isPast =
                                                        sessionDate <
                                                        today;
                                                      return (
                                                        <div
                                                          key={
                                                            session.id ??
                                                            si
                                                          }
                                                          className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs"
                                                          style={{
                                                            backgroundColor:
                                                              isPast
                                                                ? "#E9CFCA"
                                                                : "#FAF7F5",
                                                            border: `1px solid ${isPast ? "#D0A096" : "#DCD4CD"}`,
                                                          }}
                                                        >
                                                          <span
                                                            className="font-semibold"
                                                            style={{
                                                              color:
                                                                isPast
                                                                  ? "#3D3935"
                                                                  : "#9CA3AF",
                                                            }}
                                                          >
                                                            S
                                                            {si +
                                                              1}
                                                          </span>
                                                          <div>
                                                            <p
                                                              className="font-medium"
                                                              style={{
                                                                color:
                                                                  isPast
                                                                    ? "#3D3935"
                                                                    : "#6B7280",
                                                              }}
                                                            >
                                                              {sessionDate.toLocaleDateString(
                                                                "en-GB",
                                                                {
                                                                  day: "numeric",
                                                                  month:
                                                                    "short",
                                                                },
                                                              )}
                                                            </p>
                                                            <p
                                                              style={{
                                                                color:
                                                                  isPast
                                                                    ? "#5C4D48"
                                                                    : "#9CA3AF",
                                                              }}
                                                            >
                                                              {isPast
                                                                ? "Done"
                                                                : "Upcoming"}
                                                            </p>
                                                          </div>
                                                        </div>
                                                      );
                                                    },
                                                  )}
                                                </div>
                                              ) : (
                                                <p className="px-4 py-3 text-xs text-gray-400">
                                                  No sessions
                                                  scheduled yet
                                                </p>
                                              )}

                                              {/* Notes */}
                                              {wb.notes && (
                                                <div
                                                  className="px-4 py-2 border-t text-xs"
                                                  style={{
                                                    borderColor:
                                                      "#DCD4CD",
                                                    backgroundColor:
                                                      "#FAF7F5",
                                                  }}
                                                >
                                                  <span className="text-gray-400 font-medium">
                                                    Note:{" "}
                                                  </span>
                                                  <span
                                                    style={{
                                                      color:
                                                        "#3D3935",
                                                    }}
                                                  >
                                                    {wb.notes}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        },
                                      )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </Card>

      {/* Address Modal */}
      {selectedAddress &&
        (() => {
          // Parse the address into components like in booking flow
          // Format: "123 Oxford Street, London, W1D 2HG"
          const addressParts = selectedAddress
            .split(",")
            .map((part) => part.trim());
          let houseNumber = "";
          let street = "";
          let district = "";

          if (addressParts?.length >= 2) {
            // Parse first part for house number and street
            const streetPart = addressParts[0]; // "123 Oxford Street"
            const match = streetPart.match(/^(\d+)\s+(.+)$/);
            if (match) {
              houseNumber = match[1]; // "123"
              street = match[2]; // "Oxford Street"
            } else {
              street = streetPart;
            }

            // Second part is the district
            district = addressParts[1]; // "London"
          }

          return (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setSelectedAddress(null)}
              />

              {/* Modal */}
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <Card
                  className="p-8 border-2"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      className="font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      User Address
                    </h2>
                    <button
                      onClick={() => setSelectedAddress(null)}
                      className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                      style={{
                        borderColor: "#DCD4CD",
                        color: "#3D3935",
                        backgroundColor: "transparent",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Address Line 1 - House Number and Street */}
                    <div>
                      <label
                        className="block text-sm mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Address Line 1
                      </label>
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#FAF7F5",
                          borderColor: "#DCD4CD",
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: "#3D3935" }}
                        >
                          {houseNumber && `${houseNumber} `}
                          {street || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Address Line 2 - District */}
                    <div>
                      <label
                        className="block text-sm mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Address Line 2 (District)
                      </label>
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#FAF7F5",
                          borderColor: "#DCD4CD",
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: "#3D3935" }}
                        >
                          {district || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          );
        })()}

      {/* Bookings Modal */}
      {bookingsUser && (
        <>
          <div
            style={{ backgroundColor: "#000000d9" }}
            className="fixed inset-0 z-40"
            onClick={() => setBookingsUser(null)}
          />

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card
              className="p-8 border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Bookings - {bookingsUser.full_name} (
                  {bookingsUser.bookings?.length ?? 0})
                </h2>
                <button
                  onClick={() => setBookingsUser(null)}
                  className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {[...(bookingsUser.bookings ?? [])]
                  .sort(
                    (a, b) =>
                      new Date(
                        b.appointment_date as string,
                      ).getTime() -
                      new Date(
                        a.appointment_date as string,
                      ).getTime(),
                  )
                  .map((booking: Booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border-2"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span
                          className="px-3 py-1 text-sm font-semibold"
                          style={getBookingStatusStyle(
                            booking.status,
                          )}
                        >
                          {BOOKING_STATUS_LABELS[
                            booking.status as BookingStatus
                          ] || booking.status}
                        </span>
                        <span
                          className="px-3 py-1 text-sm font-semibold"
                          style={getPaymentStatusStyle(
                            booking.payment_status,
                          )}
                        >
                          {PAYMENT_STATUS_LABELS[
                            booking.payment_status
                          ] || booking.payment_status}
                        </span>
                        <span
                          className="ml-auto text-lg font-bold"
                          style={{ color: "#3D3935" }}
                        >
                          {formatMoney(booking.total_amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Date
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {formatDateLabel(
                              booking.appointment_date,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Time
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {booking.appointment_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            People
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {booking.people_numbers}{" "}
                            {booking.people_numbers === 1
                              ? "Person"
                              : "People"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            District
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {booking.district || "-"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">
                            Address
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {booking.address || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Subtotal
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {formatMoney(
                              booking.subtotal_amount,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Discount
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            {formatMoney(
                              booking.discount_amount,
                            )}
                          </p>
                        </div>
                      </div>

                      {(booking.promo_code_code ||
                        booking.notes) && (
                        <div
                          className="mt-3 pt-3 border-t space-y-2"
                          style={{ borderColor: "#DCD4CD" }}
                        >
                          {booking.promo_code_code && (
                            <p className="text-sm">
                              <span className="text-gray-500">
                                Promo Code:{" "}
                              </span>
                              <span
                                className="font-semibold px-2 py-1"
                                style={{
                                  backgroundColor: "#E9CFCA",
                                  color: "#3D3935",
                                }}
                              >
                                {booking.promo_code_code}
                              </span>
                            </p>
                          )}
                          {booking.notes && (
                            <p className="text-sm">
                              <span className="text-gray-500">
                                Notes:{" "}
                              </span>
                              <span
                                style={{ color: "#3D3935" }}
                              >
                                {booking.notes}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {(bookingsUser.bookings?.length ?? 0) === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No bookings found
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Workshops Modal */}
      {workshopsUser && (
        <>
          <div
            style={{ backgroundColor: "#000000d9" }}
            className="fixed inset-0 z-40"
            onClick={() => setWorkshopsUser(null)}
          />

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card
              className="p-8 border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Workshops - {workshopsUser.full_name} (
                  {workshopsUser.workshops?.length ?? 0})
                </h2>
                <button
                  onClick={() => setWorkshopsUser(null)}
                  className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  ...((workshopsUser.workshops as UserWorkshop[]) ??
                    []),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || 0).getTime() -
                      new Date(a.created_at || 0).getTime(),
                  )
                  .map((workshop) => {
                    const status = workshop.status || "";
                    const paymentStatus =
                      workshop.payment_status || "";
                    const title =
                      workshop.workshops?.title ||
                      "Workshop booking";

                    return (
                      <div
                        key={workshop.id}
                        className="p-4 border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span
                            className="px-3 py-1 text-sm font-semibold"
                            style={getBookingStatusStyle(
                              status,
                            )}
                          >
                            {WORKSHOP_BOOKING_STATUS_LABELS[
                              status as WorkshopBookingStatus
                            ] ||
                              status ||
                              "Unknown"}
                          </span>
                          <span
                            className="px-3 py-1 text-sm font-semibold"
                            style={getPaymentStatusStyle(
                              paymentStatus,
                            )}
                          >
                            {WORKSHOP_PAYMENT_STATUS_LABELS[
                              paymentStatus as WorkshopPaymentStatus
                            ] ||
                              paymentStatus ||
                              "Unknown"}
                          </span>
                          {workshop.workshops?.price !=
                            null && (
                            <span
                              className="ml-auto text-lg font-bold"
                              style={{ color: "#3D3935" }}
                            >
                              {formatMoney(
                                workshop.workshops.price,
                              )}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">
                              Workshop
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {title}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Preferred Month
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {workshop.preferred_month
                                ? workshop.preferred_month
                                    .charAt(0)
                                    .toUpperCase() +
                                  workshop.preferred_month.slice(
                                    1,
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Scheduled Date
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {formatDateLabel(
                                workshop.scheduled_date,
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Participant
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {workshop.participant_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Phone
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {workshop.participant_phone ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Email
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {workshop.participant_email ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Booked On
                            </p>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {formatDateLabel(
                                workshop.created_at,
                              )}
                            </p>
                          </div>
                        </div>

                        {workshop.notes && (
                          <div
                            className="mt-3 pt-3 border-t"
                            style={{ borderColor: "#DCD4CD" }}
                          >
                            <p className="text-sm">
                              <span className="text-gray-500">
                                Notes:{" "}
                              </span>
                              <span
                                style={{ color: "#3D3935" }}
                              >
                                {workshop.notes}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {(workshopsUser.workshops?.length ?? 0) ===
                  0 && (
                  <p className="text-gray-500 text-center py-4">
                    No workshops found
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Notes Modal */}
      {notesUser && (
        <>
          {/* Backdrop */}
          <div
            style={{ backgroundColor: "#000000d9" }}
            className="fixed inset-0 z-40"
            onClick={() => {
              setNotesUser(null);
              setNewNoteContent("");
              setEditingNoteId(null);
              setEditingNoteContent("");
            }}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <Card
              className="p-8 border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Notes - {notesUser.full_name}
                </h2>
                <button
                  onClick={() => {
                    setNotesUser(null);
                    setNewNoteContent("");
                    setEditingNoteId(null);
                    setEditingNoteContent("");
                  }}
                  className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Compose New Note */}
              <div
                className="mb-6 p-4 border-2"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <h3
                  className="font-semibold mb-3"
                  style={{ color: "#3D3935" }}
                >
                  Compose New Note
                </h3>
                <textarea
                  value={newNoteContent}
                  onChange={(e) =>
                    setNewNoteContent(e.target.value)
                  }
                  placeholder="Write your note here..."
                  rows={4}
                  className="w-full p-3 border-2 resize-none focus:outline-none focus:border-gray-400"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "#FEFCFA",
                  }}
                />
                <div className="flex justify-end mt-3">
                  <Button
                    className="border-2"
                    style={{
                      backgroundColor: "#E9CFCA",
                      borderColor: "#3D3935",
                      color: "#3D3935",
                    }}
                    onClick={handleAddNote}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Previous Notes */}
              <div>
                <h3
                  className="font-semibold mb-4 pb-2 border-b-2"
                  style={{
                    color: "#3D3935",
                    borderColor: "#DCD4CD",
                  }}
                >
                  Previous Notes (
                  {notesUser?.notes?.length || 0})
                </h3>
                <div className="space-y-3">
                  {notesUser?.notes
                    ?.slice()
                    .sort(
                      (a, b) =>
                        new Date(
                          b.created_at as string,
                        ).getTime() -
                        new Date(
                          a.created_at as string,
                        ).getTime(),
                    )
                    .map((note) => (
                      <div
                        key={note.id}
                        className="p-4 border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Date & Time
                              </p>
                              <p
                                className="font-medium"
                                style={{ color: "#3D3935" }}
                              >
                                {note.created_at
                                  ? new Date(
                                      note.created_at as string,
                                    ).toLocaleString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Author
                              </p>
                              <p
                                className="font-medium"
                                style={{ color: "#3D3935" }}
                              >
                                {note.author}
                              </p>
                            </div>
                          </div>
                          {/* Edit / Delete actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {editingNoteId === note.id ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateNote(note.id)
                                  }
                                  className="text-xs px-3 py-1 border-2 transition-colors hover:opacity-80"
                                  style={{
                                    borderColor: "#3D3935",
                                    color: "#3D3935",
                                    backgroundColor: "#E9CFCA",
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteContent("");
                                  }}
                                  className="text-xs px-3 py-1 border-2 transition-colors hover:bg-gray-100"
                                  style={{
                                    borderColor: "#DCD4CD",
                                    color: "#3D3935",
                                    backgroundColor:
                                      "transparent",
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteContent(
                                      note.content,
                                    );
                                  }}
                                  className="flex items-center justify-center w-8 h-8 border-2 transition-colors hover:bg-gray-100"
                                  style={{
                                    borderColor: "#DCD4CD",
                                    color: "#3D3935",
                                    backgroundColor:
                                      "transparent",
                                  }}
                                  title="Edit note"
                                >
                                  <PenLine className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteNote(note.id)
                                  }
                                  className="flex items-center justify-center w-8 h-8 border-2 transition-colors hover:bg-red-50"
                                  style={{
                                    borderColor: "#D0A096",
                                    color: "#D0A096",
                                    backgroundColor:
                                      "transparent",
                                  }}
                                  title="Delete note"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div
                          className="mt-3 pt-3 border-t"
                          style={{ borderColor: "#DCD4CD" }}
                        >
                          {editingNoteId === note.id ? (
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) =>
                                setEditingNoteContent(
                                  e.target.value,
                                )
                              }
                              rows={3}
                              className="w-full p-3 border-2 resize-none focus:outline-none focus:border-gray-400"
                              style={{
                                borderColor: "#DCD4CD",
                                color: "#3D3935",
                                backgroundColor: "#FEFCFA",
                              }}
                            />
                          ) : (
                            <p className="text-gray-700">
                              {note.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  {notesUser?.notes?.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No previous notes
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleCloseAddUserModal}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <Card
              className="p-8 border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Add New User
                </h2>
                <button
                  onClick={() => handleCloseAddUserModal()}
                  className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Name and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm mb-2 font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Sarah Johnson"
                      value={newUserData.fullName}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                      style={{
                        borderColor: "#DCD4CD",
                        color: "#3D3935",
                        backgroundColor: "#FEFCFA",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-2 font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. sarah.j@email.com"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          email: e.target.value,
                        })
                      }
                      className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                      style={{
                        borderColor: "#DCD4CD",
                        color: "#3D3935",
                        backgroundColor: "#FEFCFA",
                      }}
                    />
                  </div>
                </div>

                {/* Phone and Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm mb-2 font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Phone
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. 020 7946 1234"
                      value={newUserData.phone}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                      style={{
                        borderColor: "#DCD4CD",
                        color: "#3D3935",
                        backgroundColor: "#FEFCFA",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-2 font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Role
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          role: e.target
                            .value as (typeof ASSIGNABLE_USER_ROLES)[number],
                        })
                      }
                      className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                      style={{
                        borderColor: "#DCD4CD",
                        color: "#3D3935",
                        backgroundColor: "#FEFCFA",
                      }}
                    >
                      {ASSIGNABLE_USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {USER_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address Section */}
                <div
                  className="pt-4 border-t-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <label
                    className="block text-sm mb-4 font-medium"
                    style={{ color: "#3D3935" }}
                  >
                    Address
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label
                        className="block text-xs mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Number
                      </label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={newUserData.houseNumber}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            houseNumber: e.target.value,
                          })
                        }
                        className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                        style={{
                          borderColor: "#DCD4CD",
                          color: "#3D3935",
                          backgroundColor: "#FEFCFA",
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label
                        className="block text-xs mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Street Address
                      </label>
                      <Input
                        type="text"
                        placeholder="Baker Street"
                        value={newUserData.street}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            street: e.target.value,
                          })
                        }
                        className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                        style={{
                          borderColor: "#DCD4CD",
                          color: "#3D3935",
                          backgroundColor: "#FEFCFA",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label
                        className="block text-xs mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Postal Code
                      </label>
                      <Input
                        type="text"
                        placeholder="SW1A 1AA"
                        value={newUserData.postal_code}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            postal_code: e.target.value,
                          })
                        }
                        className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                        style={{
                          borderColor: "#DCD4CD",
                          color: "#3D3935",
                          backgroundColor: "#FEFCFA",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs mb-2"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        District
                      </label>
                      <Input
                        type="text"
                        placeholder="East Finchley"
                        value={newUserData.district}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            district: e.target.value,
                          })
                        }
                        className="w-full p-3 border-2 focus:outline-none focus:border-gray-400"
                        style={{
                          borderColor: "#DCD4CD",
                          color: "#3D3935",
                          backgroundColor: "#FEFCFA",
                        }}
                      />
                    </div>
                  </div>

                  {/* Address Preview */}
                  {(newUserData.houseNumber ||
                    newUserData.street ||
                    newUserData.postal_code ||
                    newUserData.district) && (
                    <div
                      className="mt-4 p-3 rounded border"
                      style={{
                        backgroundColor: "#FAF7F5",
                        borderColor: "#DCD4CD",
                      }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Address Preview:
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "#3D3935" }}
                      >
                        {newUserData.houseNumber &&
                          `${newUserData.houseNumber} `}
                        {newUserData.street}
                        {newUserData.postal_code &&
                          `, ${newUserData.postal_code}`}
                        {newUserData.district &&
                          `, ${newUserData.district}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    className="border-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "#E9CFCA",
                      borderColor: "#3D3935",
                      color: "#3D3935",
                    }}
                    onClick={handleAddUser}
                    disabled={isAddingUser}
                  >
                    {isAddingUser ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding…
                      </span>
                    ) : (
                      "Add User"
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setUserToDelete(null)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <Card
              className="p-8 border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FEFCFA",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Delete User - {userToDelete.full_name}
                </h2>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Confirmation Message */}
              <div
                className="mb-6 p-4 border-2"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <h3
                  className="font-semibold mb-3"
                  style={{ color: "#3D3935" }}
                >
                  Are you sure you want to delete this user?
                </h3>
                <p className="text-gray-500">
                  This action cannot be undone.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  className="border-2 px-6"
                  style={{
                    backgroundColor: "#E9CFCA",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={handleDeleteUser}
                >
                  Delete User
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}