import { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Check,
  XCircle,
  Plus,
  CreditCard,
  User,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import {
  Booking,
  BookingStatus,
} from "../../schema/booking.schema";
import { User as UserType } from "../../schema/user.schema";
import { Service } from "../../schema/service.schema";

interface AppointmentDetailPanelProps {
  booking: Booking;
  user?: UserType;
  service?: Service;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedBooking: Partial<Booking>) => void;
  onCancel?: () => void;
}

interface Payment {
  id: string;
  type: "stripe" | "manual";
  amount: number;
  method?: string;
  status: "paid" | "pending";
  stripeId?: string;
}

interface AdditionalCost {
  id: string;
  description: string;
  amount: number;
}

export function AppointmentDetailPanel({
  booking,
  user,
  service,
  open,
  onClose,
  onSave,
  onCancel,
}: AppointmentDetailPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBooking, setEditedBooking] = useState<
    Partial<Booking>
  >({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<
    AdditionalCost[]
  >([]);
  const [notes, setNotes] = useState("");
  const [editingField, setEditingField] = useState<
    string | null
  >(null);
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [newCost, setNewCost] = useState({
    description: "",
    amount: "",
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  useEffect(() => {
    if (open) {
      // Initialize with booking data
      setEditedBooking(booking);
      setNotes(booking.notes || "");

      // Initialize payments (example: one Stripe payment)
      setPayments([
        {
          id: "1",
          type: "stripe",
          amount: booking.total_amount,
          status: "paid",
          stripeId:
            booking.stripe_payment_intent_id || undefined,
        },
      ]);

      setAdditionalCosts([]);
      setIsEditMode(false);
      setEditingField(null);
      setIsEditingNotes(false);
      setTempNotes("");
    }
  }, [open, booking]);

  const handleSave = () => {
    if (onSave) {
      onSave({ ...editedBooking, notes });
    }
    setIsEditMode(false);
  };

  const handleAddCost = () => {
    if (newCost.description && newCost.amount) {
      const cost: AdditionalCost = {
        id: Date.now().toString(),
        description: newCost.description,
        amount: parseFloat(newCost.amount),
      };
      setAdditionalCosts([...additionalCosts, cost]);
      setNewCost({ description: "", amount: "" });
      setIsAddingCost(false);
    }
  };

  const handleRemoveCost = (id: string) => {
    setAdditionalCosts(
      additionalCosts.filter((c) => c.id !== id),
    );
  };

  const handleVerifyPayment = (paymentId: string) => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId
          ? { ...p, status: "paid" as const }
          : p,
      ),
    );
  };

  const handleStartEditingNotes = () => {
    setTempNotes(notes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    setNotes(tempNotes);
    setIsEditingNotes(false);
  };

  const handleCancelEditingNotes = () => {
    setTempNotes("");
    setIsEditingNotes(false);
  };

  const totalAmount =
    booking.total_amount +
    additionalCosts.reduce((sum, c) => sum + c.amount, 0);
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-2"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b-2"
          style={{ borderColor: "#DCD4CD" }}
        >
          <div className="flex items-center gap-4">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "#3D3935" }}
            >
              Appointment Details
            </h2>
            <div
              className="px-3 py-1 text-sm font-semibold"
              style={{
                backgroundColor:
                  booking.status === "cancelled"
                    ? "#DCD4CD"
                    : "#E9CFCA",
                color: "#3D3935",
              }}
            >
              {booking.status.charAt(0).toUpperCase() +
                booking.status.slice(1)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <Button
                onClick={() => setIsEditMode(true)}
                className="border-2 flex items-center gap-2"
                style={{
                  borderColor: "#3D3935",
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedBooking(booking);
                  }}
                  variant="outline"
                  className="border-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="border-2 flex items-center gap-2"
                  style={{
                    borderColor: "#3D3935",
                    backgroundColor: "#E9CFCA",
                    color: "#3D3935",
                  }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X
                className="w-5 h-5"
                style={{ color: "#3D3935" }}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Information */}
          <section
            className="border-2 p-5"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#FAF7F5",
            }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wide mb-4"
              style={{ color: "#3D3935" }}
            >
              Customer Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-600" />
                <span style={{ color: "#3D3935" }}>
                  {user?.full_name || "Unknown User"}
                </span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span style={{ color: "#3D3935" }}>
                    {user.email}
                  </span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span style={{ color: "#3D3935" }}>
                    {user.phone}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Appointment Details */}
          <section
            className="border-2 p-5"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wide mb-4"
              style={{ color: "#3D3935" }}
            >
              Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">
                  Service
                </Label>
                <div
                  className="font-medium"
                  style={{ color: "#3D3935" }}
                >
                  {service?.service_name || "Unknown Service2"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">
                  Duration
                </Label>
                <div
                  className="font-medium"
                  style={{ color: "#3D3935" }}
                >
                  {service?.duration || 60} minutes
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">
                  Date
                </Label>
                {isEditMode && editingField === "date" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={
                        editedBooking.appointment_date ||
                        booking.appointment_date
                      }
                      onChange={(e) =>
                        setEditedBooking({
                          ...editedBooking,
                          appointment_date: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`font-medium ${isEditMode ? "cursor-pointer hover:bg-gray-100 p-2 -m-2 rounded transition-colors" : ""}`}
                    style={{ color: "#3D3935" }}
                    onClick={() =>
                      isEditMode && setEditingField("date")
                    }
                  >
                    {new Date(
                      booking.appointment_date,
                    ).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">
                  Time
                </Label>
                {isEditMode && editingField === "time" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={
                        editedBooking.appointment_time ||
                        booking.appointment_time
                      }
                      onChange={(e) =>
                        setEditedBooking({
                          ...editedBooking,
                          appointment_time: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`font-medium ${isEditMode ? "cursor-pointer hover:bg-gray-100 p-2 -m-2 rounded transition-colors" : ""}`}
                    style={{ color: "#3D3935" }}
                    onClick={() =>
                      isEditMode && setEditingField("time")
                    }
                  >
                    {booking.appointment_time}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Location */}
          <section
            className="border-2 p-5"
            style={{ borderColor: "#DCD4CD" }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wide mb-4"
              style={{ color: "#3D3935" }}
            >
              Location
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-600 mt-1" />
              <div>
                <div style={{ color: "#3D3935" }}>
                  {booking.address}
                </div>
                <div className="text-sm text-gray-600">
                  {booking.district}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Ledger */}
          <section
            className="border-2 p-5"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#FAF7F5",
            }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wide mb-4"
              style={{ color: "#3D3935" }}
            >
              Financial Ledger
            </h3>

            <div className="space-y-3">
              {/* Base Service Cost */}
              <div
                className="flex items-center justify-between p-3 border"
                style={{ borderColor: "#DCD4CD" }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="text-sm"
                    style={{ color: "#3D3935" }}
                  >
                    Base Service
                  </div>
                </div>
                <div
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  £{booking.total_amount.toFixed(2)}
                </div>
              </div>

              {/* Payments */}
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor:
                      payment.type === "stripe"
                        ? "#F5F5F5"
                        : "white",
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <div className="flex-1">
                      <div
                        className="text-sm font-medium"
                        style={{
                          color:
                            payment.type === "stripe"
                              ? "#999"
                              : "#3D3935",
                        }}
                      >
                        {payment.type === "stripe"
                          ? "Stripe Payment"
                          : "Manual Payment"}
                      </div>
                      {payment.stripeId && (
                        <div className="text-xs text-gray-500 font-mono">
                          {payment.stripeId}
                        </div>
                      )}
                    </div>
                    <div
                      className="px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          payment.status === "paid"
                            ? "#D0A096"
                            : "#F1DFC0",
                        color: "#3D3935",
                      }}
                    >
                      {payment.status === "paid"
                        ? "Paid"
                        : "Pending"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      £{payment.amount.toFixed(2)}
                    </div>
                    {payment.type === "manual" &&
                      payment.status === "pending" && (
                        <Button
                          onClick={() =>
                            handleVerifyPayment(payment.id)
                          }
                          size="sm"
                          className="border text-xs"
                          style={{
                            borderColor: "#3D3935",
                            backgroundColor: "#E9CFCA",
                            color: "#3D3935",
                          }}
                        >
                          Verify
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Costs */}
          <section
            className="border-2 p-5"
            style={{ borderColor: "#DCD4CD" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: "#3D3935" }}
              >
                Additional Costs
              </h3>
              {!isAddingCost && (
                <Button
                  onClick={() => setIsAddingCost(true)}
                  size="sm"
                  variant="outline"
                  className="border-2 flex items-center gap-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <Plus className="w-4 h-4" />
                  Add Fee
                </Button>
              )}
            </div>

            {additionalCosts.length === 0 && !isAddingCost ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">
                  No additional costs
                </p>
                <Button
                  onClick={() => setIsAddingCost(true)}
                  className="border-2"
                  style={{
                    borderColor: "#3D3935",
                    backgroundColor: "transparent",
                    color: "#3D3935",
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Fee
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {additionalCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 border"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <div className="flex-1">
                      <div
                        className="text-sm"
                        style={{ color: "#3D3935" }}
                      >
                        {cost.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        £{cost.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveCost(cost.id)
                        }
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}

                {isAddingCost && (
                  <div
                    className="flex items-center gap-3 p-3 border-2 border-dashed"
                    style={{
                      borderColor: "#E9CFCA",
                      backgroundColor: "#FCEAE0",
                    }}
                  >
                    <Input
                      placeholder="Service description"
                      value={newCost.description}
                      onChange={(e) =>
                        setNewCost({
                          ...newCost,
                          description: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={newCost.amount}
                      onChange={(e) =>
                        setNewCost({
                          ...newCost,
                          amount: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                    <Button
                      onClick={handleAddCost}
                      size="sm"
                      className="border-2"
                      style={{
                        borderColor: "#3D3935",
                        backgroundColor: "#E9CFCA",
                        color: "#3D3935",
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => {
                        setIsAddingCost(false);
                        setNewCost({
                          description: "",
                          amount: "",
                        });
                      }}
                      className="p-2"
                    >
                      <XCircle className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}

                {/* Total Summary */}
                {additionalCosts.length > 0 && (
                  <div
                    className="flex items-center justify-between p-4 border-2 mt-4"
                    style={{
                      borderColor: "#3D3935",
                      backgroundColor: "#EADDD5",
                    }}
                  >
                    <div
                      className="font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      Total Amount
                    </div>
                    <div
                      className="text-xl font-bold"
                      style={{ color: "#3D3935" }}
                    >
                      £{totalAmount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Notes */}
          <section
            className="border-2 p-5"
            style={{ borderColor: "#DCD4CD" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: "#3D3935" }}
              >
                Internal Notes
              </h3>
              {!isEditingNotes && notes && (
                <Button
                  onClick={handleStartEditingNotes}
                  size="sm"
                  variant="outline"
                  className="border flex items-center gap-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </Button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add internal notes…"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="min-h-[100px] resize-none transition-all"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    onClick={handleCancelEditingNotes}
                    size="sm"
                    variant="outline"
                    className="border"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNotes}
                    size="sm"
                    className="border-2 flex items-center gap-2"
                    style={{
                      borderColor: "#3D3935",
                      backgroundColor: "#E9CFCA",
                      color: "#3D3935",
                    }}
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </Button>
                </div>
              </div>
            ) : notes ? (
              <div
                className="p-4 border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                }}
                onClick={handleStartEditingNotes}
              >
                {notes}
              </div>
            ) : (
              <div
                className="p-4 text-gray-400 text-sm cursor-pointer hover:bg-gray-50 transition-colors border"
                style={{ borderColor: "#DCD4CD" }}
                onClick={handleStartEditingNotes}
              >
                Add internal notes…
              </div>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        {booking.status !== "cancelled" &&
          booking.status !== "completed" && (
            <div
              className="border-t-2 p-6"
              style={{ borderColor: "#DCD4CD" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {pendingAmount > 0 && (
                    <span style={{ color: "#D0A096" }}>
                      Outstanding: £{pendingAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="border-2"
                  style={{
                    borderColor: "#D0A096",
                    color: "#D0A096",
                  }}
                >
                  Cancel Appointment
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}