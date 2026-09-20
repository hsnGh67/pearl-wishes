import { useEffect, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  PenLine,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { AdminPagination } from "../admin/AdminPagination";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  getClientsForArtist,
  addUserNote,
  updateUserNote,
  deleteUserNote,
} from "../../lib/db/users";
import { User, Note } from "../../schema/user.schema";
import { ClientAppointmentsModal } from "./ClientAppointmentsModal";

const PAGE_SIZE = 50;

function formatDateLabel(dateValue?: string | Date | null) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLastAppointmentDate(user: User): string | null {
  const bookings = user.bookings ?? [];
  if (bookings.length === 0) return null;

  let latest: string | null = null;
  for (const booking of bookings) {
    const raw = booking.appointment_date;
    if (!raw) continue;
    const iso =
      typeof raw === "string"
        ? raw
        : new Date(raw).toISOString().slice(0, 10);
    if (!latest || iso > latest) latest = iso;
  }
  return latest;
}

interface ClientHistoryViewProps {
  artistId: string;
  artistDisplayName: string;
}

export function ClientHistoryView({
  artistId,
  artistDisplayName,
}: ClientHistoryViewProps) {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [notesUser, setNotesUser] = useState<User | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(
    null,
  );
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [appointmentsUser, setAppointmentsUser] =
    useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, totalCount: count } =
          await getClientsForArtist(artistId, {
            page: currentPage,
            limit: PAGE_SIZE,
          });
        if (cancelled) return;
        setClients(data ?? []);
        setTotalCount(count ?? 0);
      } catch (err) {
        console.error("Failed to load client history:", err);
        if (cancelled) return;
        setError("Unable to load client history. Please try again.");
        setClients([]);
        setTotalCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchClients();
    return () => {
      cancelled = true;
    };
  }, [artistId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredClients = clients.filter((user) => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    const searchClean = searchLower.replace(/[^a-z0-9@.]/g, "");
    const phoneClean = (user.phone || "").replace(/[^0-9]/g, "");
    const email = (user.email || "").toLowerCase();

    return (
      (user.full_name || "").toLowerCase().includes(searchLower) ||
      email.includes(searchLower) ||
      phoneClean.includes(searchClean) ||
      (user.phone || "").includes(searchLower)
    );
  });

  const closeNotesModal = () => {
    setNotesUser(null);
    setNewNoteContent("");
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  const handleAddNote = async () => {
    if (!notesUser || !newNoteContent.trim()) return;

    try {
      const newNote = await addUserNote(
        notesUser.id!,
        newNoteContent,
        artistDisplayName || "Artist",
      );

      setClients((prev) =>
        prev.map((user) =>
          user.id === notesUser.id
            ? { ...user, notes: [...(user.notes ?? []), newNote] }
            : user,
        ),
      );
      setNotesUser((prev: User | null) =>
        prev
          ? { ...prev, notes: [...(prev.notes ?? []), newNote] }
          : prev,
      );
      setNewNoteContent("");
    } catch (err) {
      console.error("Failed to add note:", err);
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

      setClients((prev) =>
        prev.map((user) =>
          user.id === notesUser.id
            ? { ...user, notes: replaceNote(user.notes ?? []) }
            : user,
        ),
      );
      setNotesUser((prev: User | null) =>
        prev
          ? { ...prev, notes: replaceNote(prev.notes ?? []) }
          : prev,
      );
      setEditingNoteId(null);
      setEditingNoteContent("");
    } catch (err) {
      console.error("Failed to update note:", err);
      alert("Failed to update note. Please try again.");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!notesUser) return;
    if (
      !confirm(
        "Are you sure you want to delete this note? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteUserNote(noteId);
      const filterNote = (notes: Note[]) =>
        notes.filter((n) => n.id !== noteId);

      setClients((prev) =>
        prev.map((user) =>
          user.id === notesUser.id
            ? { ...user, notes: filterNote(user.notes ?? []) }
            : user,
        ),
      );
      setNotesUser((prev: User | null) =>
        prev
          ? { ...prev, notes: filterNote(prev.notes ?? []) }
          : prev,
      );
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Failed to delete note. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1" style={{ color: "#3D3935" }}>
          Client History
        </h1>
        <p className="text-sm" style={{ color: "#9C9088" }}>
          Clients who have booked with you
        </p>
      </div>

      <Card
        className="p-4 mb-6 border-2"
        style={{ borderColor: "#DCD4CD" }}
      >
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </Card>

      {error && (
        <p className="mb-4 text-sm" style={{ color: "#D0A096" }}>
          {error}
        </p>
      )}

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
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2
                      className="w-6 h-6 animate-spin mx-auto"
                      style={{ color: "#9C9088" }}
                    />
                  </td>
                </tr>
              )}
              {!isLoading && filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-sm"
                    style={{ color: "#9C9088" }}
                  >
                    {searchTerm.trim()
                      ? "No clients match your search on this page."
                      : "No clients yet."}
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredClients.map((user) => (
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {user.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {user.phone || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-500 text-sm">
                        {user.address || "-"}
                      </span>
                    </td>
                    <td
                      className="p-0 cursor-pointer"
                      onClick={() => setAppointmentsUser(user)}
                    >
                      <div className="w-full h-full p-4">
                        {(user.bookings?.length ?? 0) > 0 ? (
                          <span
                            className="text-sm font-semibold underline transition-colors hover:opacity-70"
                            style={{ color: "#3D3935" }}
                          >
                            {user.bookings?.length ?? 0}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            0
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDateLabel(user.created_at)}
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDateLabel(getLastAppointmentDate(user))}
                    </td>
                    <td
                      className="p-0 cursor-pointer"
                      onClick={() => setNotesUser(user)}
                    >
                      <div className="w-full h-full p-4">
                        {user.notes && user.notes.length > 0 ? (
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
                ))}
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

      {appointmentsUser && (
        <ClientAppointmentsModal
          user={appointmentsUser}
          onClose={() => setAppointmentsUser(null)}
        />
      )}

      {notesUser && (
        <>
          <div
            style={{ backgroundColor: "#000000d9" }}
            className="fixed inset-0 z-40"
            onClick={closeNotesModal}
          />
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
                  onClick={closeNotesModal}
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
                  onChange={(e) => setNewNoteContent(e.target.value)}
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

              <div>
                <h3
                  className="font-semibold mb-4 pb-2 border-b-2"
                  style={{
                    color: "#3D3935",
                    borderColor: "#DCD4CD",
                  }}
                >
                  Previous Notes ({notesUser.notes?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(notesUser.notes ?? [])
                    .slice()
                    .sort(
                      (a: Note, b: Note) =>
                        new Date(b.created_at as string).getTime() -
                        new Date(a.created_at as string).getTime(),
                    )
                    .map((note: Note) => (
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
                                    backgroundColor: "transparent",
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
                                    backgroundColor: "transparent",
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
                                    backgroundColor: "transparent",
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
                                setEditingNoteContent(e.target.value)
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
                  {(notesUser.notes?.length ?? 0) === 0 && (
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
    </div>
  );
}
