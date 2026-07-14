import { useCallback, useEffect, useState } from "react";
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
import { Calendar } from "./ui/calendar";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "./ui/dropdown";
import { Check, CreditCard, Users, User, ChevronDown } from "lucide-react";
import { Separator } from "./ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { VisuallyHidden } from "./ui/visually-hidden";
import {
  getBookedTimesForDate,
  type BookedTimeSlot,
} from "../src/lib/db/bookings";
import {
  getBusinessHoursForDate,
  BookingStatus,
  PaymentStatus,
} from "../src/schema/booking.schema";
import { createBookingWithTreatments } from "../src/lib/db/booking-with-treatments";
import { createUser, getUserByPhone, updateUser } from "../src/lib/db/users";
import { getActiveServices } from "../src/lib/db/services";
import { getAllDistricts } from "../src/lib/db/districts";
import { formatDate } from "../src/utils/formatDate";
import {
  getWorkshopSessionsByDate,
  getWorkshopTimesForDate,
} from "../src/lib/db/workshop-bookings";

interface BookingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BookingStep =
  | "phone"
  | "address"
  | "people"
  | "service"
  | "date"
  | "time"
  | "confirmation"
  | "voucher"
  | "payment"
  | "receipt";

interface ServiceBooking {
  id: string;
  personNumber: number;
  name: string;
  price: number;
  duration: number;
  addOns?: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
}

interface BookingData {
  name: string;
  countryCode: string;
  phoneNumber: string;
  otpCode: string;
  district: string;
  street: string;
  houseNumber: string;
  numberOfPeople: number;
  services: ServiceBooking[];
  servicePrice: number;
  totalDuration: number;
  date: Date | undefined;
  timeSlot: string;
  voucherCode: string;
  discount: number;
  finalPrice: number;
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

const generateTimeSlots = (
  totalDurationMinutes: number,
  selectedDate?: Date,
) => {
  const slots = [];

  // Get business hours for the selected date
  const date = selectedDate || new Date();
  const { startHour: businessOpenHour, endHour: businessCloseHour } =
    getBusinessHoursForDate(date);

  const gapMinutes = 30; // 30 minutes gap after appointment

  // Total time needed including the appointment and gap
  const totalTimeNeeded = totalDurationMinutes + gapMinutes;

  // Calculate latest possible start time in minutes from midnight
  const businessCloseMinutes = businessCloseHour * 60;
  const latestStartMinutes = businessCloseMinutes - totalTimeNeeded;

  // Generate slots in 30-minute increments
  const businessOpenMinutes = businessOpenHour * 60;

  for (
    let timeInMinutes = businessOpenMinutes;
    timeInMinutes <= latestStartMinutes;
    timeInMinutes += 30
  ) {
    const startHour = Math.floor(timeInMinutes / 60);
    const startMinute = timeInMinutes % 60;
    const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;

    slots.push(startTime);
  }

  return slots;
};

export function BookingFlow({ open, onOpenChange }: BookingFlowProps) {
  const [getTimeSlotsState, setGetTimeSlotsState] = useState({
    isLoading: false,
    hasError: false,
  });
  const [step, setStep] = useState<BookingStep>("phone");
  const [bookingData, setBookingData] = useState<BookingData>({
    name: "",
    countryCode: "uk-44",
    phoneNumber: "",
    otpCode: "",
    district: "",
    street: "",
    houseNumber: "",
    numberOfPeople: 1,
    services: [],
    servicePrice: 0,
    totalDuration: 0,
    date: undefined,
    timeSlot: "",
    voucherCode: "",
    discount: 0,
    finalPrice: 0,
  });
  const [districts, setDistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);

  const [tempUser, setTempUser] = useState(null);
  const [existingUserAddress, setExistingUserAddress] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [selectedServiceForAddOns, setSelectedServiceForAddOns] = useState<{
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null>(null);

  const [tempAddOns, setTempAddOns] = useState<
    Array<{ name: string; price: number; duration: number }>
  >([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<BookedTimeSlot[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceBooking[]>(
    [],
  );
  const [availableAddons, setAvailableAddons] = useState<ServiceBooking[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(false);

  // Payment & Booking Saving State
  const [paymentState, setPaymentState] = useState({
    isSaving: false,
    error: null as string | null,
  });

  const timeSlots = generateTimeSlots(
    bookingData.totalDuration || 60,
    bookingData.date,
  );

  const GAP_MINUTES = 30;

  const minutesFromTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const doesTimeRangeOverlap = (
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ) => startA < endB && startB < endA;

  const isSlotBlocked = (slot: string) => {
    const slotStart = minutesFromTime(slot);
    const slotEnd = slotStart + (bookingData.totalDuration || 60) + GAP_MINUTES;

    return bookedTimeSlots.some((bookedSlot: BookedTimeSlot) => {
      const bookedStart = minutesFromTime(bookedSlot.appointment_time);
      const bookedEnd = bookedStart + bookedSlot.duration + GAP_MINUTES;
      return doesTimeRangeOverlap(slotStart, slotEnd, bookedStart, bookedEnd);
    });
  };

  const availableTimeSlots = bookingData.date
    ? timeSlots.filter((slot) => !isSlotBlocked(slot))
    : timeSlots;

  const loadBookedTimes = useCallback(async () => {
    if (!bookingData.date) {
      setBookedTimeSlots([]);
      return;
    }

    setGetTimeSlotsState({ isLoading: true, hasError: false });

    try {
      const [workshopSlots, slots] = await Promise.all([
        getWorkshopTimesForDate(bookingData.date),
        getBookedTimesForDate(bookingData.date),
      ]);
      console.log("workshopSlots  ==>", workshopSlots);
      console.log("slots ==>", slots);
      setBookedTimeSlots([...workshopSlots, ...slots]);
      setGetTimeSlotsState({
        isLoading: false,
        hasError: false,
      });
    } catch (error) {
      setGetTimeSlotsState({
        isLoading: false,
        hasError: true,
      });
      console.error("Failed to load booked time slots", error);
      setBookedTimeSlots([]);
    }
  }, [bookingData.date]);

  useEffect(() => {
    loadBookedTimes();
  }, [loadBookedTimes]);

  const loadAvailableServices = async () => {
    try {
      setIsServicesLoading(true);
      const services = await getActiveServices();
      console.log("SSSSSSSSSSSs=>", services);
      const mappedServices: ServiceBooking[] = services
        .filter((s) => !s.is_add_on)
        .map((service) => ({
          id: service.id,
          personNumber: 0,
          name: service.name,
          price: service.price,
          duration: service.duration,
          addOns: [],
        }));
      const mappedAddons: ServiceBooking[] = services
        .filter((s) => s.is_add_on)
        .map((service) => ({
          id: service.id,
          personNumber: 0,
          name: service.name,
          price: service.price,
          duration: service.duration,
          addOns: [],
        }));
      setAvailableServices(mappedServices);
      setAvailableAddons(mappedAddons);
    } catch (error) {
      console.error("Failed to load active services:", error);
      setAvailableServices([]);
    } finally {
      setIsServicesLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      setTempUser(null);
    };
  }, []);

  useEffect(() => {
    console.log("step ==>", step);
    if (step === "service") {
      loadAvailableServices();
    } else if (step === "address") {
      getDistricts();
    }
  }, [step]);

  useEffect(() => {
    if (bookingData.date) {
      setBookingData((prev) => ({ ...prev, timeSlot: "" }));
    }
  }, [bookingData.date]);

  const getDistricts = async () => {
    try {
      setIsLoadingDistricts(true);
      const data = await getAllDistricts();

      if (!data) {
        console.warn("No datafound for districts");
        return;
      }

      console.log("Fetched Districts:", data);
      const d = [...data.available, ...data.comingSoon];
      console.log("dddddd=>", d);
      setDistricts([...d]);
      setIsLoadingDistricts(false);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setIsLoadingDistricts(false);
    }
  };

  // Calculate total price and duration
  const calculateTotals = (
    servicesArray: ServiceBooking[],
    peopleCount: number,
  ) => {
    const totalPrice = servicesArray.reduce((sum, service) => {
      const servicePrice = Number(service.price);
      const addOnsPrice =
        service.addOns?.reduce(
          (addOnSum, addOn) => addOnSum + Number(addOn.price),
          0,
        ) || 0;
      return sum + servicePrice + addOnsPrice;
    }, 0);

    const totalServiceDuration = servicesArray.reduce((sum, service) => {
      const serviceDuration = Number(service.duration);
      const addOnsDuration =
        service.addOns?.reduce(
          (addOnSum, addOn) => addOnSum + Number(addOn.duration),
          0,
        ) || 0;
      return sum + serviceDuration + addOnsDuration;
    }, 0);

    // Add 10 min breaks between services for each person
    let serviceLevelBreaks = 0;
    for (let i = 1; i <= peopleCount; i++) {
      const personServices = servicesArray.filter((s) => s.personNumber === i);
      if (personServices.length > 1) {
        serviceLevelBreaks += (personServices.length - 1) * 10;
      }
    }

    // Add 10 min gaps between people if more than one person
    const peopleLevelGaps = peopleCount > 1 ? (peopleCount - 1) * 10 : 0;

    const totalDuration =
      totalServiceDuration + serviceLevelBreaks + peopleLevelGaps;

    return { totalPrice, totalDuration };
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let houseNum = "";
    let streetName = "";
    if (bookingData.phoneNumber && bookingData.otpCode.length === 6) {
      const zipCode =
        countryCodes.find((c) => c.id === bookingData.countryCode)?.code || "";
      // Check if user exists in database
      let existingUser = await getUserByPhone(
        `${zipCode}${bookingData.phoneNumber.replaceAll(" ", "")}`,
      );
      if (existingUser) {
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", existingUser);
        // Autofill user data

        // Parse address like "123 Oxford Street, London, W1D 2HG"
        const addressParts = existingUser.address.split(",");

        if (addressParts.length >= 2) {
          const streetPart = addressParts[0].trim(); // "123 Oxford Street"
          const match = streetPart.match(/^(\d+)\s+(.+)$/);
          if (match) {
            houseNum = match[1]; // "123"
            streetName = match[2]; // "Oxford Street"
          }
        }
        setExistingUserAddress(existingUser.address);
        setBookingData({
          ...bookingData,
          user_id: existingUser.id,
          name: existingUser.full_name,
          address: `${houseNum} ${streetName}`,
        });
      } else {
        setTempUser({
          full_name: "",
          phone: `${zipCode}${bookingData.phoneNumber.replaceAll(" ", "")}`,
          address: "",
          district: "",
          role: "client",
        });
      }

      setStep("address");
    }
  };

  const handleDistrictSelect = (district: string) => {
    setBookingData({ ...bookingData, district });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      bookingData.name &&
      bookingData.district &&
      bookingData.street &&
      bookingData.houseNumber
    ) {
      console.log("tempUser ===>", tempUser);
      if (tempUser) {
        // Create new user
        setIsAddingNewUser(true);
        const existingUser = await createUser({
          full_name: bookingData.name,
          phone: tempUser.phone,
          address: `${bookingData.houseNumber} ${bookingData.street}`,
          district: bookingData.district,
          role: "client",
        });
        setBookingData({
          ...bookingData,
          user_id: existingUser.id,
          name: existingUser.full_name,
        });
        setIsAddingNewUser(false);
        setTempUser(null);
      }
      setStep("people");
    }
  };

  const handlePeopleSubmit = () => {
    setCurrentPersonIndex(0);
    setBookingData({ ...bookingData, services: [] });
    setStep("service");
  };

  const handleServiceClick = (
    serviceId: string,
    name: string,
    price: number,
    duration: number,
  ) => {
    // Open add-ons selection for this service
    setSelectedServiceForAddOns({
      id: serviceId,
      name: name,
      price,
      duration,
    });
    setTempAddOns([]);
  };

  const handleAddOnToggle = (
    addOnId: string,
    addOnName: string,
    addOnPrice: number,
    addOnDuration: number,
  ) => {
    const isSelected = tempAddOns.some((a) => a.id === addOnId);
    if (isSelected) {
      setTempAddOns(tempAddOns.filter((a) => a.id !== addOnId));
    } else {
      setTempAddOns([
        ...tempAddOns,
        {
          name: addOnName,
          price: addOnPrice,
          duration: addOnDuration,
        },
      ]);
    }
  };

  const handleAddServiceWithAddOns = () => {
    if (!selectedServiceForAddOns) return;

    const newService: ServiceBooking = {
      id: selectedServiceForAddOns.id,
      personNumber: currentPersonIndex + 1,
      name: selectedServiceForAddOns.name,
      price: Number(selectedServiceForAddOns.price),
      duration: Number(selectedServiceForAddOns.duration),
      addOns: tempAddOns.length > 0 ? tempAddOns : [],
    };

    const updatedServices = [...bookingData.services, newService];
    const { totalPrice, totalDuration } = calculateTotals(
      updatedServices,
      bookingData.numberOfPeople,
    );

    setBookingData({
      ...bookingData,
      services: updatedServices,
      servicePrice: totalPrice,
      totalDuration: totalDuration,
      finalPrice: totalPrice,
    });

    // Reset add-ons selection
    setSelectedServiceForAddOns(null);
    setTempAddOns([]);
  };

  const handleAddServiceWithoutAddOns = () => {
    if (!selectedServiceForAddOns) return;

    const newService: ServiceBooking = {
      id: selectedServiceForAddOns.id,
      personNumber: currentPersonIndex + 1,
      name: selectedServiceForAddOns.name,
      price: Number(selectedServiceForAddOns.price),
      duration: Number(selectedServiceForAddOns.duration),
      addOns: undefined, // Explicitly no add-ons
    };

    const updatedServices = [...bookingData.services, newService];
    const { totalPrice, totalDuration } = calculateTotals(
      updatedServices,
      bookingData.numberOfPeople,
    );

    setBookingData({
      ...bookingData,
      services: updatedServices,
      servicePrice: totalPrice,
      totalDuration: totalDuration,
      finalPrice: totalPrice,
    });

    // Reset add-ons selection
    setSelectedServiceForAddOns(null);
    setTempAddOns([]);
  };

  const handleCancelAddOns = () => {
    // Add the service without add-ons
    handleAddServiceWithoutAddOns();
  };

  const handleContinueToNextPerson = () => {
    // Check if current person has at least one service selected
    const currentPersonServices = bookingData.services.filter(
      (s) => s.personNumber === currentPersonIndex + 1,
    );

    if (currentPersonServices.length === 0) {
      return; // Don't proceed if no service selected
    }

    // Check if we need to select service for more people
    if (currentPersonIndex + 1 < bookingData.numberOfPeople) {
      setCurrentPersonIndex(currentPersonIndex + 1);
    } else {
      setStep("date");
    }
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = bookingData.services.filter((_, i) => i !== index);
    const { totalPrice, totalDuration } = calculateTotals(
      updatedServices,
      bookingData.numberOfPeople,
    );

    setBookingData({
      ...bookingData,
      services: updatedServices,
      servicePrice: totalPrice,
      totalDuration: totalDuration,
      finalPrice: totalPrice,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    console.log("selectedDate", date);
    setBookingData({ ...bookingData, date: date });
    if (date) {
      setStep("time");
    }
  };

  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, timeSlot: time });
  };

  const handleConfirmBooking = () => {
    setStep("payment");
  };

  const handleApplyVoucher = () => {
    const voucher = bookingData.voucherCode.toUpperCase().trim();

    const validVouchers: { [key: string]: number } = {
      WELCOME10: 10,
      FIRST20: 20,
      LOYAL15: 15,
      SPECIAL25: 25,
      VIP30: 30,
    };

    if (voucher && validVouchers[voucher]) {
      const discountPercent = validVouchers[voucher];
      const discountAmount = (bookingData.servicePrice * discountPercent) / 100;
      const finalPrice = bookingData.servicePrice - discountAmount;

      // Check if replacing an existing voucher
      if (appliedVoucherCode && appliedVoucherCode !== voucher) {
        setVoucherSuccess(
          `Voucher ${voucher} applied! Previous voucher ${appliedVoucherCode} has been replaced.`,
        );
      } else {
        setVoucherSuccess(
          `Voucher ${voucher} applied successfully! You saved £${discountAmount.toFixed(2)}`,
        );
      }

      setBookingData({
        ...bookingData,
        discount: discountAmount,
        finalPrice: finalPrice,
      });
      setAppliedVoucherCode(voucher);
      setVoucherError("");
    } else if (voucher) {
      setVoucherError("Invalid voucher code. Please check and try again.");
      setVoucherSuccess("");
    }
  };

  const handleSkipVoucher = () => {
    setBookingData({
      ...bookingData,
      voucherCode: "",
      discount: 0,
      finalPrice: bookingData.servicePrice,
    });
    setVoucherError("");
    setVoucherSuccess("");
    setAppliedVoucherCode("");
    setStep("confirmation");
  };

  const handleContinueWithVoucher = () => {
    if (bookingData.discount > 0 || !bookingData.voucherCode) {
      setStep("confirmation");
    }
  };

  const handlePaymentComplete = async () => {
    setPaymentState({ isSaving: true, error: null });

    try {
      // Step 1: Prepare booking and treatments data
      console.log(
        "bookingData.date step1 ===>",
        bookingData.date.toISOString(),
      );
      const appointmentDate = formatDate(bookingData.date);

      if (bookingData.services.length === 0) {
        throw new Error("No services selected");
      }

      // Use first service as the booking's service_id (required field)
      // In a production app, you might use a "booking" service type or handle this differently

      // Prepare treatments for each service in the booking
      const treatments = bookingData.services.map((service, index) => ({
        service_id: service.id, // All treatments reference the default ID (ideally should map to actual service IDs)
        person_name:
          bookingData.numberOfPeople > 1
            ? `Person ${service.personNumber}`
            : bookingData.name,
        service_name: service.name,
        price: service.price,
        duration: service.duration,
        addOns: service?.addOns || [],
      }));

      console.log("📝 Creating booking with treatments:", {
        userId: bookingData.user_id,
        servicesCount: treatments.length,
        totalPrice:
          bookingData.discount > 0
            ? bookingData.finalPrice
            : bookingData.servicePrice,
      });

      // Step 2: Create booking with treatments
      const { booking, treatmentsCreated } = await createBookingWithTreatments({
        booking: {
          user_id: bookingData.user_id,
          appointment_date: appointmentDate,
          appointment_time: bookingData.timeSlot,
          address: `${bookingData.houseNumber} ${bookingData.street}`,
          district: bookingData.district,
          status: BookingStatus.CONFIRMED,
          payment_status: PaymentStatus.PAID,
          discount_amount: bookingData.discount,
          people_numbers: bookingData.numberOfPeople,
          balance_amount: 0,
          tax_amount: 0,
          currency: "£",
          subtotal_amount: bookingData.servicePrice,
          total_amount: bookingData.servicePrice - bookingData.discount,
          notes: `${bookingData.numberOfPeople} person(s). Services: ${bookingData.services.map((s) => s.name).join(", ")}. ${bookingData.voucherCode ? `Voucher: ${bookingData.voucherCode}` : ""}`,
        },
        treatments,
      });

      await updateUser({
        id: bookingData.user_id,
        full_name: bookingData.name,
        address: `${bookingData.houseNumber} ${bookingData.street}, ${bookingData.district}`,
        district: bookingData.district,
      });

      console.log("✅ Booking saved successfully:", {
        bookingId: booking.id,
        treatmentsCreated,
      });

      // Step 3: Generate receipt and show success
      const receipt = `REC-${booking.id.slice(0, 8).toUpperCase()}`;
      setReceiptNumber(receipt);
      setPaymentState({ isSaving: false, error: null });
      setStep("receipt");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save booking";
      console.error("❌ Payment error:", error);
      setPaymentState({
        isSaving: false,
        error: errorMessage,
      });
    }
  };

  const handleClose = () => {
    setStep("phone");
    setBookingData({
      name: "",
      countryCode: "uk-44",
      phoneNumber: "",
      otpCode: "",
      district: "",
      street: "",
      houseNumber: "",
      numberOfPeople: 1,
      services: [],
      servicePrice: 0,
      totalDuration: 0,
      date: undefined,
      timeSlot: "",
      voucherCode: "",
      discount: 0,
      finalPrice: 0,
    });
    setCurrentPersonIndex(0);
    setReceiptNumber("");
    setVoucherError("");
    setVoucherSuccess("");
    setAppliedVoucherCode("");
    onOpenChange(false);
  };

  console.log("bookingData ===>", bookingData);
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${step === "date" ? "max-w-4xl" : "max-w-2xl"}`}
        style={{ backgroundColor: "#FEFCFA" }}
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Booking Flow</DialogTitle>
            <DialogDescription>
              Complete your booking in a few simple steps
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        {/* Step 1: Phone & OTP */}
        {step === "phone" && (
          <>
            <DialogHeader>
              <DialogTitle>Phone Verification</DialogTitle>
              <DialogDescription>
                Enter your phone number to get started
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePhoneSubmit} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select
                    value={bookingData.countryCode}
                    onValueChange={(value) => {
                      console.log("Country", value);
                      setBookingData({
                        ...bookingData,
                        countryCode: value,
                      });
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
                    value={bookingData.phoneNumber}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="flex-1"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  We'll send you a verification code to confirm your booking
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={bookingData.otpCode}
                    onChange={(value) =>
                      setBookingData({
                        ...bookingData,
                        otpCode: value,
                      })
                    }
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
              <Button
                type="submit"
                className="w-full transition-all"
                style={{
                  backgroundColor:
                    bookingData.otpCode.length === 6 ? "#3D3935" : "#DCD4CD",
                  background:
                    bookingData.otpCode.length === 6 ? "#3D3935" : "#DCD4CD",
                  color:
                    bookingData.otpCode.length === 6
                      ? "transparent"
                      : "#3D3935",
                  cursor:
                    bookingData.otpCode.length === 6
                      ? "pointer"
                      : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (bookingData.otpCode.length === 6) {
                    e.currentTarget.style.backgroundColor = "#1F1F1F";
                    e.currentTarget.style.background = "#1F1F1F";
                  }
                }}
                onMouseLeave={(e) => {
                  if (bookingData.otpCode.length === 6) {
                    e.currentTarget.style.backgroundColor = "#3D3935";
                    e.currentTarget.style.background = "#3D3935";
                  }
                }}
                disabled={bookingData.otpCode.length !== 6}
              >
                {bookingData.otpCode.length === 6 ? (
                  <span
                    style={{
                      background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
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
            </form>
          </>
        )}

        {/* Step 2: Address Selection */}
        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Your Location</DialogTitle>
              <DialogDescription>
                {existingUserAddress
                  ? "We've pre-filled your saved address. You can edit it if you'd like to use a different location."
                  : "Enter your details and choose your location in London"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Lara Smith"
                  value={bookingData.name}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      name: e.target.value,
                    })
                  }
                  required
                />
                {existingUserAddress && (
                  <p className="text-sm text-green-600">
                    ✓ Welcome back! We've found your account.
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="mb-3 block">Select District</Label>
                {isLoadingDistricts ? (
                  <div className="flex justify-center py-8">
                    <span className="text-sm text-gray-500">
                      ⏳ Loading Districts...
                    </span>
                  </div>
                ) : (
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        style={{
                          backgroundColor: "#FEFCFA",
                          borderColor: "#DCD4CD",
                          color: "#3D3935",
                        }}
                      >
                        <span>
                          {bookingData.district || "Choose a district"}
                        </span>
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent className="w-full min-w-[12rem] bg-white border border-gray-200 p-1">
                      {districts.map((district) => (
                        <DropdownItem
                          key={district.id}
                          disabled={district.is_coming_soon}
                          onSelect={() =>
                            !district.is_coming_soon &&
                            handleDistrictSelect(district.name)
                          }
                          className={`flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm transition-all ${
                            bookingData.district === district.name
                              ? "bg-[#EADDD5] text-[#3D3935]"
                              : "text-[#3D3935] hover:bg-[#F4E8E1]"
                          } ${!district.is_coming_soon ? "" : "opacity-50 cursor-not-allowed"}`}
                          style={{
                            backgroundColor:
                              bookingData.district === district.name
                                ? "#EADDD5"
                                : undefined,
                          }}
                        >
                          <span>{district.name}</span>
                          {district.is_coming_soon && (
                            <span className="text-xs text-gray-500">
                              Unavailable
                            </span>
                          )}
                        </DropdownItem>
                      ))}
                    </DropdownContent>
                  </Dropdown>
                )}

                <p className="text-xs text-gray-500 mb-4">
                  Service available in central London districts only
                </p>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="houseNumber">Number</Label>
                    <Input
                      id="houseNumber"
                      type="text"
                      placeholder="123"
                      value={bookingData.houseNumber}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          houseNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="Baker Street"
                      value={bookingData.street}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          street: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {bookingData.district && (
                  <div
                    className="p-3 rounded border"
                    style={{
                      backgroundColor: "#FAF7F5",
                      borderColor: "#DCD4CD",
                    }}
                  >
                    <p className="text-sm" style={{ color: "#3D3935" }}>
                      <span
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Selected address:
                      </span>{" "}
                      {bookingData.houseNumber || "___"}{" "}
                      {bookingData.street || "___"}, {bookingData.district}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("phone")}
                    className="flex-1 hover:bg-[#DCD4CD]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 transition-all"
                    style={{
                      backgroundColor:
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                          ? "#3D3935"
                          : "#DCD4CD",
                      background:
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                          ? "#3D3935"
                          : "#DCD4CD",
                      color:
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                          ? "transparent"
                          : "#3D3935",
                      cursor:
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                          ? "pointer"
                          : "not-allowed",
                    }}
                    onMouseEnter={(e) => {
                      if (
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                      ) {
                        e.currentTarget.style.backgroundColor = "#1F1F1F";
                        e.currentTarget.style.background = "#1F1F1F";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (
                        bookingData.name &&
                        bookingData.district &&
                        bookingData.street &&
                        bookingData.houseNumber
                      ) {
                        e.currentTarget.style.backgroundColor = "#3D3935";
                        e.currentTarget.style.background = "#3D3935";
                      }
                    }}
                    disabled={
                      isAddingNewUser ||
                      !bookingData.name ||
                      !bookingData.district ||
                      !bookingData.street ||
                      !bookingData.houseNumber
                    }
                  >
                    {bookingData.name &&
                    bookingData.district &&
                    bookingData.street &&
                    bookingData.houseNumber ? (
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
                        {isAddingNewUser ? "Laoding..." : "Continue"}
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Step 3: Number of People */}
        {step === "people" && (
          <>
            <DialogHeader>
              <DialogTitle>Number of People</DialogTitle>
              <DialogDescription>
                How many people will be receiving nail services?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="flex items-center justify-center">
                <Users className="w-12 h-12 text-[#DCD4CD]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  max="10"
                  value={bookingData.numberOfPeople}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      numberOfPeople: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full text-center text-lg"
                  autoFocus
                />
                <p className="text-sm text-gray-500 text-center">
                  You'll select a service for each person
                </p>
              </div>

              <div
                className="p-4 rounded-md border"
                style={{
                  backgroundColor: "#FAF7F5",
                  borderColor: "#E9CFCA",
                }}
              >
                <p className="text-sm" style={{ color: "#3D3935" }}>
                  <span className="font-medium">Note:</span> For multiple
                  people, a 10-minute gap will be added between each service to
                  ensure smooth scheduling.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("address")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePeopleSubmit}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor:
                      bookingData.numberOfPeople >= 1 ? "#3D3935" : "#DCD4CD",
                    background:
                      bookingData.numberOfPeople >= 1 ? "#3D3935" : "#DCD4CD",
                    color:
                      bookingData.numberOfPeople >= 1
                        ? "transparent"
                        : "#3D3935",
                    cursor:
                      bookingData.numberOfPeople >= 1
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (bookingData.numberOfPeople >= 1) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (bookingData.numberOfPeople >= 1) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                      e.currentTarget.style.background = "#3D3935";
                    }
                  }}
                  disabled={bookingData.numberOfPeople < 1}
                >
                  {bookingData.numberOfPeople >= 1 ? (
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

        {/* Step 4: Service Selection */}
        {step === "service" && (
          <>
            <DialogHeader>
              <DialogTitle>
                Choose Services for Person {currentPersonIndex + 1} of{" "}
                {bookingData.numberOfPeople}
              </DialogTitle>
              <DialogDescription>
                Select one or more services for{" "}
                {bookingData.numberOfPeople > 1
                  ? `person ${currentPersonIndex + 1}`
                  : "yourself"}
                . Click a service to add it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
              {/* Current Person's Services */}
              {bookingData.services.filter(
                (s) => s.personNumber === currentPersonIndex + 1,
              ).length > 0 && (
                <Card
                  style={{
                    backgroundColor: "#FAF7F5",
                    borderColor: "#DCD4CD",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Check style={{ color: "#3D3935" }} size={18} />
                      <p
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          fontWeight: "bold",
                        }}
                      >
                        Selected for Person {currentPersonIndex + 1}:
                      </p>
                    </div>
                    <div className="space-y-2">
                      {bookingData.services
                        .map((service, index) => ({
                          service,
                          originalIndex: index,
                        }))
                        .filter(
                          ({ service }) =>
                            service.personNumber === currentPersonIndex + 1,
                        )
                        .map(({ service, originalIndex }) => {
                          const serviceTotal =
                            service.price +
                            (service.addOns?.reduce(
                              (sum, a) => sum + a.price,
                              0,
                            ) || 0);
                          const serviceDuration =
                            service.duration +
                            (service.addOns?.reduce(
                              (sum, a) => sum + a.duration,
                              0,
                            ) || 0);

                          return (
                            <div
                              key={originalIndex}
                              className="p-3 rounded border"
                              style={{
                                backgroundColor: "#FEFCFA",
                                borderColor: "#DCD4CD",
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">
                                    {service.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {serviceDuration} min
                                  </p>
                                  {service.addOns &&
                                    service.addOns.length > 0 && (
                                      <div className="mt-1.5 space-y-0.5">
                                        {service.addOns.map((addOn, i) => (
                                          <p
                                            key={i}
                                            className="text-xs"
                                            style={{
                                              color: "#3D3935",
                                            }}
                                          >
                                            + {addOn.name} (£
                                            {addOn.price})
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-800">
                                    £{serviceTotal}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveService(originalIndex)
                                    }
                                    className="h-8 px-2"
                                    style={{ color: "#3D3935" }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = "#D0A096";
                                      e.currentTarget.style.backgroundColor =
                                        "#FAF7F5";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = "#3D3935";
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Selection */}
              {!selectedServiceForAddOns && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Available Services - Click to select:
                  </p>
                  <div className="space-y-2">
                    {isServicesLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="text-sm text-gray-500">
                          ⏳ Loading services...
                        </span>
                      </div>
                    ) : availableServices.length === 0 ? (
                      <div
                        className="rounded-md border p-4 text-center text-sm"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FAF7F5",
                          color: "#3D3935",
                        }}
                      >
                        No active services available.
                      </div>
                    ) : (
                      availableServices.map((service) => {
                        const currentPersonServices =
                          bookingData.services.filter(
                            (s) => s.personNumber === currentPersonIndex + 1,
                          );
                        const isAlreadySelected = currentPersonServices.some(
                          (s) => s.name === service.name,
                        );

                        return (
                          <div
                            key={service.name}
                            className={`border rounded p-3 transition-all ${
                              isAlreadySelected
                                ? "opacity-50 cursor-not-allowed border-[#E9CFCA]"
                                : "cursor-pointer hover:border-[#E9CFCA] border-[#DCD4CD]"
                            }`}
                            style={
                              isAlreadySelected
                                ? { backgroundColor: "#FAF7F5" }
                                : {}
                            }
                            onMouseEnter={(e) => {
                              if (
                                !isAlreadySelected &&
                                !selectedServiceForAddOns
                              ) {
                                e.currentTarget.style.backgroundColor =
                                  "#EADDD5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                !isAlreadySelected &&
                                !selectedServiceForAddOns
                              ) {
                                e.currentTarget.style.backgroundColor = "";
                              }
                            }}
                            onClick={() => {
                              if (
                                !isAlreadySelected &&
                                !selectedServiceForAddOns
                              ) {
                                handleServiceClick(
                                  service.id,
                                  service.name,
                                  service.price,
                                  service.duration,
                                );
                              }
                            }}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-sm"
                                    style={{ color: "#3D3935" }}
                                  >
                                    {service.name}
                                  </span>
                                  {isAlreadySelected && (
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        backgroundColor: "#E9CFCA",
                                        color: "#3D3935",
                                      }}
                                    >
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {service.duration} min
                                </p>
                              </div>
                              <div
                                className="text-sm flex-shrink-0"
                                style={{ color: "#3D3935" }}
                              >
                                £{service.price}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Add-Ons Selection for Selected Service */}
              {selectedServiceForAddOns && availableAddons.length > 0 && (
                <div className="pt-3 border-t">
                  <Card
                    style={{
                      backgroundColor: "#EADDD5",
                      borderColor: "#E9CFCA",
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-900">
                          Adding:{" "}
                          <span className="font-medium">
                            {selectedServiceForAddOns.name}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Select optional add-ons for this service:
                        </p>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-2 mb-3">
                        {availableAddons.map((addOn) => {
                          const isSelected = tempAddOns.some(
                            (a) => a.name === addOn.name,
                          );

                          return (
                            <div
                              key={addOn.name}
                              className={`border rounded p-3 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-[#E9CFCA]"
                                  : "hover:border-[#E9CFCA] border-[#DCD4CD]"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: "#FAF7F5",
                                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                    }
                                  : {
                                      backgroundColor: "#FEFCFA",
                                    }
                              }
                              onClick={() =>
                                handleAddOnToggle(
                                  addOn.id,
                                  addOn.name,
                                  addOn.price,
                                  addOn.duration,
                                )
                              }
                            >
                              <div className="flex justify-between items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="text-sm"
                                      style={{
                                        color: "#3D3935",
                                      }}
                                    >
                                      {addOn.name}
                                    </span>
                                    {isSelected && (
                                      <Check
                                        className="h-4 w-4"
                                        style={{
                                          color: "#3D3935",
                                        }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {addOn.duration} min
                                  </p>
                                </div>
                                <div
                                  className="text-sm flex-shrink-0"
                                  style={{ color: "#3D3935" }}
                                >
                                  £{addOn.price}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddServiceWithAddOns}
                          className="flex-1 transition-all"
                          style={{
                            backgroundColor: "#3D3935",
                            color: "#E9CFCA",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#D0A096";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#E9CFCA";
                          }}
                        >
                          Add Service
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelAddOns}
                          className="flex-1 hover:bg-[#DCD4CD]"
                        >
                          Without add-ons
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!selectedServiceForAddOns && (
              <div className="flex gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentPersonIndex > 0) {
                      setCurrentPersonIndex(currentPersonIndex - 1);
                    } else {
                      setStep("people");
                    }
                  }}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinueToNextPerson}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor:
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                        ? "#3D3935"
                        : "#DCD4CD",
                    background:
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                        ? "#3D3935"
                        : "#DCD4CD",
                    color:
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                        ? "transparent"
                        : "#3D3935",
                    cursor:
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                    ) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      bookingData.services.filter(
                        (s) => s.personNumber === currentPersonIndex + 1,
                      ).length > 0
                    ) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                      e.currentTarget.style.background = "#3D3935";
                    }
                  }}
                  disabled={
                    bookingData.services.filter(
                      (s) => s.personNumber === currentPersonIndex + 1,
                    ).length === 0
                  }
                >
                  {bookingData.services.filter(
                    (s) => s.personNumber === currentPersonIndex + 1,
                  ).length > 0 ? (
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
                      {currentPersonIndex + 1 < bookingData.numberOfPeople
                        ? `Continue to Person ${currentPersonIndex + 2}`
                        : "Continue to Date Selection"}
                    </span>
                  ) : currentPersonIndex + 1 < bookingData.numberOfPeople ? (
                    `Continue to Person ${currentPersonIndex + 2}`
                  ) : (
                    "Continue to Date Selection"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 5: Date Selection */}
        {step === "date" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Date</DialogTitle>
              <DialogDescription>
                Choose your preferred appointment date
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {/* Minimal Summary */}
              <div
                className="mb-4 p-3 rounded border-2"
                style={{
                  backgroundColor: "#DCD4CD",
                  borderColor: "#3D3935",
                }}
              >
                <div className="text-xs space-y-1">
                  {Array.from(
                    { length: bookingData.numberOfPeople },
                    (_, i) => {
                      const personServices = bookingData.services.filter(
                        (s) => s.personNumber === i + 1,
                      );
                      return (
                        <div
                          key={i}
                          className="text-gray-600 flex items-start gap-2"
                        >
                          <User className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
                          <span>
                            {bookingData.numberOfPeople > 1 && (
                              <span className="text-gray-900">P{i + 1}: </span>
                            )}
                            {personServices.map((s) => s.name).join(", ")}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Overall Total */}
              <div
                className="mb-4 p-2 rounded"
                style={{
                  backgroundColor: "#3D3935",
                  color: "#FEFCFA",
                }}
              >
                <div className="text-xs flex justify-between items-center">
                  <span>
                    {bookingData.services.length} service
                    {bookingData.services.length > 1 ? "s" : ""} ·{" "}
                    {bookingData.totalDuration} min
                  </span>
                  <span>£{bookingData.servicePrice}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={bookingData.date}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="rounded-lg border border-gray-200"
                  style={{ backgroundColor: "#FEFCFA" }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPersonIndex(bookingData.numberOfPeople - 1);
                setStep("service");
              }}
              className="w-full hover:bg-[#DCD4CD]"
            >
              Back
            </Button>
          </>
        )}

        {/* Step 6: Time Slot Selection */}
        {step === "time" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Time Slot</DialogTitle>
              <DialogDescription>
                Pick an available time for your appointment
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div
                className="mb-4 p-3 rounded border"
                style={{
                  backgroundColor: "#FAF7F5",
                  borderColor: "#DCD4CD",
                }}
              >
                <p className="text-sm" style={{ color: "#3D3935" }}>
                  {bookingData.numberOfPeople > 1 ? (
                    <>
                      <span className="font-medium block mb-2">
                        Appointment Schedule:
                      </span>
                      {bookingData.timeSlot ? (
                        Array.from(
                          {
                            length: bookingData.numberOfPeople,
                          },
                          (_, index) => {
                            const personServices = bookingData.services.filter(
                              (s) => s.personNumber === index + 1,
                            );
                            const personDuration = personServices.reduce(
                              (total, service) => {
                                return total + service.duration;
                              },
                              0,
                            );

                            // Calculate start time for this person (including 5-min gaps)
                            const GAP_MINUTES = 5;
                            const previousDuration = bookingData.services
                              .filter((s) => s.personNumber < index + 1)
                              .reduce(
                                (total, service) => total + service.duration,
                                0,
                              );
                            const previousGaps = index * GAP_MINUTES;

                            const [hours, minutes] =
                              bookingData.timeSlot.split(":");
                            const startDate = new Date();
                            startDate.setHours(
                              parseInt(hours),
                              parseInt(minutes) +
                                previousDuration +
                                previousGaps,
                              0,
                            );
                            const startTime = startDate.toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            );

                            // Calculate end time
                            const endDate = new Date(startDate);
                            endDate.setMinutes(
                              endDate.getMinutes() + personDuration,
                            );
                            const endTime = endDate.toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            );

                            return (
                              <span
                                key={index}
                                className="block flex items-center gap-1"
                              >
                                <User size={16} style={{ color: "#3D3935" }} />
                                {index + 1}: {startTime} - {endTime} (
                                {personDuration} min)
                              </span>
                            );
                          },
                        )
                      ) : (
                        <span className="block text-gray-500 italic">
                          Select a time to see the schedule
                        </span>
                      )}
                      <span className="block mt-2 font-medium">
                        Total Duration: {bookingData.totalDuration} minutes (
                        {Math.floor(bookingData.totalDuration / 60)}h{" "}
                        {bookingData.totalDuration % 60}m)
                      </span>
                    </>
                  ) : (
                    <>
                      {bookingData.timeSlot ? (
                        <>
                          Your appointment:{" "}
                          <span className="font-medium">
                            {bookingData.timeSlot}
                          </span>{" "}
                          -{" "}
                          <span className="font-medium">
                            {(() => {
                              const [hours, minutes] =
                                bookingData.timeSlot.split(":");
                              const endDate = new Date();
                              endDate.setHours(
                                parseInt(hours),
                                parseInt(minutes) + bookingData.totalDuration,
                                0,
                              );
                              return endDate.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              });
                            })()}
                          </span>{" "}
                          ({bookingData.totalDuration} min)
                        </>
                      ) : (
                        <>
                          Your appointment will take approximately{" "}
                          <span className="font-medium">
                            {bookingData.totalDuration} minutes
                          </span>{" "}
                          ({Math.floor(bookingData.totalDuration / 60)}h{" "}
                          {bookingData.totalDuration % 60}m)
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Available times for{" "}
                {bookingData.date?.toLocaleDateString("en-GB")}
              </p>
              <div className="mb-4">
                {getTimeSlotsState.isLoading ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                    Loading available times…
                  </div>
                ) : getTimeSlotsState.hasError ? (
                  <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                    <p>Unable to load available times.</p>
                    <Button
                      type="button"
                      onClick={loadBookedTimes}
                      className="mx-auto"
                    >
                      Try again
                    </Button>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    No available time slots found for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        onClick={() => handleTimeSelect(time)}
                        className={`transition-colors ${bookingData.timeSlot === time ? "border-[#E9CFCA]" : ""}`}
                        style={
                          bookingData.timeSlot === time
                            ? { backgroundColor: "#E9CFCA" }
                            : {}
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#E9CFCA";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            bookingData.timeSlot === time ? "#E9CFCA" : "";
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingData({
                      ...bookingData,
                      timeSlot: "",
                    });
                    setStep("date");
                  }}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("voucher")}
                  disabled={!bookingData.timeSlot}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: bookingData.timeSlot
                      ? "#3D3935"
                      : "#DCD4CD",
                    background: bookingData.timeSlot ? "#3D3935" : "#DCD4CD",
                    color: bookingData.timeSlot ? "transparent" : "#3D3935",
                    cursor: bookingData.timeSlot ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (bookingData.timeSlot) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (bookingData.timeSlot) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                      e.currentTarget.style.background = "#3D3935";
                    }
                  }}
                >
                  {bookingData.timeSlot ? (
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

        {/* Step 7: Gift Voucher */}
        {step === "voucher" && (
          <>
            <DialogHeader>
              <DialogTitle>Apply Gift Voucher</DialogTitle>
              <DialogDescription>
                Have a gift voucher? Enter the code below to get a discount
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <Card style={{ backgroundColor: "#FAF7F5" }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Service Price</span>
                    <span className="text-gray-800">
                      £{bookingData.servicePrice}
                    </span>
                  </div>
                  {bookingData.discount > 0 && (
                    <>
                      <div
                        className="flex items-center justify-between mb-2"
                        style={{ color: "#3D3935" }}
                      >
                        <span>Discount Applied</span>
                        <span>-£{bookingData.discount.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800">Final Price</span>
                          <span className="text-gray-800">
                            £{bookingData.finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucherCode">Voucher Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="voucherCode"
                      type="text"
                      placeholder="Enter voucher code"
                      value={bookingData.voucherCode}
                      onChange={(e) => {
                        setBookingData({
                          ...bookingData,
                          voucherCode: e.target.value,
                        });
                        setVoucherError("");
                        setVoucherSuccess("");
                      }}
                      className="flex-1 uppercase"
                    />
                    <Button
                      onClick={handleApplyVoucher}
                      variant="outline"
                      className="whitespace-nowrap hover:bg-[#DCD4CD]"
                      disabled={!bookingData.voucherCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {voucherError && (
                    <div
                      className="p-3 rounded border"
                      style={{
                        backgroundColor: "#FAF7F5",
                        borderColor: "#D0A096",
                      }}
                    >
                      <p className="text-sm" style={{ color: "#D0A096" }}>
                        {voucherError}
                      </p>
                    </div>
                  )}
                  {voucherSuccess && (
                    <div
                      className="flex items-center gap-2 p-3 rounded border"
                      style={{
                        backgroundColor: "#E9CFCA",
                        borderColor: "#DCD4CD",
                      }}
                    >
                      <Check style={{ color: "#3D3935" }} size={20} />
                      <p className="text-sm" style={{ color: "#3D3935" }}>
                        {voucherSuccess}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="p-4 rounded border"
                  style={{
                    backgroundColor: "#DCD4CD",
                    borderColor: "#DCD4CD",
                  }}
                >
                  <p className="text-xs mb-2" style={{ color: "#3D3935" }}>
                    Try these demo codes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                      style={{ backgroundColor: "#FEFCFA" }}
                    >
                      WELCOME10
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                      style={{ backgroundColor: "#FEFCFA" }}
                    >
                      FIRST20
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                      style={{ backgroundColor: "#FEFCFA" }}
                    >
                      LOYAL15
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                      style={{ backgroundColor: "#FEFCFA" }}
                    >
                      SPECIAL25
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                      style={{ backgroundColor: "#FEFCFA" }}
                    >
                      VIP30
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("time")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSkipVoucher}
                  variant="outline"
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleContinueWithVoucher}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: "#3D3935",
                    background: "#3D3935",
                    color: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      !(
                        bookingData.voucherCode.trim() !== "" &&
                        bookingData.discount === 0
                      )
                    ) {
                      e.currentTarget.style.backgroundColor = "#1F1F1F";
                      e.currentTarget.style.background = "#1F1F1F";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3D3935";
                    e.currentTarget.style.background = "#3D3935";
                  }}
                  disabled={
                    bookingData.voucherCode.trim() !== "" &&
                    bookingData.discount === 0
                  }
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
                    Continue
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 8: Confirmation */}
        {step === "confirmation" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Your Booking</DialogTitle>
              <DialogDescription>
                Review your appointment details before proceeding to payment
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Personal Information
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
                        {bookingData.name}
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
                        Phone
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {
                          countryCodes.find(
                            (c) => c.id === bookingData.countryCode,
                          )?.code
                        }{" "}
                        {bookingData.phoneNumber}
                      </span>
                    </div>
                    <Separator style={{ backgroundColor: "#DCD4CD" }} />
                    <div className="flex justify-between items-start">
                      <span
                        className="text-sm"
                        style={{
                          color: "#3D3935",
                          opacity: 0.7,
                        }}
                      >
                        Address
                      </span>
                      <span
                        className="font-medium text-right max-w-[200px]"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.houseNumber} {bookingData.street},{" "}
                        {bookingData.district}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Appointment Details Section */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Appointment Details
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
                        Date
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.date?.toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
                        Time
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.timeSlot}
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
                        {Math.floor(bookingData.totalDuration / 60)}h{" "}
                        {bookingData.totalDuration % 60}m
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
                        People
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        {bookingData.numberOfPeople}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Services
                </h3>
                <Card style={{ backgroundColor: "#FAF7F5" }}>
                  <CardContent className="p-5 space-y-3">
                    {bookingData.services.map((service, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start py-2">
                          <div className="flex-1">
                            <p
                              className="font-medium mb-1"
                              style={{ color: "#3D3935" }}
                            >
                              {bookingData.numberOfPeople > 1 && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded mr-2"
                                  style={{
                                    backgroundColor: "#E9CFCA",
                                    color: "#3D3935",
                                  }}
                                >
                                  Person {service.personNumber}
                                </span>
                              )}
                              {service.name}
                            </p>
                            {service.addOns && service.addOns.length > 0 && (
                              <div className="ml-4 mt-2 space-y-1">
                                {service.addOns.map((addOn, addOnIndex) => (
                                  <div key={addOnIndex} className="text-sm">
                                    <span
                                      style={{
                                        color: "#3D3935",
                                        opacity: 0.6,
                                      }}
                                    >
                                      + {addOn.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            <span
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              £{service.price}
                            </span>
                            {service.addOns &&
                              service.addOns.length > 0 &&
                              service.addOns.map((addOn, addOnIndex) => (
                                <span
                                  key={addOnIndex}
                                  className="text-sm"
                                  style={{
                                    color: "#3D3935",
                                    opacity: 0.6,
                                  }}
                                >
                                  £{addOn.price}
                                </span>
                              ))}
                          </div>
                        </div>
                        {index < bookingData.services.length - 1 && (
                          <Separator
                            style={{
                              backgroundColor: "#DCD4CD",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Price Summary Section */}
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#3D3935" }}
                >
                  Price Summary
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
                        Subtotal
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "#3D3935" }}
                      >
                        £{bookingData.servicePrice.toFixed(2)}
                      </span>
                    </div>
                    {bookingData.discount > 0 && (
                      <>
                        <Separator style={{ backgroundColor: "#DCD4CD" }} />
                        <div className="flex justify-between items-center">
                          <span
                            className="text-sm"
                            style={{
                              color: "#3D3935",
                              opacity: 0.7,
                            }}
                          >
                            Voucher ({bookingData.voucherCode})
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: "#D0A096" }}
                          >
                            -£{bookingData.discount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <Separator
                      style={{
                        backgroundColor: "#DCD4CD",
                        height: "2px",
                      }}
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span
                        className="font-semibold text-lg"
                        style={{ color: "#3D3935" }}
                      >
                        Total
                      </span>
                      <span
                        className="font-semibold text-lg"
                        style={{ color: "#3D3935" }}
                      >
                        £
                        {bookingData.discount > 0
                          ? bookingData.finalPrice.toFixed(2)
                          : bookingData.servicePrice.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("voucher")}
                  className="flex-1 hover:bg-[#DCD4CD]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  className="flex-1 transition-all hover:text-[#D0A096]"
                  style={{
                    backgroundColor: "#3D3935",
                    color: "#E9CFCA",
                  }}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 9: Payment (Simulated Stripe) */}
        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Payment</DialogTitle>
              <DialogDescription>
                Enter your payment details to complete the booking
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800">Amount to Pay</span>
                    <span className="text-gray-800">
                      £
                      {bookingData.discount > 0
                        ? bookingData.finalPrice.toFixed(2)
                        : bookingData.servicePrice}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      type="text"
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-md border border-blue-200">
                <CreditCard className="text-blue-600" size={20} />
                <p className="text-sm text-blue-800">
                  This is a demo. No real payment will be processed.
                </p>
              </div>

              {paymentState.error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm text-red-700">{paymentState.error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("confirmation")}
                  className="flex-1"
                  disabled={paymentState.isSaving}
                >
                  Back
                </Button>
                <Button
                  onClick={handlePaymentComplete}
                  className="flex-1 transition-all"
                  style={{
                    backgroundColor: "#3D3935",
                    color: "#E9CFCA",
                    opacity: paymentState.isSaving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!paymentState.isSaving) {
                      e.currentTarget.style.backgroundColor = "#D0A096";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!paymentState.isSaving) {
                      e.currentTarget.style.backgroundColor = "#3D3935";
                    }
                  }}
                  disabled={paymentState.isSaving}
                >
                  {paymentState.isSaving ? "Processing..." : "Complete Payment"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 10: Receipt */}
        {step === "receipt" && (
          <>
            <DialogHeader>
              <DialogTitle>Booking Confirmed!</DialogTitle>
              <DialogDescription>
                Your appointment has been successfully booked
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#FAF7F5" }}
                >
                  <Check style={{ color: "#3D3935" }} size={32} />
                </div>
              </div>

              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="text-center pb-3 border-b">
                    <h3 className="text-gray-800 mb-1">Receipt</h3>
                    <p className="text-sm text-gray-600">#{receiptNumber}</p>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="text-gray-800">{bookingData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">People</span>
                    <span className="text-gray-800">
                      {bookingData.numberOfPeople}
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Services:</p>
                    {bookingData.services.map((service, index) => {
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {service.name}
                            </span>
                            <span className="text-gray-800">
                              £{service.price}
                            </span>
                          </div>
                          {service.addOns && service.addOns.length > 0 && (
                            <div className="ml-3 space-y-1">
                              {service.addOns.map((addOn, addOnIndex) => (
                                <div
                                  key={addOnIndex}
                                  className="flex justify-between text-xs text-gray-600"
                                >
                                  <span>+ {addOn.name}</span>
                                  <span>£{addOn.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="text-gray-800">
                      {bookingData.date?.toLocaleDateString("en-GB")} at{" "}
                      {bookingData.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="text-gray-800">
                      {bookingData.totalDuration} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="text-gray-800">
                      {
                        countryCodes.find(
                          (c) => c.id === bookingData.countryCode,
                        )?.code
                      }{" "}
                      {bookingData.phoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="text-gray-800 text-right">
                      {bookingData.houseNumber} {bookingData.street},{" "}
                      {bookingData.district}
                    </span>
                  </div>

                  {bookingData.discount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Voucher</span>
                        <span className="text-gray-800">
                          {bookingData.voucherCode}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ color: "#3D3935" }}
                      >
                        <span>Discount</span>
                        <span>-£{bookingData.discount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-800">Amount Paid</span>
                      <span className="text-gray-800">
                        £
                        {bookingData.discount > 0
                          ? bookingData.finalPrice.toFixed(2)
                          : bookingData.servicePrice}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  Thank you, {bookingData.name}! A confirmation has been sent to{" "}
                  {
                    countryCodes.find((c) => c.id === bookingData.countryCode)
                      ?.code
                  }{" "}
                  {bookingData.phoneNumber}. We'll send you a reminder 24 hours
                  before your appointment. Our mobile nail technician will
                  arrive at {bookingData.houseNumber} {bookingData.street},{" "}
                  {bookingData.district} at the scheduled time.
                  {bookingData.numberOfPeople > 1 &&
                    ` The appointment is scheduled for ${bookingData.numberOfPeople} people with a total duration of ${bookingData.totalDuration} minutes.`}
                </p>
              </div>

              <Button
                onClick={handleClose}
                className="w-full transition-all"
                style={{
                  backgroundColor: "#3D3935",
                  color: "#E9CFCA",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#D0A096";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#3D3935";
                }}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
