import {
  Edit,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  ImagePlus,
  Loader2,
  Trash2,
  Star,
  Film,
  GripVertical,
  Plus,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
} from "../../lib/db/testimonials";
import { uploadImageAndGetUrl } from "../../utils/uploadImageAndGetUrl";
import {
  createContentSection,
  createLookbookSection,
  deleteHeroSectionImage,
  deleteLookbook,
  getContentSectionByName,
  getlookbooks,
  updateContentSection,
  updateHeroPosition,
  updateLookbooksPosition,
} from "../../lib/db/content";
import {
  getAllDistricts,
  createDistrict,
  deleteDistrict,
} from "../../lib/db/districts";
import {
  getContactAndHours,
  saveContactAndHours,
} from "../../lib/db/studio-contact";
import { getWhyChooseUs, saveWhyChooseUs } from "../../lib/db/why-choose-us";
import { mapBusinessHourToHourRow } from "../../schema/studio-contact.schema";
import { DEFAULT_WHY_ITEMS, WhyCard } from "../../schema/why-choose-us.schema";
import { getAllServices } from "../../lib/db/services";
import { Service } from "../../schema/service.schema";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "../../../components/ui/dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

// Types for section content fields
interface SectionFields {
  [key: string]: string;
}

interface SectionConfig {
  title: string;
  fields: { key: string; label: string }[];
}

interface Testimonial {
  id: string;
  client_name: string;
  initials: string;
  rating: number;
  comment: string;
  service_type: string;
  is_featured: boolean;
  is_published: boolean;
}

const MB_IN_BYTES = 1024 * 1024;
const HERO_MEDIA_IMAGE_FORMATS = ["png", "jpeg", "jpg", "webp"] as const;
const HERO_MEDIA_VIDEO_FORMATS = ["mp4"] as const;
const HERO_MEDIA_IMAGE_MAX_SIZE_MB = 5;
const HERO_MEDIA_VIDEO_MAX_SIZE_MB = 10;
const HERO_MEDIA_ACCEPT = [
  ...HERO_MEDIA_IMAGE_FORMATS.map((format) => `.${format}`),
  ...HERO_MEDIA_VIDEO_FORMATS.map((format) => `.${format}`),
].join(",");
const HERO_MEDIA_IMAGE_MAX_SIZE = HERO_MEDIA_IMAGE_MAX_SIZE_MB * MB_IN_BYTES;
const HERO_MEDIA_VIDEO_MAX_SIZE = HERO_MEDIA_VIDEO_MAX_SIZE_MB * MB_IN_BYTES;
const LOOKBOOK_IMAGE_FORMATS = ["png", "jpeg", "jpg", "webp"] as const;
const LOOKBOOK_IMAGE_MAX_SIZE_MB = 5;
const LOOKBOOK_IMAGE_ACCEPT = LOOKBOOK_IMAGE_FORMATS.map(
  (format) => `.${format}`,
).join(",");
const LOOKBOOK_IMAGE_MAX_SIZE = LOOKBOOK_IMAGE_MAX_SIZE_MB * MB_IN_BYTES;

// Default content data for each homepage sub-section
const defaultContentData: Record<string, SectionFields> = {
  hero: {
    headline: "",
    subheadline: "",
  },
  instagram: {
    handle: "@pearlwishesstudio",
  },
};

// Section configs define labels for each field
const sectionConfigs: Record<string, SectionConfig> = {
  hero: {
    title: "Hero Section",
    fields: [
      { key: "headline", label: "Main Headline" },
      { key: "subheadline", label: "Subheadline" },
    ],
  },
  instagram: {
    title: "Instagram Section",
    fields: [{ key: "handle", label: "Instagram Handle" }],
  },
};

// Hero media file type
interface HeroMediaFile {
  id: string;
  url: string;
  name: string;
  type: "image" | "video";
}

// Lookbook image file type
interface LookbookImage {
  id: string;
  image_url: string;
  title: string;
  position: number; // 1-10 for the 10 positions in the grid
}

const DRAG_TYPE = "HERO_MEDIA";
const LOOKBOOK_DRAG_TYPE = "LOOKBOOK_IMAGE";

// ── About page types ──────────────────────────────────────────────────────────
interface AboutMainFields {
  title: string;
  description: string;
}
interface HourRow {
  id: string;
  day: string;
  time: string;
}
interface AwardCard {
  id: string;
  imageUrl: string;
  name: string;
  year: string;
  issuer: string;
}
interface ContactFields {
  id?: string;
  phone: string;
  email: string;
  address: string;
}

interface DragItem {
  index: number;
  originalIndex?: number;
  id: string;
}

interface Distirct {
  id: string;
  name: string;
}

// Draggable media thumbnail component
function DraggableMediaThumb({
  file,
  index,
  isEditing,
  content_url,
  content_type,
  onRemove,
  moveMedia,
  onDropComplete,
}: {
  file: HeroMediaFile;
  index: number;
  isEditing: boolean;
  onRemove: (id: string) => void;
  moveMedia: (dragIndex: number, hoverIndex: number) => void;
  onDropComplete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index, originalIndex: index, id: file.id },
    canDrag: isEditing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end(item) {
      if (
        item?.originalIndex !== undefined &&
        item.index !== item.originalIndex
      ) {
        onDropComplete();
      }
    },
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DRAG_TYPE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveMedia(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="relative group rounded-md overflow-hidden border-2 transition-all"
      style={{
        borderColor: isOver ? "#D0A096" : index === 0 ? "#D0A096" : "#DCD4CD",
        aspectRatio: "16 / 9",
        opacity: isDragging ? 0.4 : 1,
        cursor: isEditing ? "grab" : "default",
      }}
    >
      {content_type === "video" ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#3D3935" }}
        >
          <Film className="w-8 h-8" style={{ color: "#EADDD5" }} />
        </div>
      ) : (
        <img
          src={content_url}
          alt={file.name}
          className="w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Drag handle in edit mode */}
      {isEditing && (
        <div
          className="absolute top-1.5 left-1.5 p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(61, 57, 53, 0.7)" }}
        >
          <GripVertical className="w-3.5 h-3.5" style={{ color: "#FAF7F5" }} />
        </div>
      )}

      {/* Cover badge */}
      {index === 0 && (
        <div
          className="absolute flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs"
          style={{
            background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
            color: "#3D3935",
            top: "6px",
            left: isEditing ? "30px" : "6px",
          }}
        >
          <Star className="w-3 h-3" />
          Cover
        </div>
      )}

      {/* Filename overlay */}
      <div
        className="absolute bottom-0 inset-x-0 px-2 py-1 text-xs truncate"
        style={{
          backgroundColor: "rgba(61, 57, 53, 0.7)",
          color: "#FAF7F5",
        }}
      >
        {file.name}
      </div>

      {/* Remove button in edit mode */}
      {isEditing && (
        <button
          className="absolute top-1.5 right-1.5 p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(61, 57, 53, 0.7)" }}
          onClick={() => onRemove(file.id)}
        >
          <Trash2 className="w-3.5 h-3.5" style={{ color: "#FAF7F5" }} />
        </button>
      )}
    </div>
  );
}

// Draggable lookbook image component
function DraggableLookbookImage({
  image,
  index,
  onRemove,
  moveImage,
  onDropComplete,
}: {
  image: LookbookImage;
  index: number;
  onRemove: (id: string) => void;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  onDropComplete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: LOOKBOOK_DRAG_TYPE,
    item: { index, originalIndex: index, id: image.id },
    end(item) {
      if (
        item?.originalIndex !== undefined &&
        item.index !== item.originalIndex
      ) {
        onDropComplete();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: LOOKBOOK_DRAG_TYPE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="relative group aspect-square border-2 rounded overflow-hidden transition-all"
      style={{
        borderColor: isOver ? "#D0A096" : "#DCD4CD",
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
      }}
    >
      <img
        src={image.image_url}
        alt={image.title}
        className="w-full h-full object-cover"
      />

      {/* Drag handle */}
      <div
        className="absolute top-1.5 left-1.5 p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "rgba(61, 57, 53, 0.7)" }}
      >
        <GripVertical className="w-3.5 h-3.5" style={{ color: "#FAF7F5" }} />
      </div>

      {/* Position badge */}
      <div
        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-sm text-xs font-medium"
        style={{
          backgroundColor: "rgba(61, 57, 53, 0.7)",
          color: "#FAF7F5",
        }}
      >
        #{image.position}
      </div>

      {/* Filename overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate"
        style={{
          backgroundColor: "rgba(61, 57, 53, 0.7)",
          color: "#FAF7F5",
        }}
      >
        {image.title}
      </div>

      {/* Remove button */}
      <button
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "rgba(61, 57, 53, 0.9)" }}
        onClick={() => onRemove(image.id)}
      >
        <Trash2 className="w-4 h-4" style={{ color: "#FAF7F5" }} />
      </button>
    </div>
  );
}

export function AdminContent() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "homepage",
  );
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [contentData, setContentData] =
    useState<Record<string, SectionFields>>(defaultContentData);
  const [editDraft, setEditDraft] = useState<SectionFields>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [heroMedia, setHeroMedia] = useState<HeroMediaFile[]>([]);
  const [heroMediaDraft, setHeroMediaDraft] = useState<HeroMediaFile[]>([]);
  const [heroMediaError, setHeroMediaError] = useState<string | null>(null);
  const [isHeroMediaUploading, setIsHeroMediaUploading] = useState(false);
  const heroMediaDraftRef = useRef<HeroMediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instagramData, setInstagramData] = useState({
    id: null,
    title: "", //@pearlwishesstudio
    subtitle: "instagram",
    section_name: "instagram",
    description: "",
    content_url: "",
    position: 0,
    is_active: true,
    content_type: "text",
  });
  const [isEditingInsta, setIsEditingInsta] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsDraft, setTestimonialsDraft] = useState<Testimonial[]>([]);
  const [editingTestimonialId, setEditingTestimonialId] = useState<
    string | null
  >(null);

  const [testimonialForm, setTestimonialForm] = useState<Testimonial>({
    id: "",
    client_name: "",
    initials: "",
    rating: 5,
    comment: "",
    service_type: "",
    is_featured: true,
    is_published: true,
  });

  // Districts state
  const [districts, setDistricts] = useState<{
    available: Distirct[];
    comingSoon: Distirct[];
  }>({ available: [], comingSoon: [] });
  const [districtsDraft, setDistrictsDraft] = useState<{
    available: Distirct[];
    comingSoon: Distirct[];
  }>({ available: [], comingSoon: [] });
  const [newDistrictName, setNewDistrictName] = useState("");
  const [addingToCategory, setAddingToCategory] = useState<
    "available" | "comingSoon" | null
  >(null);

  // Lookbook state
  const [lookbookImages, setLookbookImages] = useState<LookbookImage[]>([]);
  const [lookbookDraft, setLookbookDraft] = useState<LookbookImage[]>([]);
  const lookbookDraftRef = useRef<LookbookImage[]>([]);
  const lookbookFileInputRef = useRef<HTMLInputElement>(null);
  const [lookbookError, setLookbookError] = useState<string | null>(null);
  const [isLookbookUploading, setIsLookbookUploading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);

  // ── About page state ────────────────────────────────────────────────────────
  const [editingAboutCard, setEditingAboutCard] = useState<string | null>(null);
  const [aboutSaved, setAboutSaved] = useState<string | null>(null);

  const [aboutMain, setAboutMain] = useState<AboutMainFields>({
    title: "About Pearl Wishes Studio",
    description:
      "Pearl Wishes Studio is London's premier mobile nail care service, bringing luxury treatments directly to your door. Founded with a passion for exceptional nail artistry and client convenience, we combine professional-grade products with personalised care.",
  });
  const [aboutMainDraft, setAboutMainDraft] = useState<AboutMainFields>({
    title: "",
    description: "",
  });

  const [whyItems, setWhyItems] = useState<WhyCard[]>(DEFAULT_WHY_ITEMS);
  const [whyDraft, setWhyDraft] = useState<WhyCard[]>([]);
  const whyFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const whyPendingFiles = useRef<Record<string, File>>({});
  const [isSavingWhy, setIsSavingWhy] = useState(false);

  const [contactInfo, setContactInfo] = useState<ContactFields>({
    phone: "+44 20 7946 0958",
    email: "hello@pearlwishesstudio.co.uk",
    address: "London, United Kingdom",
  });
  const [contactDraft, setContactDraft] = useState<ContactFields>({
    phone: "",
    email: "",
    address: "",
  });

  const [businessHoursData, setBusinessHoursData] = useState<HourRow[]>([
    { id: "bh1", day: "Monday", time: "9:00 AM – 7:00 PM" },
    { id: "bh2", day: "Tuesday", time: "9:00 AM – 7:00 PM" },
    { id: "bh3", day: "Wednesday", time: "9:00 AM – 7:00 PM" },
    { id: "bh4", day: "Thursday", time: "9:00 AM – 8:00 PM" },
    { id: "bh5", day: "Friday", time: "9:00 AM – 8:00 PM" },
    { id: "bh6", day: "Saturday", time: "10:00 AM – 6:00 PM" },
    { id: "bh7", day: "Sunday", time: "Closed" },
  ]);
  const [hoursDraft, setHoursDraft] = useState<HourRow[]>([]);
  const [isSavingContact, setIsSavingContact] = useState(false);

  const [awardItems, setAwardItems] = useState<AwardCard[]>([
    {
      id: "a1",
      imageUrl: "",
      name: "Best Mobile Beauty Service",
      year: "2023",
      issuer: "London Beauty Awards",
    },
    {
      id: "a2",
      imageUrl: "",
      name: "Five Star Excellence",
      year: "2024",
      issuer: "UK Nail Industry Association",
    },
  ]);
  const [awardsDraft, setAwardsDraft] = useState<AwardCard[]>([]);
  const awardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const flashAboutSaved = (key: string) => {
    setAboutSaved(key);
    setTimeout(() => setAboutSaved(null), 2500);
  };

  const getTestimonialSection = async () => {
    const testimonials = await getAllTestimonials();
    setTestimonials(testimonials);
  };

  const getHeroSection = async () => {
    try {
      const data = await getContentSectionByName("hero");

      if (!data) {
        console.warn("No content section found for 'hero'");
        return;
      }

      console.log("Fetched content section:", data);

      setContentData((prev) => ({
        ...prev,
        hero: {
          headline: data[0]?.title || "Luxury nail care at your doorstep",
          subheadline:
            data[0]?.subtitle || "Premium mobile nail treatments in London",
        },
      }));
      setHeroMedia(data || []);
    } catch (error) {
      console.error("Error fetching content section:", error);
    }
  };

  const getInsta = async () => {
    try {
      const data = await getContentSectionByName("instagram");

      if (!data) {
        console.warn("No content section found for 'instagram'");
        return;
      }

      console.log("Fetched content section:", data);

      setInstagramData({
        ...instagramData,
        id: data[0]?.id || null,
        title: data[0]?.title || "",
        subtitle: data[0]?.subtitle || "",
      });
    } catch (error) {
      console.error("Error fetching content section:", error);
    }
  };

  const getlookbookSection = async () => {
    try {
      const data = await getlookbooks();

      if (!data) {
        console.warn("No datafound for lookbooks");
        return;
      }

      setLookbookImages(data || []);
      setLookbookImages(data || []);
    } catch (error) {
      console.error("Error fetching content section:", error);
    }
  };

  const getDistricts = async () => {
    try {
      const data = await getAllDistricts();

      if (!data) {
        console.warn("No datafound for districts");
        return;
      }

      console.log("Fetched Districts:", data);

      setDistricts((prev) => ({
        available: data.available.map((d) => ({
          id: d.id,
          name: d.name,
        })),
        comingSoon: data.comingSoon.map((d) => ({
          id: d.id,
          name: d.name,
        })),
      }));
    } catch (error) {
      console.error("Error fetching content section:", error);
    }
  };

  const getServices = async () => {
    try {
      const data = await getAllServices();

      if (!data) {
        console.warn("No datafound for services");
        return;
      }
      console.log("Fetched services:", data);
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const getWhyChooseUsSection = async () => {
    try {
      const data = await getWhyChooseUs();

      if (data.length > 0) {
        setWhyItems(data);
      }
    } catch (error) {
      console.error("Error fetching why choose us cards:", error);
    }
  };

  const getContactSection = async () => {
    try {
      const data = await getContactAndHours();

      if (data.contact) {
        setContactInfo({
          id: data.contact.id,
          phone: data.contact.phone,
          email: data.contact.email,
          address: data.contact.address,
        });
      }

      if (data.hours.length > 0) {
        setBusinessHoursData(data.hours.map(mapBusinessHourToHourRow));
      }
    } catch (error) {
      console.error("Error fetching contact and business hours:", error);
    }
  };

  useEffect(() => {
    getTestimonialSection();
    getHeroSection();
    getlookbookSection();
    getInsta();
    getDistricts();
    getServices();
    getContactSection();
    getWhyChooseUsSection();
  }, []);

  useEffect(() => {
    heroMediaDraftRef.current = heroMediaDraft;
  }, [heroMediaDraft]);

  useEffect(() => {
    lookbookDraftRef.current = lookbookDraft;
  }, [lookbookDraft]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleEdit = (sectionKey: string) => {
    setEditingCard(sectionKey);
    setEditDraft({ ...contentData[sectionKey] });
    if (sectionKey === "hero") {
      setHeroMediaDraft([...heroMedia]);
      setHeroMediaError(null);
    }
    if (sectionKey === "testimonials") {
      setTestimonialsDraft([...testimonials]);
    }
    if (sectionKey === "districts") {
      setDistrictsDraft({ ...districts });
    }
    if (sectionKey === "lookbook") {
      setLookbookDraft([...lookbookImages]);
      setLookbookError(null);
    }
    setSavedMessage(null);
  };

  const handleCancel = () => {
    setEditingCard(null);
    setEditDraft({});
    setHeroMediaDraft([]);
    setTestimonialsDraft([]);
    setEditingTestimonialId(null);
    setDistrictsDraft({ available: [], comingSoon: [] });
    setAddingToCategory(null);
    setNewDistrictName("");
    setLookbookDraft([]);
    setHeroMediaError(null);
    setLookbookError(null);
  };

  const handleSave = (sectionKey: string) => {
    console.log("handleSave", sectionKey);
    if (sectionKey === "testimonials") {
      // Validate divisible by 3
      if (testimonialsDraft.length % 3 !== 0) {
        alert(
          `The total number of testimonials must be divisible by 3. Current: ${testimonialsDraft.length}`,
        );
        return;
      }
      setTestimonials([...testimonialsDraft]);
      setTestimonialsDraft([]);
      setEditingCard(null);
      setSavedMessage(sectionKey);
      setTimeout(() => setSavedMessage(null), 2500);
      return;
    }

    if (sectionKey === "districts") {
      setDistricts({ ...districtsDraft });
      setDistrictsDraft({ available: [], comingSoon: [] });
      setEditingCard(null);
      setSavedMessage(sectionKey);
      setTimeout(() => setSavedMessage(null), 2500);
      return;
    }

    if (sectionKey === "lookbook") {
      setLookbookImages([...lookbookDraft]);
      setLookbookDraft([]);
      setEditingCard(null);
      setSavedMessage(sectionKey);
      setTimeout(() => setSavedMessage(null), 2500);
      return;
    }

    setContentData((prev) => ({
      ...prev,
      [sectionKey]: { ...editDraft },
    }));
    if (sectionKey === "hero") {
      setHeroMedia([...heroMediaDraft]);
      setHeroMediaDraft([]);
      const content = {
        section_name: "hero",
        title: editDraft.headline || "headline",
        subtitle: editDraft.subheadline || "subheadline",
        description: editDraft.description || "description",
        position: 0,
        is_active: true,
      };
      console.log("content", content);
      updateContentSection("hero", content);
    }
    setEditingCard(null);
    setEditDraft({});
    setSavedMessage(sectionKey);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const saveInstagramHandle = () => {
    setIsEditingInsta(false);
    try {
      const content = {
        ...instagramData,
      };
      console.log("content", content);
      if (!instagramData.id) {
        createContentSection(content);
      } else {
        updateContentSection("instagram", content);
      }
    } catch (error) {}
  };

  // Testimonial handlers
  const handleAddTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: crypto.randomUUID(),
      client_name: "",
      initials: "",
      rating: 5,
      comment: "",
      service_type: "",
      is_featured: true,
      is_published: true,
    };
    // Add to draft immediately so it appears in the list
    setTestimonialsDraft((prev) => [...prev, newTestimonial]);
    setEditingTestimonialId(newTestimonial.id);
    setTestimonialForm(newTestimonial);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({ ...testimonial });
  };

  const handleSaveTestimonial = async () => {
    if (
      !testimonialForm.client_name ||
      !testimonialForm.comment ||
      !testimonialForm.service_type
    ) {
      alert("Please fill in all required fields (Name, Text, Service)");
      return;
    }

    // Auto-generate initials if not provided
    if (!testimonialForm.initials && testimonialForm.client_name) {
      const names = testimonialForm.client_name.trim().split(" ");
      const initials =
        names.length >= 2
          ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
          : `${names[0][0]}${names[0][1] || ""}`.toUpperCase();
      testimonialForm.initials = initials;
    }

    const res = await createTestimonial({ ...testimonialForm });
    console.log("res ==> ", res);
    // Update existing testimonial in draft
    setTestimonials((prev) => [...prev.filter((t) => t.id !== res.id), res]);
    setTestimonialsDraft((prev) => [
      ...prev.filter((t) => t.id !== res.id),
      res,
    ]);
    setEditingTestimonialId(null);
    setTestimonialForm({
      id: "",
      client_name: "",
      initials: "",
      rating: 5,
      comment: "",
      service_type: "",
    });
  };

  const handleCancelTestimonialEdit = () => {
    // If it's a new testimonial with empty fields, remove it from draft
    const testimonial = testimonialsDraft.find(
      (t) => t.id === editingTestimonialId,
    );
    if (
      testimonial &&
      !testimonial.client_name &&
      !testimonial.comment &&
      !testimonial.service_type
    ) {
      setTestimonialsDraft((prev) =>
        prev.filter((t) => t.id !== editingTestimonialId),
      );
    }
    setEditingTestimonialId(null);
    setTestimonialForm({
      id: "",
      name: "",
      initials: "",
      rating: 5,
      text: "",
      service: "",
    });
  };

  const handleDeleteTestimonial = async (id: string) => {
    const success = await deleteTestimonial(id);
    if (success) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setTestimonialsDraft((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // District handlers
  const handleSaveNewDistrict = async (name: string, isComingSoon: boolean) => {
    try {
      const res = await createDistrict({
        name,
        is_coming_soon: isComingSoon,
        is_active: true,
      });

      console.log("res", res);

      if (res) {
        setDistrictsDraft((prev) => ({
          ...prev,
          [isComingSoon ? "comingSoon" : "available"]: [
            ...prev[isComingSoon ? "comingSoon" : "available"],
            res,
          ],
        }));
        setDistricts((prev) => ({
          ...prev,
          [isComingSoon ? "comingSoon" : "available"]: [
            ...prev[isComingSoon ? "comingSoon" : "available"],
            res,
          ],
        }));
      }

      setNewDistrictName("");
      setAddingToCategory(null);
    } catch (error) {}
  };

  const handleAddDistrict = (category: "available" | "comingSoon") => {
    setAddingToCategory(category);
    setNewDistrictName("");
  };

  const handleCancelAddDistrict = () => {
    setNewDistrictName("");
    setAddingToCategory(null);
  };

  const handleDeleteDistrict = async (
    category: "available" | "comingSoon",
    districtId: string,
  ) => {
    try {
      await deleteDistrict(districtId);
      setDistrictsDraft((prev) => ({
        ...prev,
        [category]: prev[category].filter((d) => d.id !== districtId),
      }));
      setDistricts((prev) => ({
        ...prev,
        [category]: prev[category].filter((d) => d.id !== districtId),
      }));
    } catch (error) {}
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditDraft((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const getHeroMediaValidationError = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAllowedImage =
      isImage &&
      extension &&
      HERO_MEDIA_IMAGE_FORMATS.includes(
        extension as (typeof HERO_MEDIA_IMAGE_FORMATS)[number],
      );
    const isAllowedVideo =
      isVideo &&
      extension &&
      HERO_MEDIA_VIDEO_FORMATS.includes(
        extension as (typeof HERO_MEDIA_VIDEO_FORMATS)[number],
      );

    if (!isAllowedImage && !isAllowedVideo) {
      return `${file.name}: only PNG, JPEG, WebP images or MP4 videos are allowed.`;
    }

    if (isAllowedImage && file.size > HERO_MEDIA_IMAGE_MAX_SIZE) {
      return `${file.name}: image size must be ${HERO_MEDIA_IMAGE_MAX_SIZE_MB} MB or less.`;
    }

    if (isAllowedVideo && file.size > HERO_MEDIA_VIDEO_MAX_SIZE) {
      return `${file.name}: video size must be ${HERO_MEDIA_VIDEO_MAX_SIZE_MB} MB or less.`;
    }

    return null;
  };

  const getLookbookImageValidationError = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isAllowedImage =
      isImage &&
      extension &&
      LOOKBOOK_IMAGE_FORMATS.includes(
        extension as (typeof LOOKBOOK_IMAGE_FORMATS)[number],
      );

    if (!isAllowedImage) {
      return `${file.name}: only PNG, JPEG, or WebP images are allowed.`;
    }

    if (file.size > LOOKBOOK_IMAGE_MAX_SIZE) {
      return `${file.name}: image size must be ${LOOKBOOK_IMAGE_MAX_SIZE_MB} MB or less.`;
    }

    return null;
  };

  const handleAddMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: string,
  ) => {
    if (isHeroMediaUploading) return;

    const files = e.target.files;
    if (!files) return;
    const validationError = Array.from(files)
      .map(getHeroMediaValidationError)
      .find(Boolean);

    if (validationError) {
      setHeroMediaError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setHeroMediaError(null);
    setIsHeroMediaUploading(true);

    try {
      const res = await uploadImageAndGetUrl(files[0], section);
      console.log("res", res);
      const content = {
        section_name: section,
        title: editDraft.headline || "headline",
        subtitle: editDraft.subheadline || "subheadline",
        description: editDraft.description || "description",
        position: 0,
        content_url: res,
        content_type: files[0].type.startsWith("video/") ? "video" : "image",
        is_active: true,
      };
      const newContent = await createContentSection(content);

      setHeroMediaDraft((prev) => [...prev, newContent]);
    } catch (error) {
      console.error("Error uploading hero media:", error);
      setHeroMediaError("Upload failed. Please try again.");
    } finally {
      setIsHeroMediaUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (id: string) => {
    setHeroMediaDraft((prev) => prev.filter((m) => m.id !== id));
    deleteHeroSectionImage(id);
  };

  const moveHeroImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setHeroMediaDraft((prev) => {
      const newImages = [...prev];
      const [draggedItem] = newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedItem);
      // Update positions after reordering
      const newOrder = newImages.map((img, idx) => ({
        ...img,
        position: idx + 1,
      }));
      heroMediaDraftRef.current = newOrder;
      console.log("dragIndex", dragIndex);
      console.log("hoverIndex", hoverIndex);
      console.log("newOrder", newOrder);
      return newOrder;
    });
  }, []);

  const moveLookbookImage = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setLookbookDraft((prev) => {
        const newImages = [...prev];
        const [draggedItem] = newImages.splice(dragIndex, 1);
        newImages.splice(hoverIndex, 0, draggedItem);
        // Update positions after reordering
        const newOrder = newImages.map((img, idx) => ({
          ...img,
          position: idx + 1,
        }));
        lookbookDraftRef.current = newOrder;
        return newOrder;
      });
    },
    [],
  );

  const handleLookbookDropComplete = useCallback(async () => {
    try {
      await updateLookbooksPosition(
        lookbookDraftRef.current.map(({ id, position }) => ({
          id,
          position,
        })),
      );
    } catch (error) {
      console.error("Error updating lookbook positions:", error);
    }
  }, []);

  const handleHeroDropComplete = useCallback(async () => {
    try {
      console.log("Updating hero media positions:", heroMediaDraftRef.current);
      await updateHeroPosition(
        heroMediaDraftRef.current.map(({ id, position }) => ({
          id,
          position,
        })),
      );
    } catch (error) {
      console.error("Error updating lookbook positions:", error);
    }
  }, []);

  console.log("services =========>", services);
  // Renders the hero media section (view or edit)
  const renderHeroMedia = (isEditing: boolean) => {
    const media = isEditing ? heroMediaDraft : heroMedia;

    return (
      <div className="mt-4 pt-4 border-t-2" style={{ borderColor: "#DCD4CD" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm" style={{ color: "#3D3935" }}>
              Hero Slides (Images / Videos)
            </label>
            <span
              className="text-xs px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: "#FAF7F5",
                color: "#3D3935",
              }}
            >
              {media.length}/3
            </span>
          </div>
          {isEditing && media.length < 3 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={HERO_MEDIA_ACCEPT}
                multiple
                className="hidden"
                disabled={isHeroMediaUploading}
                onChange={(val) => handleAddMedia(val, "hero")}
              />
              <Button
                className="border-2 px-3 py-1.5 text-xs gap-1.5"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                disabled={isHeroMediaUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isHeroMediaUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                {isHeroMediaUploading ? "Uploading..." : "Add File"}
              </Button>
            </>
          )}
        </div>

        {/* Specs: ratio & max file size */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: "#FAF7F5",
              color: "#3D3935",
              border: "1px solid #DCD4CD",
            }}
          >
            Ratio: 16:9
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: "#FAF7F5",
              color: "#3D3935",
              border: "1px solid #DCD4CD",
            }}
          >
            Recommended: 1920 × 1080px
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: "#FAF7F5",
              color: "#3D3935",
              border: "1px solid #DCD4CD",
            }}
          >
            Max: {HERO_MEDIA_IMAGE_MAX_SIZE_MB} MB (images) ·{" "}
            {HERO_MEDIA_VIDEO_MAX_SIZE_MB} MB (videos)
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: "#FAF7F5",
              color: "#3D3935",
              border: "1px solid #DCD4CD",
            }}
          >
            Format: PNG, JPEG, WebP · MP4
          </span>
        </div>

        {isEditing && heroMediaError && (
          <p className="text-xs mb-3" style={{ color: "#B42318" }}>
            {heroMediaError}
          </p>
        )}

        {media.length === 0 ? (
          /* Empty state upload zone */
          <button
            className="w-full border-2 border-dashed rounded-md py-10 flex flex-col items-center gap-2 transition-colors hover:border-[#D0A096]"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "#FAF7F5",
            }}
            onClick={() =>
              isEditing &&
              !isHeroMediaUploading &&
              fileInputRef.current?.click()
            }
            disabled={!isEditing || isHeroMediaUploading}
          >
            {isHeroMediaUploading ? (
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "#D0A096" }}
              />
            ) : (
              <ImagePlus className="w-8 h-8" style={{ color: "#D0A096" }} />
            )}
            <span className="text-sm" style={{ color: "#3D3935" }}>
              {isHeroMediaUploading
                ? "Uploading media..."
                : isEditing
                  ? "Click to upload images or videos"
                  : "No media uploaded"}
            </span>
            <span className="text-xs text-gray-400">
              Up to 3 files · First file is the cover · 16:9 ratio · Max{" "}
              {HERO_MEDIA_IMAGE_MAX_SIZE_MB} MB / {HERO_MEDIA_VIDEO_MAX_SIZE_MB}{" "}
              MB
            </span>
          </button>
        ) : (
          /* Media grid — 16:9 thumbnails */
          <div className="grid grid-cols-3 gap-3">
            {media.map((file, index) => (
              <DraggableMediaThumb
                key={file.id}
                file={file}
                content_url={file.content_url}
                content_type={file.content_type}
                index={index}
                isEditing={isEditing}
                onRemove={handleRemoveMedia}
                moveMedia={moveHeroImage}
                onDropComplete={handleHeroDropComplete}
              />
            ))}

            {/* Add more placeholder slot (edit mode only) */}
            {isEditing && media.length < 3 && (
              <button
                className="rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-[#D0A096]"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                  aspectRatio: "16 / 9",
                }}
                onClick={() =>
                  !isHeroMediaUploading && fileInputRef.current?.click()
                }
                disabled={isHeroMediaUploading}
              >
                {isHeroMediaUploading ? (
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "#D0A096" }}
                  />
                ) : (
                  <ImagePlus className="w-5 h-5" style={{ color: "#D0A096" }} />
                )}
                <span className="text-xs" style={{ color: "#3D3935" }}>
                  {isHeroMediaUploading ? "Uploading..." : "Add"}
                </span>
              </button>
            )}
          </div>
        )}

        {!isEditing && media.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Displayed as full-screen rotating banners (100vh · cover ·
            auto-advances every 3s)
          </p>
        )}
        {isEditing && media.length > 1 && (
          <p
            className="text-xs mt-2 flex items-center gap-1"
            style={{ color: "#D0A096" }}
          >
            <GripVertical className="w-3 h-3" />
            Drag to reorder · First position = Cover image
          </p>
        )}
      </div>
    );
  };

  // Renders a single content card (view or edit mode)
  const renderContentCard = (sectionKey: string) => {
    const config = sectionConfigs[sectionKey];
    const isEditing = editingCard === sectionKey;
    const data = contentData[sectionKey];
    const justSaved = savedMessage === sectionKey;

    return (
      <div
        key={sectionKey}
        className="p-4 border-2 rounded-md"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium" style={{ color: "#3D3935" }}>
              {config.title}
            </h4>
            {justSaved && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                Saved
              </span>
            )}
          </div>
          {!isEditing ? (
            <Button
              className="border-2 p-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
              onClick={() => handleEdit(sectionKey)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                className="border-2 px-3 py-1.5 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onClick={handleCancel}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                className="px-3 py-1.5 text-xs text-white"
                style={{
                  background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                  color: "#3D3935",
                }}
                onClick={() => handleSave(sectionKey)}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="font-medium" style={{ color: "#3D3935" }}>
                {field.label}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editDraft[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="mt-1 w-full px-3 py-2 border-2 rounded-md text-sm outline-none"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FAF7F5",
                    color: "#3D3935",
                  }}
                />
              ) : (
                <p className="text-gray-600 mt-1">{data[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Hero media section — only on hero card */}
        {sectionKey === "hero" && renderHeroMedia(isEditing)}
      </div>
    );
  };

  const renderInstagramCard = (sectionKey: string) => {
    const justSaved = false; //savedMessage === sectionKey;

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium" style={{ color: "#3D3935" }}>
              Instagram Section
            </h4>
            {justSaved && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                Saved
              </span>
            )}
          </div>
          {!isEditingInsta ? (
            <Button
              className="border-2 p-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
              onClick={() => setIsEditingInsta(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                className="border-2 px-3 py-1.5 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onClick={() => setIsEditingInsta(false)}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                className="px-3 py-1.5 text-xs text-white"
                style={{
                  background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                  color: "#3D3935",
                }}
                onClick={saveInstagramHandle}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="font-medium" style={{ color: "#3D3935" }}>
              Instagram Handle
            </label>
            {isEditingInsta ? (
              <input
                type="text"
                onChange={(e) =>
                  setInstagramData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                value={instagramData.title || ""}
                className="mt-1 w-full px-3 py-2 border-2 rounded-md text-sm outline-none"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                  color: "#3D3935",
                }}
              />
            ) : (
              <p className="text-gray-600 mt-1">{instagramData.title || ""}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renders the testimonials card
  const renderTestimonialsCard = () => {
    const isEditing = editingCard === "testimonials";
    const justSaved = savedMessage === "testimonials";
    const testimonialsData = isEditing ? testimonialsDraft : testimonials;

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium" style={{ color: "#3D3935" }}>
              Testimonials Section
            </h4>
            {justSaved && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                Saved
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor:
                  testimonialsData.length % 3 === 0 ? "#E9CFCA" : "#FAF7F5",
                color: "#3D3935",
                border:
                  testimonialsData.length % 3 === 0
                    ? "none"
                    : "1px solid #D0A096",
              }}
            >
              {testimonialsData.length} testimonials
            </span>
          </div>
          {!isEditing ? (
            <Button
              className="border-2 p-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
              onClick={() => handleEdit("testimonials")}
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                className="border-2 px-3 py-1.5 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onClick={handleCancel}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                className="px-3 py-1.5 text-xs text-white"
                style={{
                  background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                  color: "#3D3935",
                }}
                onClick={() => handleSave("testimonials")}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        {!isEditing ? (
          // View mode
          <div className="space-y-2 text-sm">
            {testimonialsData.slice(0, 3).map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="p-2 border rounded"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <p className="font-medium" style={{ color: "#3D3935" }}>
                  {testimonial.client_name} - {testimonial.service_type}
                </p>
                <p className="text-gray-600 text-xs italic line-clamp-2">
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
            {testimonialsData.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                ... and {testimonialsData.length - 3} more
              </p>
            )}
          </div>
        ) : (
          // Edit mode
          <div className="space-y-3">
            {testimonialsData.length % 3 !== 0 && (
              <div
                className="p-2 rounded text-xs"
                style={{
                  backgroundColor: "#FAF7F5",
                  color: "#D0A096",
                  border: "1px solid #D0A096",
                }}
              >
                ⚠ Total testimonials must be divisible by 3 (currently{" "}
                {testimonialsData.length}). Add or remove testimonials.
              </div>
            )}

            {/* Testimonials list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testimonialsData.map((testimonial) => (
                <div key={testimonial.id}>
                  {editingTestimonialId === testimonial.id ? (
                    // Edit form for this testimonial
                    <div
                      className="p-3 border-2 rounded space-y-2"
                      style={{
                        borderColor: "#D0A096",
                        backgroundColor: "#FEFCFA",
                      }}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            className="text-xs font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            Name *
                          </label>
                          <input
                            type="text"
                            value={testimonialForm.client_name}
                            onChange={(e) =>
                              setTestimonialForm({
                                ...testimonialForm,
                                client_name: e.target.value,
                              })
                            }
                            className="mt-1  min-h-[36px] w-full px-2 py-1 border rounded text-xs"
                            style={{
                              borderColor: "#DCD4CD",
                              backgroundColor: "#FAF7F5",
                            }}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            className="text-xs font-medium"
                            style={{ color: "#3D3935" }}
                          >
                            Service *
                          </label>
                          <Select
                            className="w-100"
                            style={{
                              borderColor: "#DCD4CD",
                              backgroundColor: "#FAF7F5",
                            }}
                            value={testimonialForm.service_type}
                            onValueChange={(value) => {
                              setTestimonialForm({
                                ...testimonialForm,
                                service_type: value,
                              });
                            }}
                          >
                            <SelectTrigger
                              className="mt-1 w-[150px] border rounded"
                              style={{
                                borderColor: "#D0A096",
                                backgroundColor: "#FEFCFA",
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label
                          className="text-xs font-medium"
                          style={{ color: "#3D3935" }}
                        >
                          Initials
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={testimonialForm.initials}
                          onChange={(e) =>
                            setTestimonialForm({
                              ...testimonialForm,
                              initials: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 min-h-[36px] w-full px-2 py-1 border rounded text-xs"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FAF7F5",
                          }}
                          placeholder="e.g., SJ"
                        />
                      </div>
                      <div>
                        <label
                          className="text-xs font-medium"
                          style={{ color: "#3D3935" }}
                        >
                          Testimonial Text *
                        </label>
                        <textarea
                          value={testimonialForm.comment}
                          onChange={(e) =>
                            setTestimonialForm({
                              ...testimonialForm,
                              comment: e.target.value,
                            })
                          }
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FAF7F5",
                          }}
                          rows={3}
                          placeholder="Client testimonial..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="border px-2 py-1 text-xs flex-1"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "transparent",
                            color: "#3D3935",
                          }}
                          onClick={handleCancelTestimonialEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="px-2 py-1 text-xs flex-1"
                          style={{
                            background:
                              "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                            color: "#3D3935",
                          }}
                          onClick={handleSaveTestimonial}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View item
                    <div
                      className="p-2 min-h-[36px] border rounded flex items-start justify-between group"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FAF7F5",
                      }}
                    >
                      <div className="flex-1">
                        <p
                          className="font-medium text-xs"
                          style={{ color: "#3D3935" }}
                        >
                          {testimonial.client_name} - {testimonial.service_type}
                        </p>
                        <p className="text-gray-600 text-xs italic line-clamp-2">
                          "{testimonial.comment}"
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 border rounded"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FEFCFA",
                          }}
                          onClick={() => handleEditTestimonial(testimonial)}
                        >
                          <Edit
                            className="w-3 h-3"
                            style={{ color: "#3D3935" }}
                          />
                        </button>
                        <button
                          className="p-1 border rounded"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FEFCFA",
                          }}
                          onClick={() =>
                            handleDeleteTestimonial(testimonial.id)
                          }
                        >
                          <Trash2
                            className="w-3 h-3"
                            style={{ color: "#D0A096" }}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new testimonial button */}
              {editingTestimonialId === null && (
                <button
                  className="w-full p-3 border-2 border-dashed rounded flex items-center justify-center gap-2 hover:border-[#D0A096] transition-colors"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FAF7F5",
                  }}
                  onClick={handleAddTestimonial}
                >
                  <Plus className="w-4 h-4" style={{ color: "#D0A096" }} />
                  <span className="text-sm" style={{ color: "#3D3935" }}>
                    Add Testimonial
                  </span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              💡 Testimonials are displayed 3 per page. Ensure total count is
              divisible by 3.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Renders the districts card
  const renderDistrictsCard = () => {
    const isEditing = editingCard === "districts";
    const justSaved = savedMessage === "districts";
    const districtsData = isEditing ? districtsDraft : districts;

    console.log("districtsData ==> ", districtsData);
    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium" style={{ color: "#3D3935" }}>
              Service Area Section
            </h4>
            {justSaved && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                Saved
              </span>
            )}
          </div>
          {!isEditing ? (
            <Button
              className="border-2 p-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
              onClick={() => handleEdit("districts")}
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                className="border-2 px-3 py-1.5 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onClick={handleCancel}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                className="px-3 py-1.5 text-xs text-white"
                style={{
                  background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                  color: "#3D3935",
                }}
                onClick={() => handleSave("districts")}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        {!isEditing ? (
          // View mode
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2" style={{ color: "#3D3935" }}>
                Service Available ({districtsData.available.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {districtsData.available.map((district, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "#3D3935",
                      color: "#EADDD5",
                    }}
                  >
                    {district.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium mb-2" style={{ color: "#3D3935" }}>
                Coming Soon ({districtsData.comingSoon.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {districtsData.comingSoon.map((district, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "#EADDD5",
                      color: "#3D3935",
                    }}
                  >
                    {district.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Edit mode
          <div className="space-y-4">
            {/* Available Districts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm" style={{ color: "#3D3935" }}>
                  Service Available
                </p>
                {addingToCategory !== "available" && (
                  <button
                    className="text-xs px-2 py-1 border rounded flex items-center gap-1"
                    style={{
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                    onClick={() => handleAddDistrict("available")}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {districtsData.available.map((district, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded flex items-center justify-between group"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    <span className="text-sm" style={{ color: "#3D3935" }}>
                      {district.name}
                    </span>
                    <button
                      className="p-1 border rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      onClick={() =>
                        handleDeleteDistrict("available", district.id)
                      }
                    >
                      <Trash2
                        className="w-3 h-3"
                        style={{ color: "#D0A096" }}
                      />
                    </button>
                  </div>
                ))}
                {addingToCategory === "available" && (
                  <div
                    className="p-2 border-2 rounded flex gap-2"
                    style={{
                      borderColor: "#D0A096",
                      backgroundColor: "#FEFCFA",
                    }}
                  >
                    <input
                      type="text"
                      value={newDistrictName}
                      onChange={(e) => setNewDistrictName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveNewDistrict(newDistrictName, false);
                        }
                      }}
                      className="flex-1 px-2 py-1 border rounded text-sm outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FAF7F5",
                      }}
                      placeholder="District name"
                      autoFocus
                    />
                    <Button
                      type="button"
                      className="px-2 py-1 text-xs"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "transparent",
                        color: "#3D3935",
                      }}
                      onClick={handleCancelAddDistrict}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="px-2 py-1 text-xs"
                      style={{
                        background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                        color: "#3D3935",
                      }}
                      onClick={() =>
                        handleSaveNewDistrict(newDistrictName, false)
                      }
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Coming Soon Districts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm" style={{ color: "#3D3935" }}>
                  Coming Soon
                </p>
                {addingToCategory !== "comingSoon" && (
                  <button
                    className="text-xs px-2 py-1 border rounded flex items-center gap-1"
                    style={{
                      borderColor: "#DCD4CD",
                      color: "#3D3935",
                    }}
                    onClick={() => handleAddDistrict("comingSoon")}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {districtsData.comingSoon.map((district, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded flex items-center justify-between group"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FAF7F5",
                    }}
                  >
                    <span className="text-sm" style={{ color: "#3D3935" }}>
                      {district.name}
                    </span>
                    <button
                      className="p-1 border rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      onClick={() =>
                        handleDeleteDistrict("comingSoon", district.id)
                      }
                    >
                      <Trash2
                        className="w-3 h-3"
                        style={{ color: "#D0A096" }}
                      />
                    </button>
                  </div>
                ))}
                {addingToCategory === "comingSoon" && (
                  <div
                    className="p-2 border-2 rounded flex gap-2"
                    style={{
                      borderColor: "#D0A096",
                      backgroundColor: "#FEFCFA",
                    }}
                  >
                    <input
                      type="text"
                      value={newDistrictName}
                      onChange={(e) => setNewDistrictName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveNewDistrict(newDistrictName, true);
                        }
                      }}
                      className="flex-1 px-2 py-1 border rounded text-sm outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FAF7F5",
                      }}
                      placeholder="District name"
                      autoFocus
                    />
                    <Button
                      type="button"
                      className="px-2 py-1 text-xs"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "transparent",
                        color: "#3D3935",
                      }}
                      onClick={handleCancelAddDistrict}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="px-2 py-1 text-xs"
                      style={{
                        background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                        color: "#3D3935",
                      }}
                      onClick={() =>
                        handleSaveNewDistrict(newDistrictName, true)
                      }
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renders the lookbook card
  const renderLookbookCard = () => {
    const isEditing = editingCard === "lookbook";
    const justSaved = savedMessage === "lookbook";
    const lookbookData = isEditing ? lookbookDraft : lookbookImages;

    const handleAddLookbookImage = async (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (isLookbookUploading) return;

      const files = e.target.files;
      if (!files) return;

      const validationError = Array.from(files)
        .map(getLookbookImageValidationError)
        .find(Boolean);

      if (validationError) {
        setLookbookError(validationError);
        if (lookbookFileInputRef.current) {
          lookbookFileInputRef.current.value = "";
        }
        return;
      }

      setLookbookError(null);
      setIsLookbookUploading(true);

      try {
        const res = await uploadImageAndGetUrl(files[0], "lookbook");
        const lookbook = {
          title: files[0].name,
          description: "",
          image_url: res,
          position: lookbookDraft.length + 1,
          aspect_ratio: "",
          is_active: true,
        };
        await createLookbookSection(lookbook);
        const remaining = 10 - lookbookDraft.length;
        const toAdd = Array.from(files).slice(0, remaining);
        const newImages: LookbookImage[] = toAdd.map((file) => ({
          id: crypto.randomUUID(),
          image_url: res,
          title: files[0].name,
          position: lookbookDraft.length + 1,
        }));
        setLookbookDraft((prev) => [...prev, ...newImages]);
      } catch (error) {
        console.error("Error uploading lookbook image:", error);
        setLookbookError("Upload failed. Please try again.");
      } finally {
        setIsLookbookUploading(false);
        if (lookbookFileInputRef.current) {
          lookbookFileInputRef.current.value = "";
        }
      }
    };

    const handleRemoveLookbookImage = (id: string) => {
      setLookbookDraft((prev) => prev.filter((img) => img.id !== id));
      deleteLookbook(id);
    };

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{
          borderColor: "#DCD4CD",
          backgroundColor: "#FEFCFA",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium" style={{ color: "#3D3935" }}>
              Lookbook Section
            </h4>
            {justSaved && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: "#E9CFCA",
                  color: "#3D3935",
                }}
              >
                Saved
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: "#FAF7F5",
                color: "#3D3935",
              }}
            >
              {lookbookData.length}/10 images
            </span>
          </div>
          {!isEditing ? (
            <Button
              className="border-2 p-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "transparent",
                color: "#3D3935",
              }}
              onClick={() => handleEdit("lookbook")}
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                className="border-2 px-3 py-1.5 text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onClick={handleCancel}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                className="px-3 py-1.5 text-xs text-white"
                style={{
                  background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
                  color: "#3D3935",
                }}
                onClick={() => handleSave("lookbook")}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        {!isEditing ? (
          // View mode
          <div className="grid grid-cols-4 gap-2">
            {lookbookData.slice(0, 8).map((image) => (
              <div
                key={image.id}
                className="aspect-square border rounded overflow-hidden"
                style={{ borderColor: "#DCD4CD" }}
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {lookbookData.length > 8 && (
              <div
                className="aspect-square border rounded flex items-center justify-center text-xs"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FAF7F5",
                  color: "#3D3935",
                }}
              >
                +{lookbookData.length - 8} more
              </div>
            )}
          </div>
        ) : (
          // Edit mode
          <div className="space-y-3">
            <input
              ref={lookbookFileInputRef}
              type="file"
              accept={LOOKBOOK_IMAGE_ACCEPT}
              multiple
              className="hidden"
              disabled={isLookbookUploading}
              onChange={handleAddLookbookImage}
            />

            {lookbookError && (
              <p className="text-xs" style={{ color: "#B42318" }}>
                {lookbookError}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {lookbookData.map((image, index) => (
                <DraggableLookbookImage
                  key={image.id}
                  image={image}
                  index={index}
                  onRemove={handleRemoveLookbookImage}
                  moveImage={moveLookbookImage}
                  onDropComplete={handleLookbookDropComplete}
                />
              ))}

              {/* Add new image button */}
              {lookbookData.length < 10 && (
                <button
                  className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 hover:border-[#D0A096] transition-colors"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FAF7F5",
                  }}
                  onClick={() =>
                    !isLookbookUploading &&
                    lookbookFileInputRef.current?.click()
                  }
                  disabled={isLookbookUploading}
                >
                  {isLookbookUploading ? (
                    <Loader2
                      className="w-6 h-6 animate-spin"
                      style={{ color: "#D0A096" }}
                    />
                  ) : (
                    <ImagePlus
                      className="w-6 h-6"
                      style={{ color: "#D0A096" }}
                    />
                  )}
                  <span className="text-xs" style={{ color: "#3D3935" }}>
                    {isLookbookUploading ? "Uploading..." : "Add Image"}
                  </span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Upload up to 10 images · PNG, JPEG, WebP · Max{" "}
              {LOOKBOOK_IMAGE_MAX_SIZE_MB} MB
            </p>
          </div>
        )}
      </div>
    );
  };

  // ── About page: shared card header ────────────────────────────────────────
  const aboutCardHeader = (
    key: string,
    title: string,
    onEdit: () => void,
    onSave: () => void | Promise<void>,
    badge?: React.ReactNode,
    isSaving?: boolean,
  ) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h4 className="font-medium" style={{ color: "#3D3935" }}>
          {title}
        </h4>
        {aboutSaved === key && (
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: "#E9CFCA", color: "#3D3935" }}
          >
            Saved
          </span>
        )}
        {badge}
      </div>
      {editingAboutCard !== key ? (
        <Button
          className="border-2 p-2"
          style={{
            borderColor: "#DCD4CD",
            backgroundColor: "transparent",
            color: "#3D3935",
          }}
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            className="border-2 px-3 py-1.5 text-xs"
            style={{
              borderColor: "#DCD4CD",
              backgroundColor: "transparent",
              color: "#3D3935",
            }}
            onClick={() => setEditingAboutCard(null)}
            disabled={isSaving}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            className="px-3 py-1.5 text-xs"
            style={{
              background: "linear-gradient(135deg, #FCEAE0, #EACAB8)",
              color: "#3D3935",
            }}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );

  // ── About page: 1 · Main About ─────────────────────────────────────────────
  const renderAboutMainCard = () => {
    const isEditing = editingAboutCard === "about-main";
    const inputCls =
      "w-full px-3 py-2 border-2 rounded-md text-sm outline-none";
    const inputStyle = {
      borderColor: "#DCD4CD",
      backgroundColor: "#FAF7F5",
      color: "#3D3935",
    };
    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
      >
        {aboutCardHeader(
          "about-main",
          "Main About",
          () => {
            setEditingAboutCard("about-main");
            setAboutMainDraft({ ...aboutMain });
          },
          () => {
            setAboutMain({ ...aboutMainDraft });
            setEditingAboutCard(null);
            flashAboutSaved("about-main");
          },
        )}
        <div className="space-y-3 text-sm">
          <div>
            <label
              className="font-medium block mb-1"
              style={{ color: "#3D3935" }}
            >
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={aboutMainDraft.title}
                onChange={(e) =>
                  setAboutMainDraft((p) => ({ ...p, title: e.target.value }))
                }
                className={inputCls}
                style={inputStyle}
                placeholder="e.g. About Pearl Wishes Studio"
              />
            ) : (
              <p className="text-gray-600 mt-1">
                {aboutMain.title || (
                  <span className="italic text-gray-400">No title set</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label
              className="font-medium block mb-1"
              style={{ color: "#3D3935" }}
            >
              Description
            </label>
            {isEditing ? (
              <textarea
                value={aboutMainDraft.description}
                rows={5}
                onChange={(e) =>
                  setAboutMainDraft((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                className={inputCls + " resize-none"}
                style={inputStyle}
                placeholder="Describe your studio, values, and mission..."
              />
            ) : (
              <p className="text-gray-600 mt-1 leading-relaxed">
                {aboutMain.description || (
                  <span className="italic text-gray-400">
                    No description set
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── About page: 2 · Why Choose Us ─────────────────────────────────────────
  const renderWhyChooseUsCard = () => {
    const isEditing = editingAboutCard === "about-why";
    const items = isEditing ? whyDraft : whyItems;

    const updateItem = (id: string, field: keyof WhyCard, value: string) =>
      setWhyDraft((prev) =>
        prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
      );
    const removeItem = (id: string) => {
      delete whyPendingFiles.current[id];
      setWhyDraft((prev) => prev.filter((i) => i.id !== id));
    };
    const addItem = () =>
      setWhyDraft((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          icon: "⭐",
          imageUrl: "",
          title: "",
          description: "",
        },
      ]);
    const handleWhyImage = (id: string, file: File | null) => {
      if (!file) return;
      whyPendingFiles.current[id] = file;
      updateItem(id, "imageUrl", URL.createObjectURL(file));
    };

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
      >
        {aboutCardHeader(
          "about-why",
          "Why Choose Us",
          () => {
            whyPendingFiles.current = {};
            setEditingAboutCard("about-why");
            setWhyDraft([...whyItems]);
          },
          async () => {
            setIsSavingWhy(true);
            try {
              const itemsToSave = await Promise.all(
                whyDraft.map(async (item) => {
                  const pendingFile = whyPendingFiles.current[item.id];
                  if (pendingFile) {
                    const imageUrl = await uploadImageAndGetUrl(
                      pendingFile,
                      "why-choose-us",
                    );
                    return { ...item, imageUrl };
                  }
                  return {
                    ...item,
                    imageUrl: item.imageUrl.startsWith("blob:")
                      ? ""
                      : item.imageUrl,
                  };
                }),
              );
              const saved = await saveWhyChooseUs(itemsToSave);
              setWhyItems(saved);
              whyPendingFiles.current = {};
              setEditingAboutCard(null);
              flashAboutSaved("about-why");
            } catch (error) {
              console.error("Error saving why choose us cards:", error);
              alert("Failed to save Why Choose Us. Please try again.");
            } finally {
              setIsSavingWhy(false);
            }
          },
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: "#FAF7F5", color: "#3D3935" }}
          >
            {items.length} cards
          </span>,
          isSavingWhy,
        )}

        {!isEditing ? (
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 border rounded-md"
                style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              >
                {item.imageUrl ? (
                  <div
                    className="w-10 h-10 mb-2 rounded overflow-hidden border"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-2xl block mb-2">{item.icon}</span>
                )}
                <p className="font-medium text-sm" style={{ color: "#3D3935" }}>
                  {item.title || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 border-2 rounded-md"
                style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              >
                <div className="flex items-start gap-3">
                  {/* Image / icon uploader */}
                  <div className="flex-shrink-0 space-y-1">
                    <input
                      ref={(el) => {
                        whyFileRefs.current[item.id] = el;
                      }}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) =>
                        handleWhyImage(item.id, e.target.files?.[0] ?? null)
                      }
                    />
                    <button
                      className="w-16 h-16 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-0.5 hover:border-[#D0A096] transition-colors overflow-hidden"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      onClick={() => whyFileRefs.current[item.id]?.click()}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <ImagePlus
                            className="w-4 h-4"
                            style={{ color: "#D0A096" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "#D0A096" }}
                          >
                            Image
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      value={item.icon}
                      maxLength={2}
                      onChange={(e) =>
                        updateItem(item.id, "icon", e.target.value)
                      }
                      className="w-16 text-center px-1 py-1 border rounded text-sm outline-none"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        color: "#3D3935",
                      }}
                      placeholder="Icon"
                    />
                  </div>
                  {/* Text fields */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <label
                        className="text-xs font-medium block mb-0.5"
                        style={{ color: "#3D3935" }}
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateItem(item.id, "title", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm outline-none"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FEFCFA",
                          color: "#3D3935",
                        }}
                        placeholder="Feature title"
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-medium block mb-0.5"
                        style={{ color: "#3D3935" }}
                      >
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        rows={3}
                        className="w-full px-2 py-1.5 border rounded text-sm outline-none resize-y"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FEFCFA",
                          color: "#3D3935",
                        }}
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                  <button
                    className="p-1 mt-0.5 border rounded flex-shrink-0"
                    style={{
                      borderColor: "#DCD4CD",
                      backgroundColor: "#FEFCFA",
                    }}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2
                      className="w-3.5 h-3.5"
                      style={{ color: "#D0A096" }}
                    />
                  </button>
                </div>
              </div>
            ))}
            <button
              className="w-full p-3 border-2 border-dashed rounded-md flex items-center justify-center gap-2 hover:border-[#D0A096] transition-colors"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              onClick={addItem}
            >
              <Plus className="w-4 h-4" style={{ color: "#D0A096" }} />
              <span className="text-sm" style={{ color: "#3D3935" }}>
                Add Card
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── About page: 3 · Contact & Business Hours ───────────────────────────────
  const renderContactCard = () => {
    const isEditing = editingAboutCard === "about-contact";
    const contact = isEditing ? contactDraft : contactInfo;
    const hours = isEditing ? hoursDraft : businessHoursData;
    const inputCls =
      "w-full px-3 py-2 border-2 rounded-md text-sm outline-none";
    const inputStyle = {
      borderColor: "#DCD4CD",
      backgroundColor: "#FAF7F5",
      color: "#3D3935",
    };

    const updateHour = (id: string, field: keyof HourRow, value: string) =>
      setHoursDraft((prev) =>
        prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
      );
    const removeHour = (id: string) =>
      setHoursDraft((prev) => prev.filter((h) => h.id !== id));
    const addHour = () =>
      setHoursDraft((prev) => [
        ...prev,
        { id: crypto.randomUUID(), day: "Monday", time: "" },
      ]);

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
      >
        {aboutCardHeader(
          "about-contact",
          "Contact & Business Hours",
          () => {
            setEditingAboutCard("about-contact");
            setContactDraft({ ...contactInfo });
            setHoursDraft([...businessHoursData]);
          },
          async () => {
            setIsSavingContact(true);
            try {
              const saved = await saveContactAndHours({
                contact: contactDraft,
                hours: hoursDraft,
              });
              setContactInfo({
                id: saved.contact.id,
                phone: saved.contact.phone,
                email: saved.contact.email,
                address: saved.contact.address,
              });
              setBusinessHoursData(saved.hours);
              setEditingAboutCard(null);
              flashAboutSaved("about-contact");
            } catch (error) {
              console.error("Error saving contact and business hours:", error);
              alert(
                "Failed to save contact & business hours. Please try again.",
              );
            } finally {
              setIsSavingContact(false);
            }
          },
          undefined,
          isSavingContact,
        )}
        <div className="space-y-4 text-sm">
          {/* Phone + Email grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="font-medium block mb-1"
                style={{ color: "#3D3935" }}
              >
                Phone
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={contactDraft.phone}
                  onChange={(e) =>
                    setContactDraft((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={inputCls}
                  style={inputStyle}
                  placeholder="+44 20 7946 0958"
                />
              ) : (
                <p className="text-gray-600 mt-1">{contact.phone || "—"}</p>
              )}
            </div>
            <div>
              <label
                className="font-medium block mb-1"
                style={{ color: "#3D3935" }}
              >
                Email
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={contactDraft.email}
                  onChange={(e) =>
                    setContactDraft((p) => ({ ...p, email: e.target.value }))
                  }
                  className={inputCls}
                  style={inputStyle}
                  placeholder="hello@studio.co.uk"
                />
              ) : (
                <p className="text-gray-600 mt-1">{contact.email || "—"}</p>
              )}
            </div>
          </div>
          {/* Address */}
          <div>
            <label
              className="font-medium block mb-1"
              style={{ color: "#3D3935" }}
            >
              Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={contactDraft.address}
                onChange={(e) =>
                  setContactDraft((p) => ({ ...p, address: e.target.value }))
                }
                className={inputCls}
                style={inputStyle}
                placeholder="Street, City, Postcode"
              />
            ) : (
              <p className="text-gray-600 mt-1">{contact.address || "—"}</p>
            )}
          </div>
          {/* Business hours */}
          <div className="pt-3 border-t-2" style={{ borderColor: "#DCD4CD" }}>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium" style={{ color: "#3D3935" }}>
                Business Hours
              </label>
              {isEditing && (
                <button
                  className="text-xs px-2 py-1 border rounded flex items-center gap-1"
                  style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                  onClick={addHour}
                >
                  <Plus className="w-3 h-3" />
                  Add Row
                </button>
              )}
            </div>
            <div className="space-y-2">
              {hours.map((hour) => (
                <div key={hour.id} className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <select
                        value={hour.day}
                        onChange={(e) =>
                          updateHour(hour.id, "day", e.target.value)
                        }
                        className="border-2 px-2 py-1.5 text-sm rounded outline-none flex-shrink-0"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FAF7F5",
                          color: "#3D3935",
                          width: "132px",
                        }}
                      >
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={hour.time}
                        onChange={(e) =>
                          updateHour(hour.id, "time", e.target.value)
                        }
                        className="flex-1 px-2 py-1.5 border-2 rounded text-sm outline-none"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FAF7F5",
                          color: "#3D3935",
                        }}
                        placeholder="e.g. 9:00 AM – 7:00 PM"
                      />
                      <button
                        className="p-1 border rounded flex-shrink-0"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FEFCFA",
                        }}
                        onClick={() => removeHour(hour.id)}
                      >
                        <Trash2
                          className="w-3.5 h-3.5"
                          style={{ color: "#D0A096" }}
                        />
                      </button>
                    </>
                  ) : (
                    <div
                      className="flex items-center gap-3 w-full px-3 py-2 rounded"
                      style={{
                        backgroundColor: "#FAF7F5",
                        border: "1px solid #DCD4CD",
                      }}
                    >
                      <span
                        className="w-24 text-xs font-medium flex-shrink-0"
                        style={{ color: "#3D3935" }}
                      >
                        {hour.day}
                      </span>
                      <span className="text-xs text-gray-600">{hour.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── About page: 4 · Awards & Certifications ────────────────────────────────
  const renderAwardsCard = () => {
    const isEditing = editingAboutCard === "about-awards";
    const items = isEditing ? awardsDraft : awardItems;

    const updateAward = (id: string, field: keyof AwardCard, value: string) =>
      setAwardsDraft((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
      );
    const removeAward = (id: string) =>
      setAwardsDraft((prev) => prev.filter((a) => a.id !== id));
    const addAward = () =>
      setAwardsDraft((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          imageUrl: "",
          name: "",
          year: String(new Date().getFullYear()),
          issuer: "",
        },
      ]);
    const handleAwardImage = (id: string, file: File | null) => {
      if (!file) return;
      updateAward(id, "imageUrl", URL.createObjectURL(file));
    };

    return (
      <div
        className="p-4 border-2 rounded-md"
        style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
      >
        {aboutCardHeader(
          "about-awards",
          "Awards & Certifications",
          () => {
            setEditingAboutCard("about-awards");
            setAwardsDraft([...awardItems]);
          },
          () => {
            setAwardItems([...awardsDraft]);
            setEditingAboutCard(null);
            flashAboutSaved("about-awards");
          },
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: "#FAF7F5", color: "#3D3935" }}
          >
            {items.length} {items.length === 1 ? "badge" : "badges"}
          </span>,
        )}

        {!isEditing ? (
          <div className="grid grid-cols-3 gap-3">
            {items.map((award) => (
              <div
                key={award.id}
                className="p-3 border rounded-md text-center"
                style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              >
                {award.imageUrl ? (
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded overflow-hidden border"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <img
                      src={award.imageUrl}
                      alt={award.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#E9CFCA" }}
                  >
                    <Star className="w-5 h-5" style={{ color: "#3D3935" }} />
                  </div>
                )}
                <p
                  className="text-sm font-medium leading-tight"
                  style={{ color: "#3D3935" }}
                >
                  {award.name || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{award.issuer}</p>
                <p
                  className="text-xs font-medium mt-0.5"
                  style={{ color: "#D0A096" }}
                >
                  {award.year}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((award) => (
              <div
                key={award.id}
                className="p-3 border-2 rounded-md relative"
                style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              >
                <button
                  className="absolute top-2 right-2 p-1 border rounded"
                  style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
                  onClick={() => removeAward(award.id)}
                >
                  <Trash2
                    className="w-3.5 h-3.5"
                    style={{ color: "#D0A096" }}
                  />
                </button>
                <div className="flex items-start gap-3 pr-7">
                  {/* Badge image uploader */}
                  <div className="flex-shrink-0">
                    <input
                      ref={(el) => {
                        awardFileRefs.current[award.id] = el;
                      }}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) =>
                        handleAwardImage(award.id, e.target.files?.[0] ?? null)
                      }
                    />
                    <button
                      className="w-16 h-16 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-0.5 hover:border-[#D0A096] transition-colors overflow-hidden"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      onClick={() => awardFileRefs.current[award.id]?.click()}
                    >
                      {award.imageUrl ? (
                        <img
                          src={award.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <ImagePlus
                            className="w-4 h-4"
                            style={{ color: "#D0A096" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "#D0A096" }}
                          >
                            Badge
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Award fields */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <label
                        className="text-xs font-medium block mb-0.5"
                        style={{ color: "#3D3935" }}
                      >
                        Award Name
                      </label>
                      <input
                        type="text"
                        value={award.name}
                        onChange={(e) =>
                          updateAward(award.id, "name", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm outline-none"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "#FEFCFA",
                          color: "#3D3935",
                        }}
                        placeholder="Award or certification name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          className="text-xs font-medium block mb-0.5"
                          style={{ color: "#3D3935" }}
                        >
                          Year
                        </label>
                        <input
                          type="text"
                          value={award.year}
                          maxLength={4}
                          onChange={(e) =>
                            updateAward(award.id, "year", e.target.value)
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm outline-none"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FEFCFA",
                            color: "#3D3935",
                          }}
                          placeholder="2024"
                        />
                      </div>
                      <div>
                        <label
                          className="text-xs font-medium block mb-0.5"
                          style={{ color: "#3D3935" }}
                        >
                          Issuer
                        </label>
                        <input
                          type="text"
                          value={award.issuer}
                          onChange={(e) =>
                            updateAward(award.id, "issuer", e.target.value)
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm outline-none"
                          style={{
                            borderColor: "#DCD4CD",
                            backgroundColor: "#FEFCFA",
                            color: "#3D3935",
                          }}
                          placeholder="Issuing body"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Add badge */}
            <button
              className="p-3 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 hover:border-[#D0A096] transition-colors min-h-[100px]"
              style={{ borderColor: "#DCD4CD", backgroundColor: "#FAF7F5" }}
              onClick={addAward}
            >
              <Plus className="w-5 h-5" style={{ color: "#D0A096" }} />
              <span className="text-sm" style={{ color: "#3D3935" }}>
                Add Badge
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-800 mb-2">Website Content Management</h1>
          <p className="text-gray-600">
            Manage all sections of your website from here
          </p>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Homepage Section */}
          <Card
            className="border-2 overflow-hidden"
            style={{ borderColor: "#DCD4CD" }}
          >
            <button
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("homepage")}
            >
              <div className="flex items-center gap-3">
                <h3 style={{ color: "#3D3935" }}>Homepage</h3>
                <span
                  className="text-sm px-3 py-1"
                  style={{
                    backgroundColor: "#FAF7F5",
                    color: "#3D3935",
                  }}
                >
                  Main landing page
                </span>
              </div>
              {expandedSection === "homepage" ? (
                <ChevronUp className="w-5 h-5" style={{ color: "#3D3935" }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: "#3D3935" }} />
              )}
            </button>

            {expandedSection === "homepage" && (
              <div
                className="border-t-2 p-6"
                style={{ borderColor: "#DCD4CD" }}
              >
                <div className="space-y-6">
                  {renderContentCard("hero")}
                  {renderInstagramCard()}
                  {renderTestimonialsCard()}
                  {renderDistrictsCard()}
                  {renderLookbookCard()}
                </div>
              </div>
            )}
          </Card>

          {/* About Page Section */}
          <Card
            className="border-2 overflow-hidden"
            style={{ borderColor: "#DCD4CD" }}
          >
            <button
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("about")}
            >
              <div className="flex items-center gap-3">
                <h3 style={{ color: "#3D3935" }}>About Page</h3>
                <span
                  className="text-sm px-3 py-1"
                  style={{
                    backgroundColor: "#FAF7F5",
                    color: "#3D3935",
                  }}
                >
                  Company information
                </span>
              </div>
              {expandedSection === "about" ? (
                <ChevronUp className="w-5 h-5" style={{ color: "#3D3935" }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: "#3D3935" }} />
              )}
            </button>

            {expandedSection === "about" && (
              <div
                className="border-t-2 p-6"
                style={{ borderColor: "#DCD4CD" }}
              >
                <div className="space-y-6">
                  {renderAboutMainCard()}
                  {renderWhyChooseUsCard()}
                  {renderContactCard()}
                  {renderAwardsCard()}
                </div>
              </div>
            )}
          </Card>

          {/* Workshops Page Section */}
          <Card
            className="border-2 overflow-hidden"
            style={{ borderColor: "#DCD4CD" }}
          >
            <button
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("workshops")}
            >
              <div className="flex items-center gap-3">
                <h3 style={{ color: "#3D3935" }}>Workshops Page</h3>
                <span
                  className="text-sm px-3 py-1"
                  style={{
                    backgroundColor: "#FAF7F5",
                    color: "#3D3935",
                  }}
                >
                  Training programs
                </span>
              </div>
              {expandedSection === "workshops" ? (
                <ChevronUp className="w-5 h-5" style={{ color: "#3D3935" }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: "#3D3935" }} />
              )}
            </button>

            {expandedSection === "workshops" && (
              <div
                className="border-t-2 p-6"
                style={{ borderColor: "#DCD4CD" }}
              >
                <p className="text-gray-600 text-center py-8">
                  Workshops page content management coming soon...
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DndProvider>
  );
}
