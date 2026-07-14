import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Check, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Separator } from "./ui/separator";
import { VisuallyHidden } from "./ui/visually-hidden";
import { Textarea } from "./ui/textarea";
import { createWorkshopBooking } from "../src/lib/db/workshop-bookings";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  WorkshopBookingCreate,
  WorkshopBookingStatus,
  WorkshopPaymentStatus,
} from "../src/schema/workshop-booking.schema";
import {
  formatDurationLabel,
  Workshop,
  WorkshopDisplay,
} from "../src/schema/workshop.schema";
import { createUser, getUserByPhone } from "../src/lib/db/users";
import { UserCreate } from "../src/schema/user.schema";

interface WorkshopBookingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop: WorkshopDisplay;
}

const countryCodes = [
  { id: "uk-44", code: "+44", country: "United Kingdom" },
  { id: "us-1", code: "+1", country: "United States" },
  { id: "fr-33", code: "+33", country: "France" },
  { id: "de-49", code: "+49", country: "Germany" },
  { id: "it-39", code: "+39", country: "Italy" },
  { id: "es-34", code: "+34", country: "Spain" },
  { id: "pt-351", code: "+351", country: "Portugal" },
  { id: "nl-31", code: "+31", country: "Netherlands" },
  { id: "be-32", code: "+32", country: "Belgium" },
  { id: "ch-41", code: "+41", country: "Switzerland" },
  { id: "ie-353", code: "+353", country: "Ireland" },
];

type BookingStep =
  | "overview"
  | "month"
  | "participant"
  | "review"
  | "stripe"
  | "success";

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

export function WorkshopBookingFlow({
  open,
  onOpenChange,
  workshop,
}: WorkshopBookingFlowProps) {
  const [step, setStep] = useState<BookingStep>("overview");
  const [otpCode, setOtpCode] = useState("");
  const [countryCode, setCountryCode] = useState("uk-44");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bookingData, setBookingData] = useState<WorkshopBookingCreate>({
    workshop_id: workshop.id,
    user_id: "",
    preferred_month: "",
    participant_name: "",
    participant_phone: "",
    participant_email: "",
    payment_status: WorkshopPaymentStatus.PENDING,
    payment_intent_id: "",
    receipt_number: "",
    notes: "",
  });
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);

  const handleClose = () => {
    setStep("overview");
    setBookingData({
      workshop_id: "",
      user_id: "",
      preferred_month: "",
      participant_name: "",
      participant_phone: "",
      participant_email: "",
      payment_status: WorkshopPaymentStatus.PENDING,
      payment_intent_id: "",
      notes: "",
    });
    setIsAddingNewUser(false);
    setReceiptNumber("");
    setOtpCode("");
    setPhoneNumber("");
    setCountryCode("uk-44");
    onOpenChange(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNewUser(true);
    if (phoneNumber && otpCode.length === 6) {
      const zipCode =
        countryCodes.find((c) => c.id === countryCode)?.code || "";
      const userPhone = `${zipCode}${phoneNumber.replaceAll(" ", "")}`;
      // Check if user exists in database
      let existingUser = await getUserByPhone(userPhone);
      if (existingUser) {
        // Autofill user data

        setBookingData({
          ...bookingData,
          participant_phone: userPhone.replaceAll(" ", ""),
          user_id: existingUser.id,
        });
        setStep("review");
        setIsAddingNewUser(false);
      } else {
        await handleCreateUser({
          full_name: bookingData.participant_name,
          phone: userPhone.replaceAll(" ", ""),
          email: bookingData.participant_email,
          address: "",
          district: "",
          role: "client",
        });
      }
    }
  };

  const handleCreateUser = async (userData: UserCreate) => {
    try {
      const existingUser = await createUser(userData);
      console.log("user created ===>", existingUser);
      setBookingData({
        ...bookingData,
        participant_phone: existingUser.phone.replaceAll(" ", ""),
        participant_email: existingUser.email,
        user_id: existingUser.id,
      });
      setIsAddingNewUser(false);
      setStep("review");
    } catch (e) {
      console.log("error creating user ===>", e);
      const error = e as { details: string };
      setIsAddingNewUser(false);
      alert(error?.details || "Failed to create user. Please try again.");
    }
  };

  const handleMonthSelect = (monthId: string) => {
    setBookingData({
      ...bookingData,
      preferred_month: monthId,
    });
  };

  const handleStripeCheckout = async () => {
    try {
      // Simulate Stripe redirect with loading state
      // In production, this would redirect to Stripe and handle the callback

      // Generate receipt number
      const receipt = `WSR-${Date.now().toString().slice(-8)}`;

      const preferredMonth =
        availableMonths.find(
          (month) => month.id === bookingData.preferred_month,
        ) || availableMonths[0];
      // Save booking to database using existing schema
      const bookingPayload: any = {
        user_id: bookingData.user_id,
        participant_name: bookingData.participant_name,
        participant_email: bookingData.participant_email,
        participant_phone: bookingData.participant_phone,
        payment_status: WorkshopPaymentStatus.PAID,
        notes: bookingData.notes,
        preferred_month: `${preferredMonth.label}-${preferredMonth.year}`,
        workshop_id: workshop.id,
        payment_intent_id: `pi_demo_${Date.now()}`, // In production, use real Stripe payment intent ID
        status: WorkshopBookingStatus.PENDING,
      };

      await createWorkshopBooking(bookingPayload);

      setReceiptNumber(receipt);
      setStep("success");
    } catch (error) {
      console.error("Failed to create workshop booking:", error);
      alert("Failed to complete booking. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-2xl"
        style={{ backgroundColor: "#FEFCFA" }}
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Workshop Booking Flow</DialogTitle>
            <DialogDescription>
              Reserve your workshop spot in a few simple steps
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>

        {/* Step 1: Workshop Overview */}
        {step === "overview" && (
          <>
            <DialogHeader>
              <DialogTitle>Workshop Overview</DialogTitle>
              <DialogDescription>
                Review your selected workshop details
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* Workshop Summary Card */}
              <Card
                style={{
                  backgroundColor: "#FAF7F5",
                  borderColor: "#DCD4CD",
                }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg mb-1" style={{ color: "#3D3935" }}>
                        {workshop.title}
                      </h3>
                      <p
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Professional hands-on training
                      </p>
                    </div>

                    <Separator style={{ backgroundColor: "#DCD4CD" }} />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock
                          className="w-4 h-4"
                          style={{
                            color: "#3D3935",
                            opacity: 0.7,
                          }}
                        />
                        <span
                          className="text-sm"
                          style={{
                            color: "#3D3935",
                            opacity: 0.7,
                          }}
                        >
                          Duration
                        </span>
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {formatDurationLabel(
                          workshop.sessionCount,
                          workshop.sessionDurationHours,
                        )}
                      </span>
                    </div>

                    <Separator style={{ backgroundColor: "#DCD4CD" }} />

                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Base Reservation Fee
                      </span>
                      <span
                        className="text-xl font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        £{workshop.price || ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: "#EADDD5",
                  borderColor: "#DCD4CD",
                }}
              >
                <p className="text-sm" style={{ color: "#3D3935" }}>
                  <span className="font-medium">Note:</span> This reservation
                  fee secures your spot. Final scheduling and any additional
                  costs will be coordinated via WhatsApp.
                </p>
              </div>

              <Button
                onClick={() => setStep("month")}
                className="w-full transition-all"
                style={{
                  backgroundColor: "#3D3935",
                  background: "#3D3935",
                  color: "transparent",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "#1F1F1F";
                  e.currentTarget.style.background = "#1F1F1F";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "#3D3935";
                  e.currentTarget.style.background = "#3D3935";
                }}
              >
                <span
                  style={{
                    background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  Continue to Month Selection
                </span>
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Preferred Month Selection */}
        {step === "month" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Preferred Month</DialogTitle>
              <DialogDescription>
                Choose your preferred month for the workshop
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-4">
                <Label>Available Months</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableMonths.map((month) => (
                    <button
                      key={month.id}
                      type="button"
                      onClick={() => handleMonthSelect(month.id)}
                      className="p-4 border-2 transition-all text-center"
                      style={
                        bookingData.preferred_month === month.id
                          ? {
                              backgroundColor: "#EADDD5",
                              borderColor: "#EADDD5",
                              color: "#3D3935",
                            }
                          : {
                              backgroundColor: "#3D3935",
                              borderColor: "#3D3935",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (bookingData.preferred_month !== month.id) {
                          e.currentTarget.style.backgroundColor = "#1F1F1F";
                          e.currentTarget.style.borderColor = "#1F1F1F";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (bookingData.preferred_month !== month.id) {
                          e.currentTarget.style.backgroundColor = "#3D3935";
                          e.currentTarget.style.borderColor = "#3D3935";
                        }
                      }}
                    >
                      <span
                        className="block mb-1"
                        style={
                          bookingData.preferred_month === month.id
                            ? {
                                color: "#3D3935",
                                fontWeight: 500,
                              }
                            : {
                                background:
                                  "linear-gradient(to right, #FCEAE0, #EACAB8)",
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                                fontWeight: 500,
                              }
                        }
                      >
                        {month.label}
                      </span>
                      <span
                        className="text-xs"
                        style={
                          bookingData.preferred_month === month.id
                            ? { color: "#3D3935", opacity: 0.7 }
                            : {
                                background:
                                  "linear-gradient(to right, #FCEAE0, #EACAB8)",
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                              }
                        }
                      >
                        {month.year}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: "#FAF7F5",
                  borderColor: "#DCD4CD",
                }}
              >
                <div className="flex items-start gap-2">
                  <CalendarIcon
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#3D3935", opacity: 0.7 }}
                  />
                  <p className="text-sm" style={{ color: "#3D3935" }}>
                    Workshop dates are finalized later. Our team will contact
                    participants via WhatsApp once scheduling is confirmed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("overview")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("participant")}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: bookingData.preferred_month
                      ? "#3D3935"
                      : "#DCD4CD",
                    color: bookingData.preferred_month
                      ? "transparent"
                      : "#3D3935",
                    cursor: bookingData.preferred_month
                      ? "pointer"
                      : "not-allowed",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (bookingData.preferred_month) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (bookingData.preferred_month) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                      e.currentTarget.style.background = "#3D3935";
                    }
                  }}
                  disabled={!bookingData.preferred_month}
                >
                  {bookingData.preferred_month ? (
                    <span
                      style={{
                        background:
                          "linear-gradient(to right, #FCEAE0, #EACAB8)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      Continue
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Participant Information */}
        {step === "participant" && (
          <>
            <DialogHeader>
              <DialogTitle>Participant Information</DialogTitle>
              <DialogDescription>
                Enter your contact details for workshop coordination
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePhoneSubmit(e);
              }}
              className="py-4 space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Sarah Johnson"
                    value={bookingData.participant_name}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        participant_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <Select
                      value={countryCode}
                      onValueChange={(value) => {
                        console.log("Country", value);
                        setCountryCode(value);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} {item.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="7XXX XXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                      required
                    />
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "#3D3935", opacity: 0.6 }}
                  >
                    We'll use WhatsApp to coordinate final workshop details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value: string) => setOtpCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Enter the 6-digit code to verify your number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@example.com"
                    value={bookingData.participant_email}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        participant_email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any questions or special requirements..."
                    value={bookingData.notes}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        notes: e.target.value,
                      })
                    }
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("month")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor:
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                        ? "#3D3935"
                        : "#DCD4CD",
                    background:
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                        ? "#3D3935"
                        : "#DCD4CD",
                    color:
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                        ? "transparent"
                        : "#3D3935",
                    cursor:
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                    ) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (
                      bookingData.participant_name &&
                      phoneNumber &&
                      otpCode &&
                      bookingData.participant_email
                    ) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                      e.currentTarget.style.background = "#3D3935";
                    }
                  }}
                  disabled={
                    !bookingData.participant_name ||
                    !otpCode ||
                    !phoneNumber ||
                    !bookingData.participant_email ||
                    isAddingNewUser
                  }
                >
                  {otpCode &&
                  phoneNumber &&
                  bookingData.participant_email &&
                  !isAddingNewUser ? (
                    <span
                      style={{
                        background:
                          "linear-gradient(to right, #FCEAE0, #EACAB8)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      Continue
                    </span>
                  ) : (
                    "Checking..."
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Step 4: Booking Review & Payment */}
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle>Review & Payment</DialogTitle>
              <DialogDescription>
                Confirm your workshop reservation details
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* Participant Details */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Participant Details
                </h3>
                <Card style={{ backgroundColor: "#FAF7F5" }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Name
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.participant_name}
                      </span>
                    </div>
                    <Separator style={{ backgroundColor: "#DCD4CD" }} />
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        WhatsApp
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.participant_phone}
                      </span>
                    </div>
                    <Separator style={{ backgroundColor: "#DCD4CD" }} />
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Email
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.participant_email}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workshop Details */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Workshop Details
                </h3>
                <Card style={{ backgroundColor: "#FAF7F5" }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Workshop
                      </span>
                      <span
                        className="font-medium text-right"
                        style={{ color: "#3D3935" }}
                      >
                        {workshop.title}
                      </span>
                    </div>
                    <Separator style={{ backgroundColor: "#DCD4CD" }} />
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Duration
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {formatDurationLabel(
                          workshop.sessionCount,
                          workshop.sessionDurationHours,
                        )}
                      </span>
                    </div>
                    <Separator style={{ backgroundColor: "#DCD4CD" }} />
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Preferred Month
                      </span>
                      <span
                        className="font-medium capitalize"
                        style={{ color: "#3D3935" }}
                      >
                        {
                          availableMonths.find(
                            (m) => m.id === bookingData.preferred_month,
                          )?.label
                        }{" "}
                        {
                          availableMonths.find(
                            (m) => m.id === bookingData.preferred_month,
                          )?.year
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Summary */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Payment Summary
                </h3>
                <Card style={{ backgroundColor: "#EADDD5" }}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Base Reservation Fee
                      </span>
                      <span
                        className="text-xl font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        £{workshop.price || ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: "#FAF7F5",
                  borderColor: "#E9CFCA",
                }}
              >
                <p className="text-sm" style={{ color: "#3D3935" }}>
                  <span className="font-medium block mb-1">Important:</span>
                  This payment covers the workshop base reservation fee only.
                  Remaining details and any additional costs will be
                  communicated via WhatsApp.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("participant")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("stripe")}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: "#3D3935",
                    background: "#3D3935",
                    color: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1F1F1F";
                    e.currentTarget.style.background = "#1F1F1F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3D3935";
                    e.currentTarget.style.background = "#3D3935";
                  }}
                >
                  <span
                    style={{
                      background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    Continue to Payment
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 5: Stripe Checkout (Simulated) */}
        {step === "stripe" && (
          <>
            <DialogHeader>
              <DialogTitle>Secure Payment</DialogTitle>
              <DialogDescription>
                Complete your payment to confirm your workshop reservation
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800">Amount to Pay</span>
                    <span className="text-2xl font-semibold text-gray-900">
                      £{workshop.price || ""}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Stripe Checkout Integration
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  In production, this would redirect to Stripe's secure checkout
                  page
                </p>
                <Button
                  onClick={handleStripeCheckout}
                  className="transition-all"
                  style={{
                    backgroundColor: "#3D3935",
                    background: "#3D3935",
                    color: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1F1F1F";
                    e.currentTarget.style.background = "#1F1F1F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3D3935";
                    e.currentTarget.style.background = "#3D3935";
                  }}
                >
                  <span
                    style={{
                      background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    Complete Payment (Demo)
                  </span>
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setStep("review")}
                className="w-full hover:bg-[#DCD4CD]"
              >
                Back
              </Button>
            </div>
          </>
        )}

        {/* Step 6: Success State */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Reservation Confirmed!</DialogTitle>
              <DialogDescription>
                Your workshop spot has been successfully reserved
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#EADDD5" }}
                >
                  <Check style={{ color: "#3D3935" }} size={32} />
                </div>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center pb-3 border-b">
                    <h3 className="text-gray-800 mb-1">Reservation Receipt</h3>
                    <p className="text-sm text-gray-600">#{receiptNumber}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Participant</span>
                      <span className="text-gray-800 font-medium">
                        {bookingData.participant_name}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workshop</span>
                      <span className="text-gray-800 font-medium text-right max-w-[200px]">
                        {workshop.title}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preferred Month</span>
                      <span className="text-gray-800 font-medium capitalize">
                        {
                          availableMonths.find(
                            (m) => m.id === bookingData.preferred_month,
                          )?.label
                        }{" "}
                        {
                          availableMonths.find(
                            (m) => m.id === bookingData.preferred_month,
                          )?.year
                        }
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">WhatsApp</span>
                      <span className="text-gray-800 font-medium">
                        {bookingData.participant_phone}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="text-gray-800 font-medium">
                        {bookingData.participant_email}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-800 font-semibold">
                        Amount Paid
                      </span>
                      <span className="text-gray-900 font-semibold text-lg">
                        £{workshop.price || ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div
                className="p-5 rounded-lg"
                style={{ backgroundColor: "#EADDD5" }}
              >
                <h4 className="font-medium mb-2" style={{ color: "#3D3935" }}>
                  What happens next?
                </h4>
                <ul className="space-y-2 text-sm" style={{ color: "#3D3935" }}>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Booking request received and base payment confirmed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Our team will contact you via WhatsApp with the final
                      workshop schedule
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Additional coordination and remaining payment details (if
                      applicable) will be shared through WhatsApp
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      A confirmation email has been sent to{" "}
                      {bookingData.participant_email}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Close
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: "#3D3935",
                    background: "#3D3935",
                    color: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1F1F1F";
                    e.currentTarget.style.background = "#1F1F1F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3D3935";
                    e.currentTarget.style.background = "#3D3935";
                  }}
                >
                  <span
                    style={{
                      background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    Browse More Workshops
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
