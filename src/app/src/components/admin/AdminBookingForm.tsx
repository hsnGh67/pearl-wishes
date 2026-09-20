import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  CreditCard,
  Plus,
  X,
  Search,
  Check,
} from "lucide-react";
import { Calendar } from "../../../components/ui/calendar";
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from "../../schema/booking.schema";
import {
  User as UserType,
  UserRole,
} from "../../schema/user.schema";
import { Service } from "../../schema/service.schema";
import {
  getAllUsers,
  createUser,
  findUserByNameOrEmailOrPhone,
} from "../../lib/db/users";
import { getAllServices } from "../../lib/db/services";
import {
  createBooking,
  deleteBooking,
  getBookingById,
  updateBooking,
} from "../../lib/db/bookings";
import {
  createBookingTreatment,
  getActiveBookingTreatments,
  getBookingTreatments,
} from "../../lib/db/booking-treatments";
import {
  BookingTreatment,
  BookingTreatmentCreate,
} from "../../schema/booking-treatment.schema";
import { Separator } from "../../../components/ui/separator";
import useDebounce from "../../utils/useDebounce";
import { getAllDistricts } from "../../lib/db/districts";
import { formatDate } from "../../utils/formatDate";
import { createBookingWithTreatments } from "../../lib/db/booking-with-treatments";
import { ArtistSelectionSection } from "../booking/ArtistSelectionSection";
import { formatArtistDisplayName } from "../../lib/db/available-artists";
import { getArtistById } from "../../lib/db/artists";
import {
  validatePromoCode,
  recordPromoCodeUsage,
} from "../../lib/db/promo-codes";
import { PromoValidationResult } from "../../schema/promo-code.schema";
import { useBookingDraft } from "../../hooks/useBookingDraft";
import { BookingDraftKeys } from "../../lib/booking-draft";
import { getBusinessSettings } from "../../lib/db/business-settings";
import {
  GAP_MINUTES,
  GAP_MINUTES_PER_PEOPLE,
  GAP_MINUTES_PER_SERVICE,
  isDateDisabledByBookableSet,
  resolveActiveBuffer,
  toDateKeySet,
  type SchedulePreference,
} from "../../lib/booking-schedule";
import {
  assignArtistForSlot,
  getBookableDatesForArtist,
  getBookableDatesForServices,
  getFreeTimesForArtist,
  getFreeTimesForServices,
  monthDateRange,
} from "../../lib/db/booking-schedule";

export {
  GAP_MINUTES,
  GAP_MINUTES_PER_PEOPLE,
  GAP_MINUTES_PER_SERVICE,
};

interface AdminBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingBooking?: Booking;
  mode: "create" | "reschedule";
}

interface TreatmentSelection {
  personNumber: number;
  serviceName: string;
  serviceId: string;
  price: number;
  duration: number;
  addOns?: Array<{
    name: string;
    price: number;
    duration: number;
    id: string;
  }>;
}

type AdminStep =
  | "user"
  | "treatments"
  | "preference"
  | "artist"
  | "date"
  | "time"
  | "review";

type AdminCreateBookingDraft = {
  currentStep: AdminStep;
  schedulePreference: SchedulePreference | null;
  selectedArtistId: string;
  selectedArtistName: string;
  selectedUserId: string;
  showNewUserForm: boolean;
  newUser: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    district: string;
  };
  address: {
    fullAddress: string;
    district: string;
  };
  numberOfPeople: number;
  selectedDate: Date | undefined;
  selectedTime: string;
  paymentStatus: PaymentStatus;
  notes: string;
  treatments: TreatmentSelection[];
  currentPersonIndex: number;
  promoCodeInput: string;
  appliedPromo: {
    promoCodeId: string;
    code: string;
    discountAmount: number;
    finalTotal: number;
  } | null;
}; 

export function AdminBookingForm({
  open,
  onOpenChange,
  onSuccess,
  existingBooking,
  mode,
}: AdminBookingFormProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [districts, setDistricts] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    string[]
  >([]);
  const [bookableDateKeys, setBookableDateKeys] =
    useState<Set<string> | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(),
  );
  const [getBookableDatesState, setGetBookableDatesState] =
    useState({ isLoading: false, hasError: false });
  const [getTimeSlotsState, setGetTimeSlotsState] = useState({
    isLoading: false,
    hasError: false,
  });
  const [schedulePreference, setSchedulePreference] =
    useState<SchedulePreference | null>(null);
  const [isAssigningArtist, setIsAssigningArtist] =
    useState(false);
  const [showArtistOverride, setShowArtistOverride] =
    useState(false);
  const [bufferMinutes, setBufferMinutes] =
    useState(GAP_MINUTES);
  const [bufferEffectiveFrom, setBufferEffectiveFrom] =
    useState<string | null>(null);
  const [previousBufferMinutes, setPreviousBufferMinutes] =
    useState(GAP_MINUTES);
  const [selectedUserId, setSelectedUserId] =
    useState<string>("");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const { setDebounce } = useDebounce();
  let originalTreatments = useRef([]);
  const skipArtistResetRef = useRef(false);

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
  });

  const [address, setAddress] = useState({
    fullAddress: "",
    district: "",
  });

  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedDate, setSelectedDate] = useState<
    Date | undefined
  >(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [selectedArtistName, setSelectedArtistName] =
    useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const [treatments, setTreatments] = useState<
    TreatmentSelection[]
  >([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentPersonIndex, setCurrentPersonIndex] =
    useState(0);
  const [
    selectedServiceForAddOns,
    setSelectedServiceForAddOns,
  ] = useState<{
    name: string;
    serviceId: string;
    price: number;
    duration: number;
  } | null>(null);
  const [tempAddOns, setTempAddOns] = useState<
    Array<{
      name: string;
      price: number;
      duration: number;
      id: string;
    }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] =
    useState<AdminStep>("user");

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] =
    useState<PromoValidationResult | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    promoCodeId: string;
    code: string;
    discountAmount: number;
    finalTotal: number;
  } | null>(null);

  const isCreateMode = mode === "create";

  const adminDraftSnapshot = useMemo<AdminCreateBookingDraft>(
    () => ({
      currentStep,
      schedulePreference,
      selectedUserId,
      showNewUserForm,
      newUser,
      address,
      numberOfPeople,
      selectedDate,
      selectedTime,
      selectedArtistId,
      selectedArtistName,
      paymentStatus,
      notes,
      treatments,
      currentPersonIndex,
      promoCodeInput,
      appliedPromo,
    }),
    [
      currentStep,
      schedulePreference,
      selectedUserId,
      showNewUserForm,
      newUser,
      address,
      numberOfPeople,
      selectedDate,
      selectedTime,
      selectedArtistId,
      selectedArtistName,
      paymentStatus,
      notes,
      treatments,
      currentPersonIndex,
      promoCodeInput,
      appliedPromo,
    ],
  );

  const { clear: clearAdminDraft } =
    useBookingDraft<AdminCreateBookingDraft>({
      storageKey: BookingDraftKeys.adminCreate,
      enabled: open && isCreateMode,
      snapshot: adminDraftSnapshot,
      onHydrate: (draft) => {
        setCurrentStep(draft.currentStep || "user");
        setSelectedUserId(draft.selectedUserId || "");
        setShowNewUserForm(Boolean(draft.showNewUserForm));
        if (draft.newUser) setNewUser(draft.newUser);
        if (draft.address) setAddress(draft.address);
        setNumberOfPeople(draft.numberOfPeople || 1);
        setSelectedDate(
          draft.selectedDate instanceof Date
            ? draft.selectedDate
            : draft.selectedDate
              ? new Date(
                  draft.selectedDate as unknown as string,
                )
              : undefined,
        );
        setSelectedTime(draft.selectedTime || "");
        setSelectedArtistId(draft.selectedArtistId || "");
        setSelectedArtistName(draft.selectedArtistName || "");
        setSchedulePreference(draft.schedulePreference ?? null);
        if (draft.paymentStatus) {
          setPaymentStatus(draft.paymentStatus);
        }
        setNotes(draft.notes || "");
        setTreatments(draft.treatments || []);
        setCurrentPersonIndex(draft.currentPersonIndex || 0);
        setPromoCodeInput(draft.promoCodeInput || "");
        setAppliedPromo(draft.appliedPromo || null);
        return true;
      },
    });

  useEffect(() => {
    if (open) {
      loadInitialData();
      getBusinessSettings().then((s) => {
        if (s) {
          setBufferMinutes(s.travel_buffer_minutes);
          setBufferEffectiveFrom(s.buffer_effective_from);
          setPreviousBufferMinutes(
            s.previous_travel_buffer_minutes ??
              s.travel_buffer_minutes,
          );
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (userSearchQuery.length < 3) {
      setDebounce(() => searchUser(userSearchQuery), 1000);
    }
  }, [userSearchQuery]);

  useEffect(() => {
    if (existingBooking && mode === "reschedule") {
      loadExistingBookingData();
    }
  }, [existingBooking, mode]);

  // Monitor address state changes
  useEffect(() => {
    console.log("💾 Current address state:", address);
  }, [address]);

  // Auto-fill address when user is selected
  useEffect(() => {
    console.log("🔄 Auto-fill useEffect triggered:", {
      selectedUserId,
      usersCount: users.length,
      hasSelectedUser: !!selectedUserId,
    });

    if (selectedUserId && users.length > 0) {
      const selectedUser = users.find(
        (u) => u.id === selectedUserId,
      );

      console.log("👤 Found selected user:", {
        user: selectedUser,
        hasAddress: !!selectedUser?.address,
        addressData: {
          address: selectedUser?.address,
          district: selectedUser?.district,
        },
      });

      if (selectedUser) {
        const newAddress = {
          fullAddress: selectedUser.address || "",
          district: selectedUser.district || "",
        };

        console.log("📝 Setting address to:", newAddress);
        setAddress(newAddress);
      }
    }
  }, [selectedUserId, users]);

  const loadInitialData = async () => {
    try {
      const [{ data: usersData }, servicesData, districtsData] =
        await Promise.all([
          getAllUsers({ limit: 1000 }),
          getAllServices(),
          getAllDistricts(),
        ]);
      console.log(
        "💰 Loaded services with prices:",
        servicesData.map((s) => ({
          name: s.name,
          price: s.price,
          isAddOn: s.is_add_on,
        })),
      );
      setUsers(usersData);
      setServices(servicesData);
      setDistricts(districtsData.available);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadExistingBookingData = async () => {
    if (!existingBooking) return;

    skipArtistResetRef.current = true;
    console.log("existingBooking ==>", existingBooking);
    setSchedulePreference(
      existingBooking.artist_id ? "artist" : "date",
    );
    setSelectedUserId(existingBooking.user_id);
    setSelectedDate(
      new Date(existingBooking.appointment_date) < new Date()
        ? undefined
        : new Date(existingBooking.appointment_date),
    );
    setSelectedTime(existingBooking.appointment_time);
    setNumberOfPeople(existingBooking.number_of_people || 1);
    setTotalAmount(existingBooking.total_amount);
    setNotes(existingBooking.notes || "");
    setPaymentStatus(
      existingBooking.payment_status as PaymentStatus,
    );
    setAddress({
      fullAddress: existingBooking.address || "",
      district: existingBooking.district || "",
    });

    try {
      const treatmentsData = await getBookingTreatments(
        existingBooking.id!,
      );
      console.log(
        "treatmentsData AAAAAAAAAAAAAAAA ====>",
        treatmentsData,
      );

      const treatmentSelections: TreatmentSelection[] =
        treatmentsData.map((t, index) => {
          return {
            addOns: t.addOns,
            personNumber: index + 1,
            serviceId: t.service_id,
            serviceName: t?.service_name || "",
            price: t.price,
            duration: t.duration,
          };
        });
      setTreatments(treatmentSelections);
      originalTreatments.current = treatmentSelections;
    } catch (error) {
      console.error("Failed to load treatments:", error);
    }

    if (existingBooking.artist_id) {
      setSelectedArtistId(existingBooking.artist_id);
      try {
        const artist = await getArtistById(
          existingBooking.artist_id,
        );
        if (artist) {
          setSelectedArtistName(
            formatArtistDisplayName(artist),
          );
        }
      } catch {
        setSelectedArtistName("");
      }
    }

    window.setTimeout(() => {
      skipArtistResetRef.current = false;
    }, 0);
  };

  const serviceIdsForSchedule = treatments
    .map((t) => t.serviceId)
    .filter(Boolean);

  const treatmentServiceIdsKey = [...serviceIdsForSchedule]
    .sort()
    .join(",");

  const activeBuffer = resolveActiveBuffer({
    selectedDate,
    bufferMinutes,
    previousBufferMinutes,
    bufferEffectiveFrom,
  });

  const excludeBookingId =
    mode === "reschedule" && existingBooking?.id
      ? existingBooking.id
      : undefined;

  const loadBookableDates = async () => {
    if (!address.district || serviceIdsForSchedule.length === 0) {
      setBookableDateKeys(new Set());
      return;
    }
    if (schedulePreference === "artist" && !selectedArtistId) {
      setBookableDateKeys(new Set());
      return;
    }

    setGetBookableDatesState({ isLoading: true, hasError: false });
    try {
      const { fromDate, toDate } = monthDateRange(calendarMonth);
      const bufferForRange = resolveActiveBuffer({
        selectedDate: fromDate,
        bufferMinutes,
        previousBufferMinutes,
        bufferEffectiveFrom,
      });
      const duration = totalDuration || 60;
      const dates =
        schedulePreference === "artist" && selectedArtistId
          ? await getBookableDatesForArtist({
              artistId: selectedArtistId,
              districtName: address.district,
              serviceIds: serviceIdsForSchedule,
              fromDate,
              toDate,
              durationMinutes: duration,
              bufferMinutes: bufferForRange,
              excludeBookingId,
            })
          : await getBookableDatesForServices({
              districtName: address.district,
              serviceIds: serviceIdsForSchedule,
              fromDate,
              toDate,
              durationMinutes: duration,
              bufferMinutes: bufferForRange,
              excludeBookingId,
            });
      setBookableDateKeys(toDateKeySet(dates));
      setGetBookableDatesState({
        isLoading: false,
        hasError: false,
      });
    } catch (error) {
      console.error("Failed to load bookable dates", error);
      setBookableDateKeys(new Set());
      setGetBookableDatesState({
        isLoading: false,
        hasError: true,
      });
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate) {
      setAvailableTimeSlots([]);
      return;
    }

    setGetTimeSlotsState({ isLoading: true, hasError: false });
    try {
      const duration = totalDuration || 60;
      const slots =
        schedulePreference === "artist" && selectedArtistId
          ? await getFreeTimesForArtist({
              artistId: selectedArtistId,
              appointmentDate: selectedDate,
              durationMinutes: duration,
              bufferMinutes: activeBuffer,
              excludeBookingId,
            })
          : await getFreeTimesForServices({
              districtName: address.district,
              serviceIds: serviceIdsForSchedule,
              appointmentDate: selectedDate,
              durationMinutes: duration,
              bufferMinutes: activeBuffer,
              excludeBookingId,
            });
      setAvailableTimeSlots(slots);
      setGetTimeSlotsState({
        isLoading: false,
        hasError: false,
      });
    } catch (error) {
      setGetTimeSlotsState({
        isLoading: false,
        hasError: true,
      });
      console.error("Failed to load available time slots", error);
      setAvailableTimeSlots([]);
    }
  };

  useEffect(() => {
    const totalPrice = treatments.reduce((sum, treatment) => {
      const servicePrice = Number(treatment.price);
      const addOnsPrice =
        treatment.addOns?.reduce(
          (addOnSum, addOn) => addOnSum + Number(addOn.price),
          0,
        ) || 0;
      return sum + servicePrice + addOnsPrice;
    }, 0);

    console.log("treatments =>", treatments);
    const totalServiceDuration = treatments.reduce(
      (sum, treatment) => {
        const serviceDuration = Number(treatment.duration);
        const addOnsDuration =
          treatment.addOns?.reduce(
            (addOnSum, addOn) =>
              addOnSum + Number(addOn.duration),
            0,
          ) || 0;
        return sum + serviceDuration + addOnsDuration;
      },
      0,
    );

    setTotalDuration(
      totalServiceDuration +
        ((treatments.length - 1) * GAP_MINUTES_PER_SERVICE +
          (numberOfPeople - 1) * GAP_MINUTES_PER_PEOPLE),
    );
    setTotalAmount(totalPrice);
  }, [treatments, numberOfPeople]);

  useEffect(() => {
    if (currentStep === "date") {
      void loadBookableDates();
    }
  }, [
    currentStep,
    calendarMonth,
    schedulePreference,
    selectedArtistId,
    address.district,
    totalDuration,
    treatmentServiceIdsKey,
  ]);

  useEffect(() => {
    if (currentStep === "time") {
      void loadAvailableTimes();
    }
  }, [
    currentStep,
    selectedDate,
    schedulePreference,
    selectedArtistId,
    address.district,
    totalDuration,
    activeBuffer,
    treatmentServiceIdsKey,
  ]);

  useEffect(() => {
    if (skipArtistResetRef.current) return;
    setSelectedArtistId("");
    setSelectedArtistName("");
  }, [address.district, treatmentServiceIdsKey]);

  useEffect(() => {
    if (skipArtistResetRef.current) return;
    setSelectedTime("");
    if (schedulePreference === "date") {
      setSelectedArtistId("");
      setSelectedArtistName("");
    }
  }, [selectedDate]);

  useEffect(() => {
    if (skipArtistResetRef.current) return;
    if (schedulePreference === "date") {
      setSelectedArtistId("");
      setSelectedArtistName("");
    }
  }, [selectedTime]);

  const handleServiceClick = (
    serviceName: string,
    serviceId: string,
    price: number,
    duration: number,
  ) => {
    setSelectedServiceForAddOns({
      name: serviceName,
      serviceId,
      price,
      duration,
    });
    setTempAddOns([]);
  };

  const handleAddOnToggle = (
    addOnName: string,
    addOnId: string,
    price: number,
    duration: number,
  ) => {
    const isSelected = tempAddOns.some((a) => a.id === addOnId);

    if (isSelected) {
      setTempAddOns(tempAddOns.filter((a) => a.id !== addOnId));
    } else {
      setTempAddOns([
        ...tempAddOns,
        { name: addOnName, id: addOnId, price, duration },
      ]);
    }
  };

  const handleAddServiceWithAddOns = () => {
    if (!selectedServiceForAddOns) return;

    const newService: TreatmentSelection = {
      personNumber: currentPersonIndex + 1,
      serviceName: selectedServiceForAddOns.name,
      serviceId: selectedServiceForAddOns.serviceId,
      price: selectedServiceForAddOns.price,
      duration: selectedServiceForAddOns.duration,
      addOns: tempAddOns.length > 0 ? tempAddOns : [],
    };

    setTreatments([...treatments, newService]);
    setSelectedServiceForAddOns(null);
    setTempAddOns([]);
  };

  const handleAddServiceWithoutAddOns = () => {
    if (!selectedServiceForAddOns) return;

    const newService: TreatmentSelection = {
      personNumber: currentPersonIndex + 1,
      serviceName: selectedServiceForAddOns.name,
      serviceId: selectedServiceForAddOns.serviceId,
      price: selectedServiceForAddOns.price,
      duration: selectedServiceForAddOns.duration,
      addOns: [],
    };

    setTreatments([...treatments, newService]);
    setSelectedServiceForAddOns(null);
    setTempAddOns([]);
  };

  const handleCancelAddOns = () => {
    handleAddServiceWithoutAddOns();
  };

  const handleContinueToNextPerson = () => {
    const currentPersonServices = treatments.filter(
      (s) => s.personNumber === currentPersonIndex + 1,
    );

    if (currentPersonServices.length === 0) {
      return;
    }

    if (currentPersonIndex + 1 < numberOfPeople) {
      setCurrentPersonIndex(currentPersonIndex + 1);
    } else {
      setCurrentStep("preference");
    }
  };

  const handleRemoveService = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const searchUser = async (userSearchQuery: string) => {
    if (!userSearchQuery) {
      return;
    }

    try {
      const users =
        await findUserByNameOrEmailOrPhone(userSearchQuery);
      setUsers(users);
    } catch (error) {
      console.error("Failed to find user", error);
      setUsers([]);
    }
  };

  const handleCreateNewUser = async () => {
    if (
      !newUser.fullName ||
      !newUser.email ||
      !newUser.phone ||
      !newUser.address ||
      !newUser.district
    ) {
      alert("Please fill in all user fields including address");
      return;
    }

    try {
      const createdUser = await createUser({
        full_name: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        district: newUser.district,
        role: UserRole.CLIENT,
      });

      setUsers([...users, createdUser]);
      setSelectedUserId(createdUser.id!);
      setShowNewUserForm(false);
      // Auto-fill address from newly created user
      setAddress({
        fullAddress: newUser.address,
        district: newUser.district,
      });
      setNewUser({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        district: "",
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user. Please try again.");
    }
  };

  function generateBookingChangeReason(
    oTreatments: Booking,
    newBooking: Booking,
  ): string {
    console.log("oTreatments==>", oTreatments);
    console.log("newBooking==>", newBooking);
    const reasons: string[] = [];

    const originalTreatments = new Map(
      oTreatments.map((t) => [t.serviceId, t]),
    );

    const newTreatments = new Map(
      newBooking.treatments.map((t) => [t.serviceId, t]),
    );

    console.log("first");
    // Added treatments
    for (const [id, treatment] of newTreatments) {
      if (!originalTreatments.has(id)) {
        reasons.push(
          `Added treatment "${treatment.serviceName}"`,
        );
      }
    }

    // Removed treatments
    for (const [id, treatment] of originalTreatments) {
      if (!newTreatments.has(id)) {
        reasons.push(
          `Removed treatment "${treatment.serviceName}"`,
        );
      }
    }

    // Compare addons for existing treatments
    for (const [id, newTreatment] of newTreatments) {
      const originalTreatment = originalTreatments.get(id);

      console.log("originalTreatment", originalTreatment);
      if (!originalTreatment) continue;

      const originalAddons = new Map(
        originalTreatment.addOns.map((a) => [a.addonId, a]),
      );
      console.log("second");
      const newAddons = new Map(
        newTreatment.addOns.map((a) => [a.addonId, a]),
      );
      console.log("third");
      // Added addons
      for (const [addonId, addon] of newAddons) {
        if (!originalAddons.has(addonId)) {
          reasons.push(
            `Added addon "${addon.addonName}" to "${newTreatment.serviceName}"`,
          );
        }
      }

      // Removed addons
      for (const [addonId, addon] of originalAddons) {
        if (!newAddons.has(addonId)) {
          reasons.push(
            `Removed addon "${addon.addonName}" from "${newTreatment.serviceName}"`,
          );
        }
      }
    }

    return reasons.length
      ? reasons.join(", ")
      : "Booking updated";
  }

  const handleSubmit = async () => {
    console.log("🚀 Starting booking submission...");

    if (!selectedUserId) {
      alert("Please select or create a user");
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }

    if (treatments.length === 0) {
      alert("Please add at least one treatment");
      return;
    }

    if (treatments.some((t) => !t.serviceId)) {
      alert("Please select a service for all treatments");
      return;
    }

    if (!address.fullAddress || !address.district) {
      alert("Please fill in all address fields");
      return;
    }

    if (!selectedArtistId) {
      alert("Please select an artist");
      return;
    }

    console.log("✅ All validations passed");
    setLoading(true);
    let bookingId = null;
    let treatmentsData: Omit<
      BookingTreatmentCreate,
      "booking_id"
    >[] = [];
    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(
        parseInt(hours),
        parseInt(minutes),
      );

      if (mode === "reschedule" && existingBooking) {
        console.log(
          "📝 Rescheduling booking:",
          existingBooking.id,
        );
        for (const treatment of treatments) {
          const treatmentData = {
            serviceId: treatment.serviceId,
            personNumber: treatment.personNumber,
            serviceName: treatment.serviceName,
            price: treatment.price,
            duration: treatment.duration,
            addOns: treatment.addOns,
          };
          console.log("Creating treatment:", treatmentData);
          treatmentsData.push(treatmentData);
        }
        await updateBooking(
          {
            id: existingBooking.id!,
            appointment_date: formatDate(selectedDate),
            appointment_time: selectedTime,
            artist_id: selectedArtistId,
            total_amount: totalAmount,
            notes: notes,
            payment_status: paymentStatus,
          },
          generateBookingChangeReason(
            originalTreatments.current,
            {
              treatments: treatmentsData,
            },
          ),
        );
        console.log("✅ Booking rescheduled successfully");
      } else {
        const subtotal = totalAmount;
        const discountAmount =
          appliedPromo?.discountAmount ?? 0;
        const finalTotal = appliedPromo?.finalTotal ?? subtotal;

        const bookingData = {
          user_id: selectedUserId,
          service_id: treatments[0].serviceId,
          appointment_date: formatDate(selectedDate),
          appointment_time: selectedTime,
          address: address.fullAddress,
          district: address.district,
          status: BookingStatus.CONFIRMED,
          payment_status: PaymentStatus.UNPAID,
          people_numbers: numberOfPeople,
          discount_amount: discountAmount,
          balance_amount: 0,
          tax_amount: 0,
          currency: "£",
          subtotal_amount: subtotal,
          total_amount: finalTotal,
          notes: notes,
          ...(appliedPromo && {
            promo_code_id: appliedPromo.promoCodeId,
            promo_code_code: appliedPromo.code,
            promo_code_discount: appliedPromo.discountAmount,
          }),
          artist_id: selectedArtistId,
        };
        for (const treatment of treatments) {
          const treatmentData = {
            service_id: treatment.serviceId,
            person_name: `Person ${treatment.personNumber}`,
            service_name: treatment.serviceName,
            price: treatment.price,
            duration: treatment.duration,
            addOns: treatment.addOns,
          };
          console.log("Creating treatment:", treatmentData);
          treatmentsData.push(treatmentData);
        }
        const { booking: createdBooking, treatmentsCreated } =
          await createBookingWithTreatments({
            booking: bookingData,
            treatments: treatmentsData,
          });
        console.log("✅ Booking created:", createdBooking);
        bookingId = createdBooking.id;

        if (appliedPromo && bookingId) {
          try {
            await recordPromoCodeUsage(
              appliedPromo.promoCodeId,
              bookingId,
              selectedUserId,
              appliedPromo.discountAmount,
              subtotal,
              finalTotal,
            );
          } catch (promoErr) {
            console.error(
              "Non-fatal: failed to record promo usage:",
              promoErr,
            );
          }
        }
      }

      console.log("🔄 Calling onSuccess to refresh data...");
      await onSuccess();
      console.log("✅ Data refreshed");

      console.log("🚪 Closing dialog...");
      hardResetAndClose();
      console.log("✅ Booking process complete!");
    } catch (error) {
      console.error("❌ Failed to save booking:", error);
      console.error("Error details:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      alert(
        `Failed to save booking: ${(error as any)?.message || "Unknown error"}. Please try again.`,
      );
      if (bookingId) {
        deleteBooking(bookingId);
      }
    } finally {
      setLoading(false);
    }
  };

  const softClose = () => {
    onOpenChange(false);
  };

  const resetAdminState = () => {
    setCurrentStep("user");
    setSelectedUserId("");
    setShowNewUserForm(false);
    setNewUser({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      district: "",
    });
    setAddress({ fullAddress: "", district: "" });
    setNumberOfPeople(1);
    setSelectedDate(undefined);
    setSelectedTime("");
    setPaymentStatus(PaymentStatus.UNPAID);
    setTreatments([]);
    setNotes("");
    setUserSearchQuery("");
    setCurrentPersonIndex(0);
    setSelectedServiceForAddOns(null);
    setTempAddOns([]);
    setPromoCodeInput("");
    setPromoResult(null);
    setAppliedPromo(null);
  };

  const hardResetAndClose = () => {
    if (isCreateMode) {
      clearAdminDraft();
    }
    resetAdminState();
    onOpenChange(false);
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoValidating(true);
    setPromoResult(null);
    try {
      const result = await validatePromoCode(
        promoCodeInput.trim(),
        selectedUserId,
        "treatments",
        totalAmount,
      );
      setPromoResult(result);
      if (result.valid) {
        setAppliedPromo({
          promoCodeId: result.promoCodeId,
          code: result.code,
          discountAmount: result.discountAmount,
          finalTotal: result.finalTotal,
        });
      }
    } catch (err) {
      setPromoResult({
        valid: false,
        error: "Failed to validate promo code.",
      });
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoResult(null);
  };

  const filteredUsers = users.filter((user) => {
    const search = userSearchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.phone || "").toLowerCase().includes(search)
    );
  });

  const selectedUser = users.find(
    (u) => u.id === selectedUserId,
  );
  const addOnServices = services.filter((s) => s.is_add_on);

  const handleContinueFromTime = async () => {
    if (!selectedTime || !selectedDate) return;

    if (schedulePreference === "artist") {
      setCurrentStep("review");
      return;
    }

    setIsAssigningArtist(true);
    try {
      const artist = await assignArtistForSlot({
        districtName: address.district,
        serviceIds: serviceIdsForSchedule,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        durationMinutes: totalDuration || 60,
        bufferMinutes: activeBuffer,
        excludeBookingId,
      });
      if (!artist) {
        alert(
          "No artist is available for this time. Please choose another slot.",
        );
        return;
      }
      setSelectedArtistId(artist.id);
      setSelectedArtistName(formatArtistDisplayName(artist));
      setCurrentStep("review");
    } catch (error) {
      console.error("Failed to assign artist", error);
      alert("Unable to assign an artist. Please try again.");
    } finally {
      setIsAssigningArtist(false);
    }
  };

  const stepperSteps: AdminStep[] =
    schedulePreference === "artist"
      ? [
          "user",
          "treatments",
          "preference",
          "artist",
          "date",
          "time",
          "review",
        ]
      : schedulePreference === "date"
        ? [
            "user",
            "treatments",
            "preference",
            "date",
            "time",
            "review",
          ]
        : ["user", "treatments", "preference", "review"];

  console.log(
    "Admin BookingForm existingBooking =======>",
    existingBooking,
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (isCreateMode) softClose();
          else hardResetAndClose();
        }
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto border-2"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#3D3935" }}>
            {mode === "reschedule"
              ? "Reschedule Appointment"
              : "New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {mode === "reschedule"
              ? "Update the appointment date and time"
              : "Create a new appointment for a client"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div
            className="flex items-center justify-between border-b-2 pb-4"
            style={{ borderColor: "#DCD4CD" }}
          >
            {stepperSteps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-2 ${currentStep === step ? "opacity-100" : "opacity-50"}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{
                    backgroundColor:
                      currentStep === step
                        ? "#E9CFCA"
                        : "transparent",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                >
                  {index + 1}
                </div>
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: "#3D3935" }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {currentStep === "user" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Select or Create User
              </h3>

              {!showNewUserForm ? (
                <>
                  <div
                    className="flex items-center gap-2 p-3 border-2"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={userSearchQuery}
                      onChange={(e) =>
                        setUserSearchQuery(e.target.value)
                      }
                      className="border-0 focus:ring-0"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className={`p-4 cursor-pointer border-2 transition-colors hover:bg-gray-50 ${
                          selectedUserId === user.id
                            ? "border-gray-800"
                            : ""
                        }`}
                        style={{
                          borderColor:
                            selectedUserId === user.id
                              ? "#3D3935"
                              : "#DCD4CD",
                        }}
                        onClick={() =>
                          setSelectedUserId(user.id!)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#3D3935" }}
                            >
                              {user.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.phone}
                            </p>
                          </div>
                          {selectedUserId === user.id && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: "#E9CFCA",
                              }}
                            >
                              <span
                                style={{ color: "#3D3935" }}
                              >
                                ✓
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    className="w-full border-2"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "#3D3935",
                      color: "#3D3935",
                    }}
                    onClick={() => setShowNewUserForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New User
                  </Button>
                </>
              ) : (
                <Card
                  className="p-4 border-2"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <div className="space-y-4">
                    <h4
                      className="font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      New User Details
                    </h4>

                    <div>
                      <Label style={{ color: "#3D3935" }}>
                        Full Name
                      </Label>
                      <Input
                        value={newUser.fullName}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="e.g. Sarah Johnson"
                        className="border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      />
                    </div>

                    <div>
                      <Label style={{ color: "#3D3935" }}>
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            email: e.target.value,
                          })
                        }
                        placeholder="e.g. sarah@example.com"
                        className="border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      />
                    </div>

                    <div>
                      <Label style={{ color: "#3D3935" }}>
                        Phone
                      </Label>
                      <Input
                        value={newUser.phone}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            phone: e.target.value,
                          })
                        }
                        placeholder="e.g. +44 20 1234 5678"
                        className="border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      />
                    </div>

                    <div>
                      <Label style={{ color: "#3D3935" }}>
                        Address
                      </Label>
                      <Input
                        value={newUser.address}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            address: e.target.value,
                          })
                        }
                        placeholder="e.g. 123 High Street"
                        className="border-2"
                        style={{ borderColor: "#DCD4CD" }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label style={{ color: "#3D3935" }}>
                          District
                        </Label>
                        <Select
                          value={newUser.district}
                          onValueChange={(v) =>
                            setNewUser({
                              ...newUser,
                              district: v,
                            })
                          }
                        >
                          <SelectTrigger
                            className="border-2"
                            style={{ borderColor: "#DCD4CD" }}
                          >
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem
                                key={district.id}
                                value={district.name}
                              >
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 border-2"
                        style={{
                          backgroundColor: "#E9CFCA",
                          borderColor: "#3D3935",
                          color: "#3D3935",
                        }}
                        onClick={handleCreateNewUser}
                      >
                        Create User
                      </Button>
                      <Button
                        className="flex-1 border-2"
                        style={{
                          backgroundColor: "transparent",
                          borderColor: "#3D3935",
                          color: "#3D3935",
                        }}
                        onClick={() =>
                          setShowNewUserForm(false)
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  disabled={!selectedUserId}
                  className="border-2"
                  style={{
                    backgroundColor: "#E9CFCA",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => setCurrentStep("treatments")}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {currentStep === "preference" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Schedule preference
              </h3>
              {!address.district && (
                <p className="text-sm text-red-600">
                  Select a client with a district (or set district
                  on the user) before choosing an artist or date.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full h-auto py-5 px-4 flex flex-col items-start border-2 text-left"
                style={{
                  borderColor:
                    schedulePreference === "artist"
                      ? "#3D3935"
                      : "#DCD4CD",
                  backgroundColor:
                    schedulePreference === "artist"
                      ? "#E9CFCA"
                      : "#FEFCFA",
                  color: "#3D3935",
                }}
                onClick={() => {
                  setSchedulePreference("artist");
                  setSelectedArtistId("");
                  setSelectedArtistName("");
                  setSelectedDate(undefined);
                  setSelectedTime("");
                }}
              >
                <span className="font-medium">
                  Prefer a specific artist
                </span>
                <span className="text-xs opacity-70 mt-1">
                  Choose artist, then available dates and times
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-auto py-5 px-4 flex flex-col items-start border-2 text-left"
                style={{
                  borderColor:
                    schedulePreference === "date"
                      ? "#3D3935"
                      : "#DCD4CD",
                  backgroundColor:
                    schedulePreference === "date"
                      ? "#E9CFCA"
                      : "#FEFCFA",
                  color: "#3D3935",
                }}
                onClick={() => {
                  setSchedulePreference("date");
                  setSelectedArtistId("");
                  setSelectedArtistName("");
                  setSelectedDate(undefined);
                  setSelectedTime("");
                }}
              >
                <span className="font-medium">
                  Prefer a specific date
                </span>
                <span className="text-xs opacity-70 mt-1">
                  Choose date and time; artist is assigned
                  automatically (editable on review)
                </span>
              </Button>
              <div
                className="flex justify-between pt-4 border-t-2"
                style={{ borderColor: "#DCD4CD" }}
              >
                <Button
                  type="button"
                  className="border-2"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => {
                    setCurrentStep("treatments");
                    setCurrentPersonIndex(numberOfPeople - 1);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!schedulePreference || !address.district}
                  className="border-2"
                  style={{
                    backgroundColor:
                      schedulePreference && address.district
                        ? "#E9CFCA"
                        : "#DCD4CD",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => {
                    if (schedulePreference === "artist") {
                      setCurrentStep("artist");
                    } else {
                      setCurrentStep("date");
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === "artist" &&
            schedulePreference === "artist" && (
              <div className="space-y-4">
                <h3
                  className="font-semibold"
                  style={{ color: "#3D3935" }}
                >
                  Select Artist
                </h3>
                <ArtistSelectionSection
                  districtName={address.district}
                  serviceIds={serviceIdsForSchedule}
                  selectedArtistId={selectedArtistId}
                  onSelect={(artistId, artist) => {
                    setSelectedArtistId(artistId);
                    setSelectedArtistName(
                      artist
                        ? formatArtistDisplayName(artist)
                        : "",
                    );
                    setSelectedDate(undefined);
                    setSelectedTime("");
                  }}
                  onBack={() => setCurrentStep("preference")}
                  onContinue={() => setCurrentStep("date")}
                  continueLabel="Continue to Date"
                />
              </div>
            )}

          {currentStep === "date" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Select Date
              </h3>
              <Card
                className="p-4 border-2"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Duration
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {totalDuration} min
                    </span>
                  </div>
                  {selectedArtistName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Artist
                      </span>
                      <span style={{ color: "#3D3935" }}>
                        {selectedArtistName}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
              {getBookableDatesState.isLoading ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  Loading available dates…
                </div>
              ) : getBookableDatesState.hasError ? (
                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                  <p>Unable to load available dates.</p>
                  <Button
                    type="button"
                    onClick={() => void loadBookableDates()}
                    className="mx-auto"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setCurrentStep("time");
                  }}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  disabled={(date) =>
                    isDateDisabledByBookableSet(
                      date,
                      bookableDateKeys,
                    )
                  }
                  className="border-2 rounded-md mt-2"
                  style={{ borderColor: "#DCD4CD" }}
                />
              )}
              <div
                className="flex justify-between pt-4 border-t-2"
                style={{ borderColor: "#DCD4CD" }}
              >
                <Button
                  type="button"
                  className="border-2"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() =>
                    setCurrentStep(
                      schedulePreference === "artist"
                        ? "artist"
                        : "preference",
                    )
                  }
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {currentStep === "time" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Select Time
              </h3>
              <p className="text-sm text-gray-600">
                {selectedDate?.toLocaleDateString("en-GB")}
                {selectedArtistName
                  ? ` · ${selectedArtistName}`
                  : ""}
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2">
                {getTimeSlotsState.isLoading ? (
                  <div className="col-span-4 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                    Loading available times…
                  </div>
                ) : getTimeSlotsState.hasError ? (
                  <div className="col-span-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                    <p>Unable to load available times.</p>
                    <Button
                      type="button"
                      onClick={() => void loadAvailableTimes()}
                      className="mx-auto"
                    >
                      Try again
                    </Button>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="col-span-4 rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    No available time slots found for this date.
                  </div>
                ) : (
                  availableTimeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      className="border-2"
                      style={{
                        borderColor:
                          selectedTime === slot
                            ? "#3D3935"
                            : "#DCD4CD",
                        backgroundColor:
                          selectedTime === slot
                            ? "#3D3935"
                            : "transparent",
                        color:
                          selectedTime === slot
                            ? "#FEFCFA"
                            : "#3D3935",
                      }}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </Button>
                  ))
                )}
              </div>
              <div
                className="flex justify-between pt-4 border-t-2"
                style={{ borderColor: "#DCD4CD" }}
              >
                <Button
                  type="button"
                  className="border-2"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => {
                    setSelectedTime("");
                    setCurrentStep("date");
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!selectedTime || isAssigningArtist}
                  className="border-2"
                  style={{
                    backgroundColor:
                      selectedTime && !isAssigningArtist
                        ? "#E9CFCA"
                        : "#DCD4CD",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => void handleContinueFromTime()}
                >
                  {isAssigningArtist
                    ? "Assigning artist…"
                    : "Continue to Review"}
                </Button>
              </div>
            </div>
          )}

          {currentStep === "treatments" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Treatment Selection
              </h3>

              {selectedUser && (
                <Card
                  className="p-4 border-2"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FAF7F5",
                  }}
                >
                  <p className="text-sm text-gray-600">
                    Selected User:
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: "#3D3935" }}
                  >
                    {selectedUser.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedUser.email}
                  </p>
                </Card>
              )}

              <div>
                <Label style={{ color: "#3D3935" }}>
                  Number of People
                </Label>
                <Select
                  value={numberOfPeople.toString()}
                  onValueChange={(v) => {
                    const newNum = parseInt(v);
                    setNumberOfPeople(newNum);
                    if (newNum < numberOfPeople) {
                      setTreatments(
                        treatments.filter(
                          (t) => t.personNumber <= newNum,
                        ),
                      );
                    }
                    setCurrentPersonIndex(0);
                  }}
                >
                  <SelectTrigger
                    className="border-2"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                      >
                        {num} {num === 1 ? "Person" : "People"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h4
                  className="font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Choose Services for Person{" "}
                  {currentPersonIndex + 1} of {numberOfPeople}
                </h4>
                <p className="text-sm text-gray-600">
                  Select one or more services for{" "}
                  {numberOfPeople > 1
                    ? `person ${currentPersonIndex + 1}`
                    : "this booking"}
                  . Click a service to add it.
                </p>

                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                  {treatments.filter(
                    (s) =>
                      s.personNumber === currentPersonIndex + 1,
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
                          <Check
                            style={{ color: "#3D3935" }}
                            size={18}
                          />
                          <p
                            className="text-sm font-bold"
                            style={{ color: "#3D3935" }}
                          >
                            Selected for Person{" "}
                            {currentPersonIndex + 1}:
                          </p>
                        </div>
                        <div className="space-y-2">
                          {treatments
                            .map((service, index) => ({
                              service,
                              originalIndex: index,
                            }))
                            .filter(
                              ({ service }) =>
                                service.personNumber ===
                                currentPersonIndex + 1,
                            )
                            .map(
                              ({ service, originalIndex }) => {
                                const serviceTotal =
                                  service.price +
                                  (service.addOns?.reduce(
                                    (sum, a) => sum + a.price,
                                    0,
                                  ) || 0);
                                const serviceDuration =
                                  service.duration +
                                  (service.addOns?.reduce(
                                    (sum, a) =>
                                      sum + a.duration,
                                    0,
                                  ) || 0);

                                return (
                                  <div
                                    key={originalIndex}
                                    className="p-3 rounded border"
                                    style={{
                                      backgroundColor:
                                        "#FEFCFA",
                                      borderColor: "#DCD4CD",
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-800">
                                          {service.serviceName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {serviceDuration} min
                                        </p>
                                        {service.addOns &&
                                          service.addOns
                                            .length > 0 && (
                                            <div className="mt-1.5 space-y-0.5">
                                              {service.addOns.map(
                                                (addOn, i) => (
                                                  <p
                                                    key={i}
                                                    className="text-xs"
                                                    style={{
                                                      color:
                                                        "#3D3935",
                                                    }}
                                                  >
                                                    +{" "}
                                                    {addOn.name}{" "}
                                                    (£
                                                    {
                                                      addOn.price
                                                    }
                                                    )
                                                  </p>
                                                ),
                                              )}
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
                                            handleRemoveService(
                                              originalIndex,
                                            )
                                          }
                                          className="h-8 px-2"
                                          style={{
                                            color: "#3D3935",
                                          }}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!selectedServiceForAddOns && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Available Services - Click to select:
                      </p>
                      <div className="space-y-2">
                        {services
                          .filter((s) => !s.is_add_on)
                          .map((service) => {
                            const currentPersonServices =
                              treatments.filter(
                                (s) =>
                                  s.personNumber ===
                                  currentPersonIndex + 1,
                              );
                            const isAlreadySelected =
                              currentPersonServices.some(
                                (s) =>
                                  s.serviceName ===
                                  service.name,
                              );

                            return (
                              <div
                                key={service.id}
                                className={`border rounded p-3 transition-all ${
                                  isAlreadySelected
                                    ? "opacity-50 cursor-not-allowed border-[#E9CFCA]"
                                    : "cursor-pointer hover:border-[#E9CFCA] border-[#DCD4CD]"
                                }`}
                                style={
                                  isAlreadySelected
                                    ? {
                                        backgroundColor:
                                          "#FAF7F5",
                                      }
                                    : {}
                                }
                                onClick={() => {
                                  if (
                                    !isAlreadySelected &&
                                    !selectedServiceForAddOns
                                  ) {
                                    handleServiceClick(
                                      service.name,
                                      service.id!,
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
                                        style={{
                                          color: "#3D3935",
                                        }}
                                      >
                                        {service.name}
                                      </span>
                                      {isAlreadySelected && (
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded"
                                          style={{
                                            backgroundColor:
                                              "#E9CFCA",
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
                          })}
                      </div>
                    </div>
                  )}

                  {selectedServiceForAddOns && (
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
                              Select optional add-ons for this
                              service:
                            </p>
                          </div>

                          <Separator className="my-3" />

                          <div className="space-y-2 mb-3">
                            {addOnServices.map((addOn) => {
                              const isSelected =
                                tempAddOns.some(
                                  (a) => a.id === addOn.id,
                                );

                              return (
                                <div
                                  key={addOn.id}
                                  className={`border rounded p-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-[#E9CFCA]"
                                      : "hover:border-[#E9CFCA] border-[#DCD4CD]"
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          backgroundColor:
                                            "#FAF7F5",
                                          boxShadow:
                                            "0 2px 4px rgba(0, 0, 0, 0.1)",
                                        }
                                      : {
                                          backgroundColor:
                                            "#FEFCFA",
                                        }
                                  }
                                  onClick={() =>
                                    handleAddOnToggle(
                                      addOn.name,
                                      addOn.id!,
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
                                      style={{
                                        color: "#3D3935",
                                      }}
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
                              onClick={
                                handleAddServiceWithAddOns
                              }
                              className="flex-1 transition-all"
                              style={{
                                backgroundColor: "#3D3935",
                                color: "#E9CFCA",
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

                {!selectedServiceForAddOns && (
                  <>
                    {treatments.length > 0 && (
                      <Card
                        className="border-2"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FAF7F5",
                        }}
                      >
                        <CardContent className="p-4">
                          <h4
                            className="font-medium mb-2"
                            style={{ color: "#3D3935" }}
                          >
                            Price Summary
                          </h4>
                          <div className="space-y-1 text-sm">
                            {treatments.map(
                              (treatment, idx) => {
                                const serviceTotal =
                                  treatment.price +
                                  (treatment.addOns?.reduce(
                                    (sum, a) => sum + a.price,
                                    0,
                                  ) || 0);
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <span className="text-gray-600">
                                      Person{" "}
                                      {treatment.personNumber}:{" "}
                                      {treatment.serviceName}
                                      {treatment.addOns &&
                                        treatment.addOns
                                          .length > 0 &&
                                        ` (+${treatment.addOns.length} add-on${treatment.addOns.length > 1 ? "s" : ""})`}
                                    </span>
                                    <span
                                      style={{
                                        color: "#3D3935",
                                      }}
                                    >
                                      £{serviceTotal}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold">
                              <span
                                style={{ color: "#3D3935" }}
                              >
                                Total
                              </span>
                              <span
                                style={{ color: "#3D3935" }}
                              >
                                £{totalAmount}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Total Duration</span>
                              <span>
                                {totalDuration} minutes
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <div className="flex gap-3 pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (currentPersonIndex > 0) {
                            setCurrentPersonIndex(
                              currentPersonIndex - 1,
                            );
                          } else {
                            setCurrentStep("user");
                          }
                        }}
                        className="flex-1 hover:bg-[#DCD4CD]"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleContinueToNextPerson}
                        className="flex-1"
                        style={{
                          backgroundColor:
                            treatments.filter(
                              (s) =>
                                s.personNumber ===
                                currentPersonIndex + 1,
                            ).length > 0
                              ? "#E9CFCA"
                              : "#DCD4CD",
                          borderColor: "#3D3935",
                          color: "#3D3935",
                        }}
                        disabled={
                          treatments.filter(
                            (s) =>
                              s.personNumber ===
                              currentPersonIndex + 1,
                          ).length === 0
                        }
                      >
                        {currentPersonIndex + 1 < numberOfPeople
                          ? `Continue to Person ${currentPersonIndex + 2}`
                          : "Continue"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-4">
              <h3
                className="font-semibold"
                style={{ color: "#3D3935" }}
              >
                Review & Finalize
              </h3>

              <Card
                className="p-4 border-2"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <h4
                  className="font-medium mb-3"
                  style={{ color: "#3D3935" }}
                >
                  Appointment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Client:
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {selectedUser?.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Date & Time:
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {selectedDate?.toLocaleDateString()} at{" "}
                      {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600">
                      Artist:
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {selectedArtistName || "—"}
                    </span>
                  </div>
                  {schedulePreference === "date" &&
                    selectedDate &&
                    selectedTime && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-2 text-sm"
                          style={{
                            borderColor: "#3D3935",
                            color: "#3D3935",
                          }}
                          onClick={() =>
                            setShowArtistOverride(
                              (prev) => !prev,
                            )
                          }
                        >
                          {showArtistOverride
                            ? "Hide artist change"
                            : "Change assigned artist"}
                        </Button>
                        {showArtistOverride && (
                          <div className="mt-3">
                            <ArtistSelectionSection
                              districtName={address.district}
                              serviceIds={serviceIdsForSchedule}
                              date={selectedDate}
                              time={selectedTime}
                              durationMinutes={
                                totalDuration || 60
                              }
                              bufferMinutes={activeBuffer}
                              excludeBookingId={excludeBookingId}
                              selectedArtistId={selectedArtistId}
                              onSelect={(artistId, artist) => {
                                setSelectedArtistId(artistId);
                                setSelectedArtistName(
                                  artist
                                    ? formatArtistDisplayName(
                                        artist,
                                      )
                                    : "",
                                );
                              }}
                              onBack={() =>
                                setShowArtistOverride(false)
                              }
                              onContinue={() =>
                                setShowArtistOverride(false)
                              }
                              continueLabel="Done"
                              description="Override the auto-assigned artist for this slot."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Number of People:
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {numberOfPeople}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Duration:
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      {totalDuration} minutes
                    </span>
                  </div>
                </div>
              </Card>

              {/* Promo Code */}
              {mode === "create" && (
                <div>
                  <Label style={{ color: "#3D3935" }}>
                    Promo Code
                  </Label>
                  {appliedPromo ? (
                    <div
                      className="mt-2 flex items-center justify-between px-3 py-2 border-2"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FAF7F5",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{ color: "#3D3935" }}
                        >
                          {appliedPromo.code}
                        </span>
                        <span className="text-sm text-gray-600">
                          — £
                          {appliedPromo.discountAmount.toFixed(
                            2,
                          )}{" "}
                          off
                        </span>
                      </div>
                      <button
                        className="text-sm underline"
                        style={{ color: "#8B2C2C" }}
                        onClick={handleRemovePromo}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(
                            e.target.value.toUpperCase(),
                          );
                          setPromoResult(null);
                        }}
                        className="border-2 font-mono"
                        style={{ borderColor: "#DCD4CD" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleApplyPromo();
                        }}
                      />
                      <Button
                        type="button"
                        disabled={
                          !promoCodeInput.trim() ||
                          promoValidating
                        }
                        className="border-2 whitespace-nowrap"
                        style={{
                          backgroundColor: "#3D3935",
                          borderColor: "#3D3935",
                          color: "#FEFCFA",
                        }}
                        onClick={handleApplyPromo}
                      >
                        {promoValidating
                          ? "Checking…"
                          : "Apply"}
                      </Button>
                    </div>
                  )}
                  {promoResult && !promoResult.valid && (
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "#8B2C2C" }}
                    >
                      {promoResult.error}
                    </p>
                  )}
                  {promoResult && promoResult.valid && (
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "#2E6B30" }}
                    >
                      Code applied! Saving £
                      {promoResult.discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Price Summary */}
              <div
                className="p-4 border-2"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <h4
                  className="font-medium mb-3 text-sm"
                  style={{ color: "#3D3935" }}
                >
                  Price Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      £{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {appliedPromo && (
                    <div
                      className="flex justify-between"
                      style={{ color: "#2E6B30" }}
                    >
                      <span>
                        Discount ({appliedPromo.code})
                      </span>
                      <span>
                        −£
                        {appliedPromo.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span style={{ color: "#3D3935" }}>
                      Total
                    </span>
                    <span style={{ color: "#3D3935" }}>
                      £
                      {(appliedPromo
                        ? appliedPromo.finalTotal
                        : totalAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label style={{ color: "#3D3935" }}>
                    Address
                  </Label>
                  {selectedUserId &&
                    users.find((u) => u.id === selectedUserId)
                      ?.address && (
                      <span
                        className="text-xs px-2 py-1"
                        style={{
                          backgroundColor: "#E9CFCA",
                          color: "#3D3935",
                        }}
                      >
                        ✓ Auto-filled from user profile
                      </span>
                    )}
                </div>
                <Input
                  placeholder="Full Address (e.g., 123 High Street)"
                  value={address.fullAddress}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      fullAddress: e.target.value,
                    })
                  }
                  className="border-2"
                  style={{ borderColor: "#DCD4CD" }}
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Select
                    value={address.district}
                    onValueChange={(v) =>
                      setAddress({ ...address, district: v })
                    }
                  >
                    <SelectTrigger
                      className="border-2"
                      style={{ borderColor: "#DCD4CD" }}
                    >
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem
                          key={district.id}
                          value={district.name}
                        >
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label style={{ color: "#3D3935" }}>
                  Payment Status
                </Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) =>
                    setPaymentStatus(v as any)
                  }
                >
                  <SelectTrigger
                    className="border-2 mt-2"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.PAID}>
                      Paid
                    </SelectItem>
                    <SelectItem
                      value={PaymentStatus.PARTIALL_PAID}
                    >
                      Partially Paid
                    </SelectItem>
                    <SelectItem
                      value={PaymentStatus.PARTIALL_REFUNDED}
                    >
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

              <div>
                <Label style={{ color: "#3D3935" }}>
                  Notes (Optional)
                </Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special notes or instructions..."
                  rows={3}
                  className="w-full p-3 border-2 rounded-md resize-none mt-2"
                  style={{
                    borderColor: "#DCD4CD",
                    color: "#3D3935",
                  }}
                />
              </div>

              <div
                className="flex justify-between pt-4 border-t-2"
                style={{ borderColor: "#DCD4CD" }}
              >
                <Button
                  type="button"
                  className="border-2"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={() => setCurrentStep("time")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  className="border-2"
                  style={{
                    backgroundColor: "#E9CFCA",
                    borderColor: "#3D3935",
                    color: "#3D3935",
                  }}
                  onClick={handleSubmit}
                >
                  {loading
                    ? "Saving..."
                    : mode === "reschedule"
                      ? "Reschedule Appointment"
                      : "Create Appointment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}