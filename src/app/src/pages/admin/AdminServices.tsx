import { Plus, Edit, Trash2, DollarSign, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import { ZodError } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  formatServiceForDisplay,
  ServiceDisplay,
} from "../../schema/service.schema";
import { formatZodErrors } from "../../schema/validation";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  createCategory,
  getActiveCategories,
  getAllCategories,
  updateCategoryStatus,
  deleteCategoryById,
  getServiceCountByCategory,
  syncServiceAddons,
  getServiceAddonIds,
} from "../../lib/db/services";
import {
  ServiceEditorModal,
  type ServiceFormData as EditorFormData,
} from "../../components/admin/ServiceEditorModal";
import {
  subscribeToServices,
  subscribeToCategories,
} from "../../lib/db/realtime";

const getServiceFormErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error instanceof ZodError) {
    const messages = formatZodErrors(error).map(
      (e) => e.message,
    );
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export function AdminServices() {
  const [isUpdatingService, setIsUpdatingService] =
    useState(false);
  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] =
    useState(false);
  const [isServiceAddDialogOpen, setIsServiceAddDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceDisplay | null>(null);
  const [services, setServices] = useState<ServiceDisplay[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] =
    useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    is_active: true,
  });
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    categoryId: "" as "manicure" | "extensions" | "add_on" | "",
    duration: "",
    price: "",
    is_active: true,
    description: "",
    image_url: "",
    display_order: 0,
  });
  const [isCreatingCategory, setIsCreatingCategory] =
    useState(false);
  const [isCreatingService, setIsCreatingService] =
    useState(false);
  const [updateError, setUpdateError] = useState<string | null>(
    null,
  );

  // Add-on editor state
  const [editorAddonIds, setEditorAddonIds] = useState<string[]>([]);

  // Collapsible section state
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  // Categories management state
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isCatTableLoading, setIsCatTableLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryDeleteServiceCount, setCategoryDeleteServiceCount] = useState<number | null>(null);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);

  const loadAllCategories = async () => {
    try {
      setIsCatTableLoading(true);
      setCategoriesError(null);
      const data = await getAllCategories();
      setAllCategories(data);
    } catch (error) {
      setCategoriesError("Failed to load categories. Please try again.");
    } finally {
      setIsCatTableLoading(false);
    }
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    if (!category.id || togglingCategoryId) return;
    setTogglingCategoryId(category.id);
    const prev = allCategories;
    setAllCategories((cats) =>
      cats.map((c) => c.id === category.id ? { ...c, is_active: !c.is_active } : c),
    );
    try {
      await updateCategoryStatus(category.id, !category.is_active);
      await Promise.all([loadAllCategories(), loadCategories()]);
    } catch (error) {
      setAllCategories(prev);
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleOpenDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
    setCategoryDeleteError(null);
    setCategoryDeleteServiceCount(null);
    setIsCategoryDeleteDialogOpen(true);
    try {
      const count = await getServiceCountByCategory(category.id as string);
      setCategoryDeleteServiceCount(count);
    } catch {
      setCategoryDeleteServiceCount(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.id) return;
    if (categoryDeleteServiceCount && categoryDeleteServiceCount > 0) return;
    setDeletingCategoryId(categoryToDelete.id);
    setCategoryDeleteError(null);
    try {
      await deleteCategoryById(categoryToDelete.id);
      setAllCategories((cats) => cats.filter((c) => c.id !== categoryToDelete.id));
      setIsCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      setCategoryDeleteError(error?.message || "Failed to delete category. Please try again.");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await getAllServices();
      const displayServices = data.map(formatServiceForDisplay);
      setServices(displayServices);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const data = await getActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    await Promise.all([loadServices(), loadCategories(), loadAllCategories()]);
  };

  // Load services and categories, then keep stats in sync with changes
  useEffect(() => {
    void refreshDashboardData();

    const unsubscribeServices = subscribeToServices({
      onInsert: () => {
        void refreshDashboardData();
      },
      onUpdate: () => {
        void refreshDashboardData();
      },
      onDelete: () => {
        void refreshDashboardData();
      },
    });

    const unsubscribeCategories = subscribeToCategories({
      onInsert: () => {
        void loadCategories();
      },
      onUpdate: () => {
        void loadCategories();
      },
      onDelete: () => {
        void loadCategories();
      },
    });

    return () => {
      unsubscribeServices();
      unsubscribeCategories();
    };
  }, []);

  const handleCreateCategory = async () => {
    setIsCreatingCategory(true);
    try {
      const newCategory = {
        name: categoryFormData.name,
        is_active: categoryFormData.is_active,
      };

      await createCategory(newCategory);
      await refreshDashboardData();
      setIsCategoryAddDialogOpen(false);
      setCategoryFormData({
        name: "",
        is_active: true,
      });
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateService = async () => {
    setIsCreatingService(true);
    try {
      const newService = {
        name: serviceFormData.name,
        category_id: serviceFormData.categoryId,
        duration: parseInt(serviceFormData.duration, 10),
        price: parseFloat(serviceFormData.price),
        is_active: serviceFormData.is_active,
        description: serviceFormData.description,
        image_url: serviceFormData.image_url || "",
        display_order: serviceFormData.display_order,
      };

      await createService(newService);
      await refreshDashboardData();
      setIsServiceAddDialogOpen(false);
      setServiceFormData({
        name: "",
        category: "" as
          "manicure" | "extensions" | "add_on" | "",
        duration: "",
        price: "",
        is_active: true,
        description: "",
        image_url: "",
        display_order: 0,
      });
    } catch (error) {
      console.error("Failed to create service:", error);
      alert(
        getServiceFormErrorMessage(
          error,
          "Failed to create service",
        ),
      );
    } finally {
      setIsCreatingService(false);
    }
  };

  const handleEdit = async (service: ServiceDisplay) => {
    setSelectedService(service);
    setUpdateError(null);
    setServiceFormData({
      name: service.name,
      categoryId: service.category_id || "",
      duration: service.duration.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
      description: service.description,
      image_url: service.image_url || "",
      display_order: service.display_order || 0,
    });
    try {
      const [existingAddonIds] = await Promise.all([
        getServiceAddonIds(service.id!),
        loadCategories(),
      ]);
      setEditorAddonIds(existingAddonIds);
      setIsEditDialogOpen(true);
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? `Failed to load add-on configuration: ${err.message}`
          : "Failed to load add-on configuration. Please try again.",
      );
    }
  };

  const handleSaveService = async (
    formData: EditorFormData,
    addonIds: string[],
  ) => {
    if (selectedService) {
      // Edit mode
      await updateService(
        {
          id: selectedService.id!,
          name: formData.name,
          category_id: formData.category_id,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          is_active: formData.is_active,
          is_add_on: formData.is_add_on,
          has_addons: formData.has_addons,
          description: formData.description,
          image_url: formData.image_url || undefined,
          display_order: formData.display_order,
        },
        null,
      );
      await syncServiceAddons(selectedService.id!, addonIds);
    } else {
      // Create mode
      const created = await createService({
        name: formData.name,
        category_id: formData.category_id,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        is_active: formData.is_active,
        is_add_on: formData.is_add_on,
        has_addons: formData.has_addons,
        description: formData.description,
        image_url: formData.image_url || "",
        display_order: formData.display_order,
      });
      if (addonIds.length > 0) {
        await syncServiceAddons(created.id!, addonIds);
      }
    }
    await refreshDashboardData();
  };

  const handleAddNewCategory = () => {
    setCategoryFormData({
      name: "",
      is_active: true,
    });
    setIsCategoryAddDialogOpen(true);
  };

  const handleAddNewService = async () => {
    setSelectedService(null);
    setEditorAddonIds([]);
    setIsServiceAddDialogOpen(true);
    await loadCategories();
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) {
      return "—";
    }

    return (
      categories.find((category) => category.id === categoryId)
        ?.name || "—"
    );
  };

  const handleUpdateService = async () => {
    setUpdateError(null);
    try {
      if (selectedService) {
        setIsUpdatingService(true);
        const form = serviceFormData as {
          name: string;
          categoryId?: string;
          duration: string;
          price: string;
          is_active: boolean;
          description: string;
          image_url: string;
          display_order: number;
        };

        const resolvedImageUrl = form.image_url || undefined;

        const updatedService = {
          id: selectedService.id,
          name: form.name,
          category_id:
            form.categoryId || selectedService.category_id,
          duration: parseInt(form.duration),
          price: parseFloat(form.price),
          is_active: form.is_active,
          description: form.description,
          image_url: resolvedImageUrl,
          display_order: form.display_order,
        };
        // imageFile is null — we already resolved the URL above
        await updateService(updatedService, null);
      }
      await refreshDashboardData();
      setIsEditDialogOpen(false);
      setIsUpdatingService(false);
    } catch (error) {
      console.error("Failed to update service:", error);
      setUpdateError(
        getServiceFormErrorMessage(
          error,
          "Failed to update service",
        ),
      );
      setIsUpdatingService(false);
    }
  };

  const handleDelete = (service: ServiceDisplay) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const addonServicesList = services.filter(
    (s) => s.is_add_on && s.is_active,
  );

  const totalServices = services.length;
  const activeServices = services.filter(
    (service) => service.is_active,
  ).length;
  const averagePrice =
    totalServices > 0
      ? services.reduce(
          (sum, service) => sum + Number(service.price || 0),
          0,
        ) / totalServices
      : 0;

  const stats = [
    {
      label: "Total Services",
      value: totalServices.toString(),
    },
    {
      label: "Active Services",
      value: activeServices.toString(),
    },
    {
      label: "Avg. Price",
      value: `£${averagePrice.toFixed(2)}`,
    },
    {
      label: "Categories",
      value: categories.length.toString(),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">Services</h1>
          <p className="text-gray-600">
            Manage your service offerings
          </p>
        </div>
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

      {/* Services Table */}
      <Card
        className="border-2 overflow-hidden"
        style={{ borderColor: "#DCD4CD" }}
      >
        {/* Collapsible header */}
        <div
          className="p-6 border-b-2 flex items-center justify-between"
          style={{ borderColor: "#DCD4CD" }}
        >
          <button
            type="button"
            className="flex items-center gap-3 flex-1 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
            style={{ color: "#3D3935" }}
            aria-expanded={servicesExpanded}
            aria-controls="services-table-body"
            aria-label={servicesExpanded ? "Collapse Services" : "Expand Services"}
            onClick={() => setServicesExpanded((v) => !v)}
          >
            <ChevronDown
              className="w-5 h-5 shrink-0 transition-transform duration-200"
              style={{
                color: "#3D3935",
                transform: servicesExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
            <h3 style={{ color: "#3D3935" }}>Services</h3>
          </button>
          <Button
            className="flex items-center gap-2 border-2 ml-4"
            style={{
              backgroundColor: "#E9CFCA",
              borderColor: "#3D3935",
              color: "#3D3935",
            }}
            onClick={handleAddNewService}
          ><Plus className="w-4 h-4" />Add Service</Button>
        </div>
        <div
          id="services-table-body"
          style={{
            overflow: "hidden",
            maxHeight: servicesExpanded ? "9999px" : "0",
            transition: "max-height 0.25s ease",
          }}
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
                  #
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Service Name
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Category
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Duration
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Price
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Status
                </th>
                <th
                  className="text-left p-4"
                  style={{ color: "#3D3935" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr
                  key={service.id}
                  className="border-b hover:bg-gray-50"
                  style={{ borderColor: "#DCD4CD" }}
                >
                  <td className="p-4 text-gray-600">
                    {index + 1}
                  </td>
                  <td className="p-4">
                    <span
                      className="font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      {service.name}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {getCategoryName(service.category_id)}
                  </td>
                  <td className="p-4 text-gray-600">
                    {service.duration}
                  </td>
                  <td className="p-4">
                    <span
                      className="font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      £{service.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 text-sm font-semibold"
                      style={{
                        backgroundColor: service.is_active
                          ? "#E9CFCA"
                          : "#DCD4CD",
                        color: "#3D3935",
                      }}
                    >
                      {service.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        className="p-2 border-2"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "transparent",
                          color: "#3D3935",
                        }}
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 border-2"
                        style={{
                          borderColor: "#DCD4CD",
                          backgroundColor: "transparent",
                          color: "#3D3935",
                        }}
                        onClick={() => handleDelete(service)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </Card>

      {/* Add Category Dialog */}
      <Dialog
        open={isCategoryAddDialogOpen}
        onOpenChange={setIsCategoryAddDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Add a new category to your offerings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Category Name
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Enter category name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-status"
                className="h-4 w-4 rounded border"
                style={{ borderColor: "#DCD4CD" }}
                checked={categoryFormData.is_active}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
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
              onClick={() => setIsCategoryAddDialogOpen(false)}
              disabled={isCreatingCategory}
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
              onClick={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory
                ? "Adding..."
                : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Service Editor Modal (create & edit) ── */}
      <ServiceEditorModal
        open={isServiceAddDialogOpen}
        onOpenChange={setIsServiceAddDialogOpen}
        service={null}
        categories={categories}
        addonServices={addonServicesList}
        initialAddonIds={[]}
        isCategoriesLoading={isCategoriesLoading}
        onSave={handleSaveService}
      />

      <ServiceEditorModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={selectedService}
        categories={categories}
        addonServices={addonServicesList}
        initialAddonIds={editorAddonIds}
        isCategoriesLoading={isCategoriesLoading}
        onSave={handleSaveService}
      />

      {/* Legacy Add Service Dialog – kept for reference, hidden */}
      <Dialog
        open={false}
        onOpenChange={setIsServiceAddDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service to your offerings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Service Name
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Enter service name"
                value={serviceFormData.name}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Category
              </label>
              {isCategoriesLoading ? (
                <div
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm items-center"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                >
                  <span className="text-gray-500">
                    ⏳ Loading categories...
                  </span>
                </div>
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  value={serviceFormData.categoryId}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      categoryId: e.target.value,
                    })
                  }
                >
                  <option value="">Select category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      No categories available
                    </option>
                  )}
                </select>
              )}
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Duration
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., 60 min"
                value={serviceFormData.duration}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    duration: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Price (£)
              </label>
              <input
                type="number"
                step="0.01"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="0.00"
                value={serviceFormData.price}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    price: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Short Description
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Brief description shown on service card"
                value={serviceFormData.description}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    description: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                This appears on the service card on the homepage
              </p>
            </div>
            <ImageUploadField
              folder="services"
              value={serviceFormData.image_url}
              onChange={(url) =>
                setServiceFormData((prev) => ({ ...prev, image_url: url }))
              }
              label="Cover Image"
              hint="Upload an image for the service cover."
              accept=".jpeg,.jpg,.png,.webp,image/*"
              maxSizeMB={5}
              disabled={isCreatingService}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-status"
                className="h-4 w-4 rounded border"
                style={{ borderColor: "#DCD4CD" }}
                checked={serviceFormData.is_active}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
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
              onClick={() => setIsServiceAddDialogOpen(false)}
              disabled={isCreatingService}
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
              onClick={handleCreateService}
              disabled={
                !serviceFormData.name ||
                !serviceFormData.categoryId ||
                !serviceFormData.price ||
                !serviceFormData.description ||
                isCreatingService
              }
            >
              {isCreatingService ? "Adding..." : "Add Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legacy Edit Service Dialog – replaced by ServiceEditorModal above */}
      <Dialog
        open={false}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the details of this service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Service Name
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Enter service name"
                value={serviceFormData.name}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Category
              </label>
              {isCategoriesLoading ? (
                <div
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm items-center"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                >
                  <span className="text-gray-500">
                    ⏳ Loading categories...
                  </span>
                </div>
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#DCD4CD",
                    backgroundColor: "#FEFCFA",
                  }}
                  value={serviceFormData.categoryId || ""}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      categoryId: e.target.value as
                        "manicure" | "extensions" | "add_on",
                    })
                  }
                >
                  <option value="">Select category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      No categories available
                    </option>
                  )}
                </select>
              )}
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Duration
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="e.g., 60 min"
                value={serviceFormData.duration}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    duration: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Price (£)
              </label>
              <input
                type="number"
                step="0.01"
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="0.00"
                value={serviceFormData.price}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    price: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#3D3935" }}
              >
                Short Description
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "#FEFCFA",
                }}
                placeholder="Brief description shown on service card"
                value={serviceFormData.description}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    description: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                This appears on the service card on the homepage
              </p>
            </div>
            <ImageUploadField
              folder="services"
              value={serviceFormData.image_url}
              onChange={(url) =>
                setServiceFormData((prev) => ({ ...prev, image_url: url }))
              }
              label="Cover Image"
              hint="Image with 4:3 aspect ratio for homepage display"
              accept=".jpeg,.jpg,.png,.webp,image/*"
              maxSizeMB={5}
              disabled={isUpdatingService}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active-status"
                className="h-4 w-4 rounded border"
                style={{ borderColor: "#DCD4CD" }}
                checked={serviceFormData.is_active}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
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
          </div>
          {updateError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {updateError}
            </p>
          )}
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
              onClick={handleUpdateService}
              disabled={isUpdatingService}
            >
              {isUpdatingService
                ? "Updating..."
                : "Update Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
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
                {selectedService.name}
              </p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>
                  {getCategoryName(selectedService.category_id)}
                </span>
                <span>•</span>
                <span>{selectedService.duration}</span>
                <span>•</span>
                <span>£{selectedService.price.toFixed(2)}</span>
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
                if (!selectedService?.id) {
                  return;
                }

                try {
                  await deleteService(selectedService.id);
                  await refreshDashboardData();
                  setIsDeleteDialogOpen(false);
                } catch (error) {
                  console.error(
                    "Failed to delete service:",
                    error,
                  );
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Categories Section ────────────────────────────── */}
      <div className="mt-8">
        <Card className="border-2 overflow-hidden" style={{ borderColor: "#DCD4CD" }}>
          {/* Collapsible header */}
          <div
            className="p-6 border-b-2 flex items-center justify-between gap-4"
            style={{ borderColor: "#DCD4CD" }}
          >
            <button
              type="button"
              className="flex items-center gap-3 flex-1 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
              style={{ color: "#3D3935" }}
              aria-expanded={categoriesExpanded}
              aria-controls="categories-table-body"
              aria-label={categoriesExpanded ? "Collapse Categories" : "Expand Categories"}
              onClick={() => setCategoriesExpanded((v) => !v)}
            >
              <ChevronDown
                className="w-5 h-5 shrink-0 transition-transform duration-200"
                style={{
                  color: "#3D3935",
                  transform: categoriesExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                }}
              />
              <div>
                <h3 style={{ color: "#3D3935" }}>Categories</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage service categories and their availability.
                </p>
              </div>
            </button>
            <Button
              className="flex items-center gap-2 border-2 shrink-0"
              style={{
                backgroundColor: "#E9CFCA",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              onClick={handleAddNewCategory}
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          <div
            id="categories-table-body"
            style={{
              overflow: "hidden",
              maxHeight: categoriesExpanded ? "9999px" : "0",
              transition: "max-height 0.25s ease",
            }}
          >
          {isCatTableLoading ? (
            <div className="p-12 text-center text-gray-500">Loading categories…</div>
          ) : categoriesError ? (
            <div className="p-12 text-center">
              <p className="text-red-600 mb-4">{categoriesError}</p>
              <Button
                onClick={loadAllCategories}
                className="border-2 text-sm"
                style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }}
              >
                Retry
              </Button>
            </div>
          ) : allCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="mb-4">No categories yet.</p>
              <Button
                onClick={handleAddNewCategory}
                className="flex items-center gap-2 border-2"
                style={{ backgroundColor: "#E9CFCA", borderColor: "#3D3935", color: "#3D3935" }}
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "#FAF7F5" }}>
                  <tr className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "#3D3935" }}>
                      Category
                    </th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "#3D3935" }}>
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "#3D3935" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allCategories.map((category) => {
                    const isToggling = togglingCategoryId === category.id;
                    const isDeleting = deletingCategoryId === category.id;
                    return (
                      <tr
                        key={category.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "#DCD4CD" }}
                      >
                        <td className="p-4">
                          <span className="font-medium" style={{ color: "#3D3935" }}>
                            {category.name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: category.is_active ? "#E9CFCA" : "#DCD4CD",
                              color: "#3D3935",
                            }}
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              title={category.is_active ? "Deactivate" : "Activate"}
                              aria-label={category.is_active ? `Deactivate ${category.name}` : `Activate ${category.name}`}
                              disabled={isToggling || isDeleting}
                              onClick={() => handleToggleCategoryStatus(category)}
                              className="flex items-center gap-1.5 h-8 px-3 border-2 text-xs"
                              style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }}
                            >
                              {category.is_active ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                              {isToggling ? "Saving…" : category.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              title={`Delete ${category.name}`}
                              aria-label={`Delete ${category.name}`}
                              disabled={isToggling || isDeleting}
                              onClick={() => handleOpenDeleteCategory(category)}
                              className="h-8 px-3 border-2 text-xs"
                              style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* Category Delete Confirmation Dialog */}
      <Dialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{categoryToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {categoryDeleteServiceCount === null ? (
              <p className="text-sm text-gray-500">Checking for assigned services…</p>
            ) : categoryDeleteServiceCount > 0 ? (
              <div
                className="rounded-md border-2 px-4 py-3 text-sm"
                style={{ borderColor: "#E9CFCA", backgroundColor: "#FDF5F2", color: "#3D3935" }}
              >
                This category is currently assigned to{" "}
                <strong>{categoryDeleteServiceCount} service{categoryDeleteServiceCount !== 1 ? "s" : ""}</strong>{" "}
                and cannot be deleted. Reassign or remove those services first.
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No services are assigned to this category. It is safe to delete.
              </p>
            )}
            {categoryDeleteError && (
              <p className="mt-3 text-sm text-red-600">{categoryDeleteError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="border-2 text-sm"
              style={{ borderColor: "#DCD4CD", color: "#3D3935", backgroundColor: "transparent" }}
              onClick={() => setIsCategoryDeleteDialogOpen(false)}
              disabled={!!deletingCategoryId}
            >
              Cancel
            </Button>
            <Button
              className="border-2 text-sm"
              style={{ backgroundColor: "#3D3935", borderColor: "#3D3935", color: "#FCEAE0" }}
              disabled={
                !!deletingCategoryId ||
                categoryDeleteServiceCount === null ||
                categoryDeleteServiceCount > 0
              }
              onClick={handleDeleteCategory}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {deletingCategoryId ? "Deleting…" : "Delete Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}