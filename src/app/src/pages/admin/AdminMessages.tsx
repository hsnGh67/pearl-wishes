import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Mail,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  getContactMessages,
  markContactMessageAsRead,
  deleteContactMessage,
  subscribeToContactMessages,
} from "../../lib/db/contact-messages";
import { ContactMessage } from "../../schema/contact-message.schema";

const PAGE_SIZE = 50;

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail dialog
  const [viewMessage, setViewMessage] =
    useState<ContactMessage | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] =
    useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMessages = useCallback(
    async (p: number, unread: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContactMessages({
          page: p,
          limit: PAGE_SIZE,
          unreadOnly: unread,
        });
        setMessages(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMessages(page, unreadOnly);
  }, [page, unreadOnly, loadMessages]);

  useEffect(() => {
    const unsub = subscribeToContactMessages(() => {
      void loadMessages(page, unreadOnly);
    });
    return unsub;
  }, [page, unreadOnly, loadMessages]);

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const handleViewOpen = async (msg: ContactMessage) => {
    setViewMessage(msg);
    if (!msg.is_read) {
      try {
        await markContactMessageAsRead(msg.id, true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, is_read: true } : m,
          ),
        );
      } catch {
        // non-critical — message still shows
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteContactMessage(deleteTarget.id);
      setMessages((prev) =>
        prev.filter((m) => m.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch {
      // keep dialog open on failure
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterToggle = (unread: boolean) => {
    setUnreadOnly(unread);
    setPage(1);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1
              className="mb-1"
              style={{ color: "#3D3935" }}
            >
              Customer Messages
            </h1>
            <p className="text-gray-600 text-sm">
              Messages submitted via the contact form
            </p>
          </div>
          {unreadCount > 0 && (
            <span
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border-2"
              style={{
                borderColor: "#3D3935",
                backgroundColor: "#3D3935",
                color: "#FCEAE0",
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex border-2" style={{ borderColor: "#3D3935" }}>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: !unreadOnly ? "#3D3935" : "transparent",
              color: !unreadOnly ? "#FCEAE0" : "#3D3935",
            }}
            onClick={() => handleFilterToggle(false)}
          >
            All Messages
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: unreadOnly ? "#3D3935" : "transparent",
              color: unreadOnly ? "#FCEAE0" : "#3D3935",
            }}
            onClick={() => handleFilterToggle(true)}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* Table card */}
      <Card
        className="border-2 overflow-hidden"
        style={{ borderColor: "#DCD4CD" }}
      >
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading messages…
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {unreadOnly
              ? "No unread messages."
              : "No messages yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#FAF7F5" }}>
                <tr
                  className="border-b-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  {["Date", "Name", "Email", "Preview", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: msg.is_read
                        ? undefined
                        : "#FFF9F7",
                    }}
                  >
                    <td
                      className="px-4 py-3 text-gray-500 whitespace-nowrap"
                    >
                      {formatDate(msg.created_at)}
                    </td>
                    <td
                      className="px-4 py-3 font-medium whitespace-nowrap"
                      style={{ color: "#3D3935" }}
                    >
                      {msg.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${msg.email}`}
                        className="underline underline-offset-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {msg.email}
                      </a>
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 max-w-xs"
                    >
                      {truncate(msg.message)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: msg.is_read
                            ? "#DCD4CD"
                            : "#E9CFCA",
                          color: "#3D3935",
                        }}
                      >
                        {msg.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          className="flex items-center gap-1.5 h-8 px-3 text-xs border-2"
                          style={{
                            borderColor: "#3D3935",
                            backgroundColor: "transparent",
                            color: "#3D3935",
                          }}
                          onClick={() => handleViewOpen(msg)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        <Button
                          className="flex items-center gap-1.5 h-8 px-3 text-xs border-2"
                          style={{
                            borderColor: "#C0392B",
                            backgroundColor: "transparent",
                            color: "#C0392B",
                          }}
                          onClick={() => setDeleteTarget(msg)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && messages.length > 0 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t-2"
            style={{ borderColor: "#DCD4CD" }}
          >
            <p className="text-sm text-gray-500">
              Page {page}
            </p>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 px-3 border-2 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  backgroundColor: "transparent",
                }}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                className="h-8 px-3 border-2 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  backgroundColor: "transparent",
                }}
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewMessage}
        onOpenChange={(open) => !open && setViewMessage(null)}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Message from {viewMessage?.name}</DialogTitle>
            <DialogDescription>
              {formatDate(viewMessage?.created_at)}
            </DialogDescription>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <a
                  href={`mailto:${viewMessage.email}`}
                  className="underline underline-offset-2"
                  style={{ color: "#3D3935" }}
                >
                  {viewMessage.email}
                </a>
              </div>
              <div
                className="p-4 border-2 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                  color: "#3D3935",
                }}
              >
                {viewMessage.message}
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: viewMessage.is_read
                      ? "#DCD4CD"
                      : "#E9CFCA",
                    color: "#3D3935",
                  }}
                >
                  {viewMessage.is_read ? "Read" : "Unread"}
                </span>
                <Button
                  className="h-8 px-4 text-xs border-2"
                  style={{
                    borderColor: "#3D3935",
                    backgroundColor: "transparent",
                    color: "#3D3935",
                  }}
                  onClick={() => setViewMessage(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4 py-2">
              <div
                className="p-4 border-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                  color: "#3D3935",
                }}
              >
                <p className="font-semibold mb-1">
                  {deleteTarget.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {deleteTarget.email}
                </p>
                <p className="mt-2 text-gray-600">
                  {truncate(deleteTarget.message, 120)}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  className="h-9 px-4 text-sm border-2"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "transparent",
                    color: "#3D3935",
                  }}
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="h-9 px-4 text-sm border-2"
                  style={{
                    borderColor: "#C0392B",
                    backgroundColor: "#C0392B",
                    color: "#FFFFFF",
                  }}
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
