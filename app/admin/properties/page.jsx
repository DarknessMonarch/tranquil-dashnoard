"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdApartment,
  MdClose,
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
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "Kenya",
    totalUnits: "",
    description: "",
  });

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
  };

  const openCreateModal = () => {
    setEditingProperty(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      country: "Kenya",
      totalUnits: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      country: property.country || "Kenya",
      totalUnits: property.totalUnits || "",
      description: property.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Property name is required");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Address is required");
      return;
    }

    try {
      let result;
      if (editingProperty) {
        result = await updateProperty(editingProperty._id, formData);
      } else {
        result = await createProperty(formData);
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

  const handleDelete = async (propertyId, propertyName) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"?`)) {
      return;
    }

    const result = await deleteProperty(propertyId);
    if (result.success) {
      toast.success("Property deleted successfully");
      fetchProperties();
    } else {
      toast.error(result.message || "Failed to delete property");
    }
  };

  const filteredProperties = properties.filter((property) =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Properties</h2>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            Add Property
          </button>
        </div>
      </div>

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
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                Add Property
              </button>
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
                  <tr key={property._id}>
                    <td>
                      <strong>{property.name}</strong>
                    </td>
                    <td>{property.address}</td>
                    <td>{property.city || "N/A"}</td>
                    <td>{property.totalUnits || 0}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.success}`}>
                        Active
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.edit}`}
                          onClick={() => openEditModal(property)}
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() =>
                            handleDelete(property._id, property.name)
                          }
                          title="Delete"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Property Name *</label>
                  <input
                    type="text"
                    name="name"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Greenview Apartments"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    className={styles.formInput}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Main Street"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City</label>
                  <input
                    type="text"
                    name="city"
                    className={styles.formInput}
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Nairobi"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country</label>
                  <input
                    type="text"
                    name="country"
                    className={styles.formInput}
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g., Kenya"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Units</label>
                  <input
                    type="number"
                    name="totalUnits"
                    className={styles.formInput}
                    value={formData.totalUnits}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                    min="1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    name="description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the property..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  {editingProperty ? "Update Property" : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
