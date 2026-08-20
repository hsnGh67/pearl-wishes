import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
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
import { supabase } from "../../config/supabase";
import {
  formatServiceForDisplay,
  ServiceDisplay,
} from "../../schema/service.schema";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  createCategory,
  getActiveCategories,
} from "../../lib/db/services";
import {
  subscribeToServices,
  subscribeToCategories,
} from "../../lib/db/realtime";

export function AdminServices() {
  const [isUpdatingService, setIsUpdatingService] = useState(false);
  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false);
  const [isServiceAddDialogOpen, setIsServiceAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDisplay | null>(
    null,
  );
  const [services, setServices] = useState<ServiceDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
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
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingService, setIsCreatingService] = useState(false);

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
    await Promise.all([loadServices(), loadCategories()]);
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

  const uploadImageAndGetUrl = async (file: File | null, folder: string) => {
    if (!file) {
      return "";
    }

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
    const filePath = `${folder}/${Date.now()}-${sanitizedFilename}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Image upload failed:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    if (publicUrlError) {
      console.error("Generating image public URL failed:", publicUrlError);
      throw publicUrlError;
    }

    return publicUrlData.publicUrl;
  };

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
      const image_url = await uploadImageAndGetUrl(
        serviceImageFile,
        "services",
      );

      const newService = {
        name: serviceFormData.name,
        category_id: serviceFormData.categoryId,
        duration: parseInt(serviceFormData.duration, 10),
        price: parseFloat(serviceFormData.price),
        is_active: serviceFormData.is_active,
        description: serviceFormData.description,
        image_url: image_url || "",
        display_order: serviceFormData.display_order,
      };

      await createService(newService);
      await refreshDashboardData();
      setIsServiceAddDialogOpen(false);
      setServiceImageFile(null);
      setServiceFormData({
        name: "",
        category: "" as "manicure" | "extensions" | "add_on" | "",
        duration: "",
        price: "",
        is_active: true,
        description: "",
        image_url: "",
        display_order: 0,
      });
    } catch (error) {
      console.error("Failed to create service:", error);
    } finally {
      setIsCreatingService(false);
    }
  };

  const handleEdit = async (service: ServiceDisplay) => {
    setSelectedService(service);
    setServiceImageFile(null);
    setServiceFormData({
      name: service.name,
      category: service.category,
      duration: service.duration.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
      description: service.description,
      image_url: service.image_url || "",
      display_order: service.display_order || 0,
    });
    setIsEditDialogOpen(true);
    await loadCategories();
  };

  const handleAddNewCategory = () => {
    setCategoryFormData({
      name: "",
      is_active: true,
    });
    setIsCategoryAddDialogOpen(true);
  };

  const handleAddNewService = async () => {
    setServiceFormData({
      name: "",
      category: "" as "manicure" | "extensions" | "add_on" | "",
      duration: "",
      price: "",
      is_active: true,
      description: "",
      image_url: "",
      display_order: 0,
    });
    setServiceImageFile(null);
    setIsServiceAddDialogOpen(true);

    // Load categories when dialog opens
    await loadCategories();
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) {
      return "—";
    }

    return (
      categories.find((category) => category.id === categoryId)?.name || "—"
    );
  };

  const handleUpdateService = async () => {
    try {
      if (selectedService) {
        setIsUpdatingService(true);
        const form = serviceFormData as {
          name: string;
          category?: string;
          categoryId?: string;
          duration: string;
          price: string;
          is_active: boolean;
          description: string;
          image_url: string;
          display_order: number;
        };
        const updatedService = {
          id: selectedService.id,
          name: form.name,
          category_id: form.categoryId || form.category,
          duration: parseInt(form.duration),
          price: parseFloat(form.price),
          is_active: form.is_active,
          description: form.description,
          image_url: form.image_url,
          display_order: form.display_order,
        };
        await updateService(updatedService, serviceImageFile);
        setServiceImageFile(null);
      }
      await refreshDashboardData();
      setIsEditDialogOpen(false);
      setIsUpdatingService(false);
    } catch (error) {
      console.error("Failed to update service:", error);
      alert("Failed to update service");
      setIsUpdatingService(false);
    }
  };

  const handleDelete = (service: ServiceDisplay) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const totalServices = services.length;
  const activeServices = services.filter((service) => service.is_active).length;
  const averagePrice =
    totalServices > 0
      ? services.reduce((sum, service) => sum + Number(service.price || 0), 0) /
        totalServices
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
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Button
          className="flex items-center gap-2 border-2"
          style={{
            backgroundColor: "#E9CFCA",
            borderColor: "#3D3935",
            color: "#3D3935",
          }}
          onClick={handleAddNewCategory}
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </Button>
        <Button
          className="flex items-center gap-2 border-2"
          style={{
            backgroundColor: "#E9CFCA",
            borderColor: "#3D3935",
            color: "#3D3935",
          }}
          onClick={handleAddNewService}
        >
          <Plus className="w-4 h-4" />
          Add New Service
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
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold" style={{ color: "#3D3935" }}>
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
        <div className="p-6 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <h3 style={{ color: "#3D3935" }}>All Services</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#FAF7F5" }}>
              <tr className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  #
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  Service Name
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  Category
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  Duration
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  Price
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
                  Status
                </th>
                <th className="text-left p-4" style={{ color: "#3D3935" }}>
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
                  <td className="p-4 text-gray-600">{index + 1}</td>
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
                  <td className="p-4 text-gray-600">{service.duration}</td>
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
                      {service.is_active ? "Active" : "Inactive"}
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
              {isCreatingCategory ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog
        open={isServiceAddDialogOpen}
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
                    <option disabled>No categories available</option>
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
                  setServiceImageFile(e.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-gray-500">
                {serviceImageFile
                  ? `Selected file: ${serviceImageFile.name}`
                  : "Upload an image for the service cover."}
              </p>
            </div>
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

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                  value={serviceFormData.category}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      category: e.target.value as
                        | "manicure"
                        | "extensions"
                        | "add_on",
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
                    <option disabled>No categories available</option>
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
                  setServiceImageFile(e.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-gray-500">
                {setServiceImageFile
                  ? `Selected file: ${setServiceImageFile.name}`
                  : "Image with 4:3 aspect ratio for homepage display"}
              </p>
            </div>
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
              {isUpdatingService ? "Updating..." : "Update Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot
              be undone.
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
              <p className="font-semibold mb-2" style={{ color: "#3D3935" }}>
                {selectedService.name}
              </p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{getCategoryName(selectedService.category_id)}</span>
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
                  console.error("Failed to delete service:", error);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
