import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Workshop,
  WorkshopLevel,
  WORKSHOP_LEVEL_LABELS,
  formatWorkshopForDisplay,
  formatDurationLabel,
  WorkshopDisplay,
} from "../../schema/workshop.schema";
import {
  useWorkshopTabAdmin,
  WorkshopTabContent,
  COMPLETE_DEFAULTS,
  ADVANCED_DEFAULTS,
} from "../../contexts/WorkshopTabContext";
import {
  getAllWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
} from "../../lib/db/workshops";
import { subscribeToWorkshops } from "../../lib/db/realtime";
import { supabase } from "../../config/supabase";

export function AdminWorkshops() {
  const [isAddingWorkshop, setIsAddingWorkshop] =
    useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [workshopImageFile, setWorkshopImageFile] =
    useState<File | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] =
    useState<WorkshopDisplay | null>(null);
  const [workshops, setWorkshops] = useState<WorkshopDisplay[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const { getContent, setContent } = useWorkshopTabAdmin();
  const [tabData, setTabData] = useState<WorkshopTabContent>(
    COMPLETE_DEFAULTS,
  );
  const [showTabSection, setShowTabSection] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    capacity: 1,
    description: "",
    session_count: "",
    session_duration_hours: "",
    level: "" as WorkshopLevel | "",
    class_type: "",
    highlights: "",
    price: "",
    image_url: "",
    is_active: true,
    display_order: 0,
  });

  // Load workshops from database
  useEffect(() => {
    loadWorkshops();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToWorkshops({
      onInsert: () => loadWorkshops(),
      onUpdate: () => loadWorkshops(),
      onDelete: () => loadWorkshops(),
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadWorkshops = async () => {
    try {
      setIsLoading(true);
      const data = await getAllWorkshops();
      const displayWorkshops = data.map(
        formatWorkshopForDisplay,
      );
      setWorkshops(displayWorkshops);
    } catch (error) {
      console.error("Failed to load workshops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImageAndGetUrl = async (
    file: File | null,
    folder: string,
  ) => {
    if (!file) {
      return "";
    }

    const sanitizedFilename = file.name.replace(
      /[^a-zA-Z0-9_.-]/g,
      "-",
    );
    const filePath = `${folder}/${Date.now()}-${sanitizedFilename}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Image upload failed:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData, error: publicUrlError } =
      supabase.storage.from("images").getPublicUrl(filePath);

    if (publicUrlError) {
      console.error(
        "Generating image public URL failed:",
        publicUrlError,
      );
      throw publicUrlError;
    }

    return publicUrlData.publicUrl;
  };

  const handleEdit = (workshop: WorkshopDisplay) => {
    setSelectedWorkshop(workshop);
    setWorkshopImageFile(null);
    setFormData({
      title: workshop.title,
      description: workshop.description,
      session_count: workshop.sessionCount?.toString() || "",
      session_duration_hours: workshop.sessionDurationHours
        ? (workshop.sessionDurationHours / 60).toString()
        : "",
      level: workshop.levelValue,
      class_type: workshop.classType,
      highlights: workshop.highlights.join("\n"),
      price: workshop.price?.toString() || "",
      image_url: workshop.image_url || "",
      is_active: workshop.is_active,
      display_order: workshop.display_order || 0,
    });
    // Load existing tab content for this workshop (or its defaults)
    const defaults =
      workshop.title === "Advanced Nail Update Course"
        ? ADVANCED_DEFAULTS
        : COMPLETE_DEFAULTS;
    setTabData(getContent(workshop.title, defaults));
    setShowTabSection(false);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      title: "",
      description: "",
      session_count: "",
      session_duration_hours: "",
      level: "" as WorkshopLevel | "",
      class_type: "",
      highlights: "",
      price: "",
      image_url: "",
      is_active: true,
      display_order: 0,
    });
    setWorkshopImageFile(null);
    setIsAddDialogOpen(true);
  };

  const handleCreateWorkshop = async () => {
    const sessionCount = parseInt(formData.session_count) || 1;
    const sessionDurationHours = Math.round(
      parseFloat(formData.session_duration_hours) || 0,
    );
    setIsAddingWorkshop(true);
    try {
      const image_url = await uploadImageAndGetUrl(
        workshopImageFile,
        "workshops",
      );
      const newWorkshop = {
        title: formData.title,
        description: formData.description,
        session_count: sessionCount,
        session_duration_hours: sessionDurationHours,
        level: formData.level as WorkshopLevel,
        capacity: formData.capacity,
        class_type: formData.class_type,
        highlights: formData.highlights
          .split("\n")
          .filter((h) => h.trim()),
        price: formData.price
          ? parseFloat(formData.price)
          : undefined,
        image_url: image_url || undefined,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };
      await createWorkshop(newWorkshop);
      setIsAddDialogOpen(false);
      setWorkshopImageFile(null);
      await loadWorkshops();
    } catch (e) {
      console.error("Failed to create workshop:", e);
    } finally {
      setIsAddingWorkshop(false);
    }
  };

  const handleDelete = (workshop: WorkshopDisplay) => {
    setSelectedWorkshop(workshop);
    setIsDeleteDialogOpen(true);
  };

  const stats = [
    {
      label: "Total Workshops",
      value: workshops.length.toString(),
    },
    {
      label: "Active Workshops",
      value: workshops
        .filter((w) => w.is_active)
        .length.toString(),
    },
    {
      label: "Avg. Price",
      value:
        workshops.filter((w) => w.price).length > 0
          ? `£${(workshops.filter((w) => w.price).reduce((sum, w) => sum + (w.price || 0), 0) / workshops.filter((w) => w.price).length).toFixed(2)}`
          : "N/A",
    },
    {
      label: "Levels",
      value: new Set(
        workshops.map((w) => w.levelValue),
      ).size.toString(),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">
            Workshops & Training
          </h1>
          <p className="text-gray-600">
            Manage your training courses
          </p>
        </div>
        <Button
          className="flex items-center gap-2 border-2"
          style={{
            backgroundColor: "#E9CFCA",
            borderColor: "#3D3935",
            color: "#3D3935",
          }}
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          Add New Workshop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="p-6 border-2"
            style={{ borderColor: "#DCD4CD" }}
          >
            <p className="text-gray-600 text-sm mb-1">
              {stat.label}
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ color: "#3D3935" }}
            >
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Workshops Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workshops.map((workshop) => (
          <Card
            key={workshop.id}
            className="border-2 overflow-hidden"
            style={{ borderColor: "#DCD4CD" }}
          >
            {/* Workshop Image or Placeholder */}
            {workshop.image_url ? (
              <img
                src={workshop.image_url}
                alt={workshop.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div
                className="h-48 flex items-center justify-center"
                style={{ backgroundColor: "#DCD4CD" }}
              >
                <GraduationCap className="w-16 h-16 text-gray-400" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="flex-1"
                  style={{ color: "#3D3935" }}
                >
                  {workshop.title}
                </h3>
                <span
                  className="px-3 py-1 text-sm font-semibold ml-2"
                  style={{
                    backgroundColor: workshop.is_active
                      ? "#E9CFCA"
                      : "#DCD4CD",
                    color: "#3D3935",
                  }}
                >
                  {workshop.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
                <span>
                  📅{" "}
                  {formatDurationLabel(
                    workshop.sessionCount,
                    workshop.sessionDurationMinutes,
                  )}
                </span>
                <span>🎓 {workshop.level}</span>
                <span>👥 {workshop.classType}</span>
              </div>

              <p className="text-gray-600 mb-4">
                {workshop.description}
              </p>

              {workshop.highlights.length > 0 && (
                <div className="mb-4">
                  <div
                    className="text-sm mb-2"
                    style={{ color: "#3D3935" }}
                  >
                    Course Highlights:
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {workshop.highlights.map(
                      (highlight, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <span className="text-gray-400 mt-1">
                            •
                          </span>
                          <span>{highlight}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {workshop.price && (
                <div className="mb-4">
                  <span
                    className="font-semibold text-xl"
                    style={{ color: "#3D3935" }}
                  >
                    £{workshop.price.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 border-2"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "transparent",
                    color: "#3D3935",
                  }}
                  onClick={() => handleEdit(workshop)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  className="border-2"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "transparent",
                    color: "#3D3935",
                  }}
                  onClick={() => handleDelete(workshop)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {workshops.length === 0 && !isLoading && (
        <Card
          className="p-12 text-center border-2"
          style={{ borderColor: "#DCD4CD" }}
        >
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-gray-800">
            No workshops yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first workshop or
            training course.
          </p>
          <Button
            className="inline-flex items-center gap-2 border-2"
            style={{
              backgroundColor: "#E9CFCA",
              borderColor: "#3D3935",
              color: "#3D3935",
            }}
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4" />
            Add Workshop
          </Button>
        </Card>
      )}

      {/* Add Workshop Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Workshop</DialogTitle>
            <DialogDescription>
              Create a new training course or workshop.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Workshop Title
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., Complete Nail Course"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Description
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Describe the workshop and what students will learn"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            {/* Sessions + Duration per session */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  placeholder="e.g. 3"
                  value={formData.session_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session_count: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Duration per Session (hrs)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  placeholder="e.g. 4"
                  value={formData.session_duration_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session_duration_hours: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {/* Live preview */}
            {formData.session_count &&
              formData.session_duration_hours && (
                <div
                  className="text-sm px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: "#FAF7F5",
                    color: "#6b7280",
                    border: "1px solid #DCD4CD",
                  }}
                >
                  Total:{" "}
                  {formatDurationLabel(
                    parseInt(formData.session_count) || 0,
                    Math.round(
                      parseFloat(
                        formData.session_duration_hours,
                      ) || 0,
                    ),
                  )}
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div></div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Level
                </label>
                <select
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value as WorkshopLevel,
                    })
                  }
                >
                  <option value="">Select level</option>
                  <option value={WorkshopLevel.BEGINNER}>
                    Beginner
                  </option>
                  <option value={WorkshopLevel.INTERMEDIATE}>
                    Intermediate
                  </option>
                  <option value={WorkshopLevel.ADVANCED}>
                    Advanced
                  </option>
                  <option
                    value={
                      WorkshopLevel.INTERMEDIATE_TO_ADVANCED
                    }
                  >
                    Intermediate to Advanced
                  </option>
                  <option value={WorkshopLevel.ALL_LEVELS}>
                    All Levels
                  </option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Capacity
              </label>
              <input
                type="number"
                min="1"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., 10"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Class Type
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., Private or small group (max 3 students)"
                value={formData.class_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    class_type: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Course Highlights
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="One highlight per line"
                value={formData.highlights}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    highlights: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Enter one highlight per line (e.g., "Skill
                refinement")
              </p>
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Base Price (£) *
              </label>
              <input
                type="number"
                step="0.01"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: !formData.price
                    ? "#D0A096"
                    : "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="0.00"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
              />
              {!formData.price && (
                <p
                  className="text-xs"
                  style={{ color: "#D0A096" }}
                >
                  Base price is required.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Cover Image
              </label>
              <input
                type="file"
                accept=".jpeg,.jpg,.png,.webp,image/*"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                onChange={(e) =>
                  setWorkshopImageFile(
                    e.target.files?.[0] ?? null,
                  )
                }
              />
              <p className="text-xs text-gray-500">
                {workshopImageFile
                  ? `Selected file: ${workshopImageFile.name}`
                  : "Upload an image for the workshop cover."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-status"
                className="h-4 w-4 rounded border"
                style={{ borderColor: "#DCD4CD" }}
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
              />
              <label
                htmlFor="active-status"
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Active
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={() => {
                handleCreateWorkshop();
              }}
              disabled={isAddingWorkshop || !formData.price}
            >
              {isAddingWorkshop ? "Adding..." : "Add Workshop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Workshop Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>
              Update the details of this workshop.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Workshop Title
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., Complete Nail Course"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Description
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Describe the workshop and what students will learn"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            {/* Sessions + Duration per session */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  placeholder="e.g. 3"
                  value={formData.session_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session_count: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Duration per Session (hrs)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  placeholder="e.g. 4"
                  value={formData.session_duration_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session_duration_hours: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {/* Live preview */}
            {formData.session_count &&
              formData.session_duration_hours && (
                <div
                  className="text-sm px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: "#FAF7F5",
                    color: "#6b7280",
                    border: "1px solid #DCD4CD",
                  }}
                >
                  Total:{" "}
                  {formatDurationLabel(
                    parseInt(formData.session_count) || 0,
                    Math.round(
                      parseFloat(
                        formData.session_duration_hours,
                      ) || 0,
                    ),
                  )}
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div></div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#3D3935" }}
                >
                  Level
                </label>
                <select
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value as WorkshopLevel,
                    })
                  }
                >
                  <option value="">Select level</option>
                  <option value={WorkshopLevel.BEGINNER}>
                    Beginner
                  </option>
                  <option value={WorkshopLevel.INTERMEDIATE}>
                    Intermediate
                  </option>
                  <option value={WorkshopLevel.ADVANCED}>
                    Advanced
                  </option>
                  <option
                    value={
                      WorkshopLevel.INTERMEDIATE_TO_ADVANCED
                    }
                  >
                    Intermediate to Advanced
                  </option>
                  <option value={WorkshopLevel.ALL_LEVELS}>
                    All Levels
                  </option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Class Type
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., Private or small group (max 3 students)"
                value={formData.class_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    class_type: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Course Highlights
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="One highlight per line"
                value={formData.highlights}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    highlights: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Enter one highlight per line (e.g., "Skill
                refinement")
              </p>
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Base Price (£) *
              </label>
              <input
                type="number"
                step="0.01"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: !formData.price
                    ? "#D0A096"
                    : "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="0.00"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
              />
              {!formData.price && (
                <p
                  className="text-xs"
                  style={{ color: "#D0A096" }}
                >
                  Base price is required.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Cover Image
              </label>
              <input
                type="file"
                accept=".jpeg,.jpg,.png,.webp,image/*"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                onChange={(e) =>
                  setWorkshopImageFile(
                    e.target.files?.[0] ?? null,
                  )
                }
              />
              <p className="text-xs text-gray-500">
                {workshopImageFile
                  ? `Selected file: ${workshopImageFile.name}`
                  : formData.image_url
                    ? "Current image kept unless you upload a new one."
                    : "Upload an image for the workshop cover."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active-status"
                className="h-4 w-4 rounded border"
                style={{ borderColor: "#DCD4CD" }}
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
              />
              <label
                htmlFor="edit-active-status"
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Active
              </label>
            </div>

            {/* ── Workshop Tab Content ── */}
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: "#DCD4CD" }}
            >
              <button
                type="button"
                onClick={() => setShowTabSection((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 transition-colors"
                style={{
                  color: "#3D3935",
                  backgroundColor: "#FAF7F5",
                }}
              >
                <span>Workshop Tab Content</span>
                <span
                  className="text-xs font-normal"
                  style={{ color: "#9ca3af" }}
                >
                  {showTabSection
                    ? "Hide ▲"
                    : "Edit what appears in the workshop detail card ▼"}
                </span>
              </button>

              {showTabSection && (
                <div
                  className="px-4 pb-4 pt-3 space-y-4"
                  style={{ borderTop: "1px solid #e5e7eb" }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "#9ca3af" }}
                  >
                    These fields control the content inside the
                    workshop's detail card on the Workshops
                    page. Matches the frontend section order
                    exactly.
                  </p>

                  {/* Badge Label */}
                  <div className="grid gap-1.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Badge Label
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      placeholder='e.g. "Beginner to Professional"'
                      value={tabData.badgeLabel}
                      onChange={(e) =>
                        setTabData({
                          ...tabData,
                          badgeLabel: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* What You'll Learn */}
                  <div className="grid gap-1.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      What You'll Learn
                    </label>
                    <textarea
                      className="flex w-full rounded-md border px-3 py-2 text-sm"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        minHeight: "140px",
                      }}
                      placeholder="One item per line — becomes the numbered curriculum list"
                      value={tabData.learningPoints.join("\n")}
                      onChange={(e) =>
                        setTabData({
                          ...tabData,
                          learningPoints:
                            e.target.value.split("\n"),
                        })
                      }
                    />
                    <p
                      className="text-xs"
                      style={{ color: "#9ca3af" }}
                    >
                      One item per line. First 3 are shown
                      collapsed; rest reveal on "View Full
                      Curriculum".
                    </p>
                  </div>

                  {/* Duration Note */}
                  <div className="grid gap-1.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Duration Note
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                      }}
                      placeholder='e.g. "Custom training schedules are available…"'
                      value={tabData.durationNote}
                      onChange={(e) =>
                        setTabData({
                          ...tabData,
                          durationNote: e.target.value,
                        })
                      }
                    />
                    <p
                      className="text-xs"
                      style={{ color: "#9ca3af" }}
                    >
                      Shown below the Sessions / Per session /
                      Total fact grid.
                    </p>
                  </div>

                  {/* What's Included */}
                  <div className="grid gap-1.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      What's Included
                    </label>
                    <textarea
                      className="flex w-full rounded-md border px-3 py-2 text-sm"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        minHeight: "100px",
                      }}
                      placeholder="One item per line — becomes the bullet list"
                      value={tabData.whatsIncluded.join("\n")}
                      onChange={(e) =>
                        setTabData({
                          ...tabData,
                          whatsIncluded:
                            e.target.value.split("\n"),
                        })
                      }
                    />
                  </div>

                  {/* Important Information */}
                  <div className="grid gap-1.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "#3D3935" }}
                    >
                      Important Information
                    </label>
                    <textarea
                      className="flex w-full rounded-md border px-3 py-2 text-sm"
                      style={{
                        borderColor: "#DCD4CD",
                        backgroundColor: "#FEFCFA",
                        minHeight: "100px",
                      }}
                      placeholder="One item per line — becomes the bullet list"
                      value={tabData.importantInfo.join("\n")}
                      onChange={(e) =>
                        setTabData({
                          ...tabData,
                          importantInfo:
                            e.target.value.split("\n"),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={async () => {
                if (selectedWorkshop) {
                  try {
                    const sessionCount =
                      parseInt(formData.session_count) || 1;
                    const uploadedImageUrl =
                      await uploadImageAndGetUrl(
                        workshopImageFile,
                        "workshops",
                      );

                    const updatedWorkshop = {
                      title: formData.title,
                      description: formData.description,
                      session_count: sessionCount,
                      level: formData.level as WorkshopLevel,
                      class_type: formData.class_type,
                      highlights: formData.highlights
                        .split("\n")
                        .filter((h) => h.trim()),
                      price: formData.price
                        ? parseFloat(formData.price)
                        : undefined,
                      image_url:
                        uploadedImageUrl ||
                        formData.image_url ||
                        undefined,
                      is_active: formData.is_active,
                      display_order: formData.display_order,
                    };
                    await updateWorkshop(
                      selectedWorkshop.id,
                      updatedWorkshop,
                    );
                    // Persist tab content to context (→ localStorage → live frontend)
                    setContent(
                      formData.title || selectedWorkshop.title,
                      tabData,
                    );
                    setWorkshopImageFile(null);
                    setIsEditDialogOpen(false);
                    await loadWorkshops();
                  } catch (error) {
                    console.error(
                      "Failed to update workshop:",
                      error,
                    );
                  }
                }
              }}
              disabled={!formData.price}
            >
              Update Workshop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workshop Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workshop?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedWorkshop && (
            <div
              className="py-4 px-4 rounded-md border-2"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#FAF7F5",
              }}
            >
              <p
                className="font-semibold mb-2"
                style={{ color: "#3D3935" }}
              >
                {selectedWorkshop.title}
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span>{selectedWorkshop.level}</span>
                <span>•</span>
                <span>
                  {formatDurationLabel(
                    selectedWorkshop.sessionCount,
                    selectedWorkshop.sessionDurationMinutes,
                  )}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-4">
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center gap-2 border-2"
              style={{
                backgroundColor: "#D0A096",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={async () => {
                if (selectedWorkshop) {
                  try {
                    await deleteWorkshop(selectedWorkshop.id);
                    await loadWorkshops();
                  } catch (error) {
                    console.error(
                      "Failed to delete workshop:",
                      error,
                    );
                  }
                }
                setIsDeleteDialogOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Workshop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}