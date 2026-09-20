import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { Card } from "../ui/card";
import { getBookingById } from "../../lib/db/bookings";
import { User } from "../../schema/user.schema";
import {
  Booking,
  BookingStatus,
  BOOKING_STATUS_LABELS,
  PaymentStatus,
} from "../../schema/booking.schema";
import { BookingTreatmentStatus } from "../../schema/booking-treatment.schema";

type ModalView = "list" | "detail";

type BookingTreatmentDetail = {
  id?: string;
  service_name?: string;
  person_name?: string;
  price?: number;
  duration?: number;
  status?: string;
  addOns?: Array<{
    id?: string;
    name?: string;
    price?: number;
  }> | null;
};

type BookingDetail = Booking & {
  services?: BookingTreatmentDetail[] | null;
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PaymentStatus.UNPAID]: "Unpaid",
  [PaymentStatus.PARTIALL_PAID]: "Partially Paid",
  [PaymentStatus.PARTIALL_REFUNDED]: "Partially Refunded",
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.REFUNDED]: "Refunded",
};

function formatDateLabel(dateValue?: string | Date | null) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount?: number | null) {
  return `£${Number(amount ?? 0).toFixed(2)}`;
}

function getBookingStatusStyle(status: string) {
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
}

function getPaymentStatusStyle(status: string) {
  if (status === PaymentStatus.PAID) {
    return { backgroundColor: "#E9CFCA", color: "#3D3935" };
  }
  if (status === PaymentStatus.UNPAID) {
    return { backgroundColor: "#F1DFC0", color: "#3D3935" };
  }
  if (status === PaymentStatus.REFUNDED) {
    return { backgroundColor: "#EADDD5", color: "#3D3935" };
  }
  return { backgroundColor: "#DCD4CD", color: "#3D3935" };
}

interface ClientAppointmentsModalProps {
  user: User;
  onClose: () => void;
}

export function ClientAppointmentsModal({
  user,
  onClose,
}: ClientAppointmentsModalProps) {
  const [modalView, setModalView] = useState<ModalView>("list");
  const [selectedBookingId, setSelectedBookingId] = useState<
    string | null
  >(null);
  const [bookingDetail, setBookingDetail] =
    useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(
    null,
  );

  const bookings = [...(user.bookings ?? [])].sort(
    (a, b) =>
      new Date(b.appointment_date as string).getTime() -
      new Date(a.appointment_date as string).getTime(),
  );

  useEffect(() => {
    if (modalView !== "detail" || !selectedBookingId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        setBookingDetail(null);
        const data = await getBookingById(selectedBookingId);
        if (cancelled) return;
        if (!data) {
          setDetailError("Appointment not found.");
          return;
        }
        setBookingDetail(data as BookingDetail);
      } catch (err) {
        console.error("Failed to load appointment:", err);
        if (cancelled) return;
        setDetailError(
          "Unable to load appointment. Please try again.",
        );
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [modalView, selectedBookingId]);

  const goToList = () => {
    setModalView("list");
    setSelectedBookingId(null);
    setBookingDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const openDetail = (bookingId?: string) => {
    if (!bookingId) return;
    setSelectedBookingId(bookingId);
    setModalView("detail");
  };

  const detailTitle = bookingDetail
    ? `${formatDateLabel(bookingDetail.appointment_date)} · ${bookingDetail.appointment_time}`
    : "Appointment";

  return (
    <>
      <div
        style={{ backgroundColor: "#000000d9" }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card
          className="p-8 border-2"
          style={{
            borderColor: "#DCD4CD",
            backgroundColor: "#FEFCFA",
          }}
        >
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {modalView === "detail" && (
                <button
                  type="button"
                  onClick={goToList}
                  className="flex items-center gap-1 shrink-0 px-2 py-1.5 border-2 text-sm transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                    backgroundColor: "transparent",
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <h2
                className="font-semibold truncate"
                style={{ color: "#3D3935" }}
              >
                {modalView === "list"
                  ? `Appointments - ${user.full_name} (${bookings.length})`
                  : detailTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border-2 transition-colors hover:bg-gray-100 shrink-0"
              style={{
                borderColor: "#DCD4CD",
                color: "#3D3935",
                backgroundColor: "transparent",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {modalView === "list" && (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <button
                  type="button"
                  key={booking.id}
                  onClick={() => openDetail(booking.id)}
                  className="w-full text-left p-4 border-2 transition-colors hover:bg-[#FAF7F5]"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="px-3 py-1 text-sm font-semibold"
                      style={getBookingStatusStyle(booking.status)}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {formatDateLabel(booking.appointment_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {booking.appointment_time}
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
                  </div>
                </button>
              ))}

              {bookings.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No appointments found
                </p>
              )}
            </div>
          )}

          {modalView === "detail" && (
            <div>
              {detailLoading && (
                <div className="py-16 flex justify-center">
                  <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: "#9C9088" }}
                  />
                </div>
              )}

              {!detailLoading && detailError && (
                <div className="py-10 text-center space-y-4">
                  <p style={{ color: "#D0A096" }}>{detailError}</p>
                  <button
                    type="button"
                    onClick={goToList}
                    className="inline-flex items-center gap-1 px-3 py-2 border-2 text-sm"
                    style={{
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to list
                  </button>
                </div>
              )}

              {!detailLoading && !detailError && bookingDetail && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-3 py-1 text-sm font-semibold"
                      style={getBookingStatusStyle(
                        bookingDetail.status,
                      )}
                    >
                      {BOOKING_STATUS_LABELS[
                        bookingDetail.status as BookingStatus
                      ] || bookingDetail.status}
                    </span>
                    <span
                      className="px-3 py-1 text-sm font-semibold"
                      style={getPaymentStatusStyle(
                        bookingDetail.payment_status,
                      )}
                    >
                      {PAYMENT_STATUS_LABELS[
                        bookingDetail.payment_status
                      ] || bookingDetail.payment_status}
                    </span>
                    <span
                      className="ml-auto text-lg font-bold"
                      style={{ color: "#3D3935" }}
                    >
                      {formatMoney(bookingDetail.total_amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {formatDateLabel(
                          bookingDetail.appointment_date,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingDetail.appointment_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">People</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingDetail.people_numbers}{" "}
                        {bookingDetail.people_numbers === 1
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
                        {bookingDetail.district || "-"}
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
                        {bookingDetail.address || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Postcode
                      </p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingDetail.postal_code || "-"}
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
                        {formatMoney(bookingDetail.subtotal_amount)}
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
                        {formatMoney(bookingDetail.discount_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Balance</p>
                      <p
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {formatMoney(bookingDetail.balance_amount)}
                      </p>
                    </div>
                  </div>

                  {(bookingDetail.promo_code_code ||
                    bookingDetail.notes) && (
                    <div
                      className="pt-3 border-t space-y-2"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      {bookingDetail.promo_code_code && (
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
                            {bookingDetail.promo_code_code}
                          </span>
                        </p>
                      )}
                      {bookingDetail.notes && (
                        <p className="text-sm">
                          <span className="text-gray-500">
                            Notes:{" "}
                          </span>
                          <span style={{ color: "#3D3935" }}>
                            {bookingDetail.notes}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div
                    className="pt-4 border-t"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <h3
                      className="font-semibold mb-3"
                      style={{ color: "#3D3935" }}
                    >
                      Treatments
                    </h3>
                    <div className="space-y-3">
                      {(bookingDetail.services ?? []).map(
                        (treatment, index) => (
                          <div
                            key={treatment.id ?? index}
                            className="p-3 border-2"
                            style={{ borderColor: "#DCD4CD" }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p
                                  className="font-medium"
                                  style={{ color: "#3D3935" }}
                                >
                                  {treatment.service_name ||
                                    "Treatment"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {treatment.person_name || "-"}
                                  {treatment.duration
                                    ? ` · ${treatment.duration} min`
                                    : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className="font-semibold"
                                  style={{ color: "#3D3935" }}
                                >
                                  {formatMoney(treatment.price)}
                                </p>
                                {treatment.status && (
                                  <p className="text-xs text-gray-500 capitalize">
                                    {treatment.status ===
                                    BookingTreatmentStatus.ACTIVE
                                      ? "Active"
                                      : treatment.status}
                                  </p>
                                )}
                              </div>
                            </div>
                            {(treatment.addOns?.length ?? 0) > 0 && (
                              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                {treatment.addOns!.map(
                                  (addon, addonIndex) => (
                                    <li
                                      key={
                                        addon.id ??
                                        `${index}-${addonIndex}`
                                      }
                                    >
                                      + {addon.name || "Add-on"}
                                      {addon.price != null
                                        ? ` (${formatMoney(addon.price)})`
                                        : ""}
                                    </li>
                                  ),
                                )}
                              </ul>
                            )}
                          </div>
                        ),
                      )}
                      {(bookingDetail.services?.length ?? 0) ===
                        0 && (
                        <p className="text-sm text-gray-500">
                          No treatments on this appointment.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
