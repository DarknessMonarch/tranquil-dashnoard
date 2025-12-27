"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import SearchBar from "@/app/components/SearchBar";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import Modal from "@/app/components/Modal";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import FormGroup from "@/app/components/Form/FormGroup";
import FormInput from "@/app/components/Form/FormInput";
import FormTextarea from "@/app/components/Form/FormTextarea";
import { validateRequired } from "@/app/lib/validators";
import styles from "@/app/styles/adminTable.module.css";

import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdApartment,
} from "react-icons/md";

export default function PropertiesPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    properties,
    isLoading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    country: "Kenya",
    totalUnits: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (properties.length === 0) {
      fetchProperties();
    }
  }, [isAuth, isLandlord, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const openCreateModal = () => {
    setEditingProperty(null);
    setFormData({
      name: "",
      street: "",
      city: "",
      country: "Kenya",
      totalUnits: "",
      description: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || "",
      street: property.address?.street || "",
      city: property.address?.city || "",
      country: property.address?.country || "Kenya",
      totalUnits: property.totalUnits || "",
      description: property.description || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    const nameValidation = validateRequired(formData.name, "Property name");
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.message;
    }

    const streetValidation = validateRequired(formData.street, "Street address");
    if (!streetValidation.valid) {
      newErrors.street = streetValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const propertyData = {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          country: formData.country,
        },
        totalUnits: formData.totalUnits,
        description: formData.description,
      };

      let result;
      if (editingProperty) {
        result = await updateProperty(editingProperty._id, propertyData);
      } else {
        result = await createProperty(propertyData);
      }

      if (result.success) {
        toast.success(
          editingProperty
            ? "Property updated successfully"
            : "Property created successfully"
        );
        setShowModal(false);
        fetchProperties();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteClick = (propertyId, propertyName) => {
    setPropertyToDelete({ id: propertyId, name: propertyName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    const result = await deleteProperty(propertyToDelete.id);
    if (result.success) {
      toast.success("Property deleted successfully");
      fetchProperties();
    } else {
      toast.error(result.message || "Failed to delete property");
    }
    setPropertyToDelete(null);
  };

  const filteredProperties = (properties || []).filter(
    (property) =>
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader
        actions={
          <>
            <SearchBar
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
            <Button
              variant="primary"
              icon={<MdAdd size={20} />}
              onClick={openCreateModal}
            >
              Add Property
            </Button>
          </>
        }
      />

      <div className={styles.tableCard}>
        {filteredProperties.length === 0 ? (
          <div className={styles.emptyState}>
            <MdApartment className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Properties Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No properties match your search criteria"
                : "Get started by creating your first property"}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                icon={<MdAdd size={20} />}
                onClick={openCreateModal}
              >
                Add Property
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Property Name</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>Total Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property._id}
                    onClick={() => router.push(`/admin/properties/${property._id}`)}
                    className={styles.clickableRow}
                  >
                    <td>
                      <strong>{property.name || "N/A"}</strong>
                    </td>
                    <td>{property.address?.street || "N/A"}</td>
                    <td>{property.address?.city || "N/A"}</td>
                    <td>{property.totalUnits || 0}</td>
                    <td>
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Button
                          variant="icon"
                          icon={<MdEdit size={18} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(property);
                          }}
                          title="Edit"
                          className={styles.edit}
                        />
                        <Button
                          variant="icon"
                          icon={<MdDelete size={18} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(property._id, property.name || "Property");
                          }}
                          title="Delete"
                          className={styles.delete}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Property Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProperty ? "Edit Property" : "Add New Property"}
        size="medium"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingProperty ? "Update Property" : "Create Property"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormGroup label="Property Name" required error={errors.name}>
            <FormInput
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Greenview Apartments"
              error={!!errors.name}
            />
          </FormGroup>

          <FormGroup label="Street Address" required error={errors.street}>
            <FormInput
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="e.g., 123 Main Street, Kahawa"
              error={!!errors.street}
            />
          </FormGroup>

          <FormGroup label="City">
            <FormInput
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="e.g., Nairobi"
            />
          </FormGroup>

          <FormGroup label="Country">
            <FormInput
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="e.g., Kenya"
            />
          </FormGroup>

          <FormGroup label="Total Units">
            <FormInput
              type="number"
              name="totalUnits"
              value={formData.totalUnits}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              min="1"
            />
          </FormGroup>

          <FormGroup label="Description">
            <FormTextarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the property..."
              rows={4}
            />
          </FormGroup>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Property"
        message={`Are you sure you want to delete "${propertyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
