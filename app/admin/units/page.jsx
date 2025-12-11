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
  MdMeetingRoom,
  MdClose,
} from "react-icons/md";

export default function UnitsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    units,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    unitNumber: "",
    floor: "",
    bedrooms: "",
    bathrooms: "",
    monthlyRent: "",
    status: "vacant",
    description: "",
  });

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (selectedProperty) {
      fetchUnits(selectedProperty._id);
    }
  }, [selectedProperty, isAuth, isLandlord, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Uppercase unit number automatically
    const processedValue = name === "unitNumber" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setFormData({
      unitNumber: "",
      floor: "",
      bedrooms: "",
      bathrooms: "",
      monthlyRent: "",
      status: "vacant",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitNumber: unit.unitNumber,
      floor: unit.floor || "",
      bedrooms: unit.bedrooms || "",
      bathrooms: unit.bathrooms || "",
      monthlyRent: unit.monthlyRent || "",
      status: unit.status || "vacant",
      description: unit.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!formData.unitNumber.trim()) {
      toast.error("Unit number is required");
      return;
    }

    try {
      let result;
      if (editingUnit) {
        result = await updateUnit(editingUnit._id, formData);
      } else {
        result = await createUnit(selectedProperty._id, formData);
      }

      if (result.success) {
        toast.success(
          editingUnit ? "Unit updated successfully" : "Unit created successfully"
        );
        setShowModal(false);
        fetchUnits(selectedProperty._id);
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (unitId, unitNumber) => {
    if (!confirm(`Are you sure you want to delete Unit ${unitNumber}?`)) {
      return;
    }

    const result = await deleteUnit(unitId);
    if (result.success) {
      toast.success("Unit deleted successfully");
      fetchUnits(selectedProperty._id);
    } else {
      toast.error(result.message || "Failed to delete unit");
    }
  };

  const filteredUnits = (units || []).filter((unit) =>
    unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      vacant: { style: "success", label: "Vacant" },
      occupied: { style: "info", label: "Occupied" },
      maintenance: { style: "warning", label: "Maintenance" },
    };
    const statusInfo = statusMap[status] || statusMap.vacant;
    return (
      <span className={`${styles.badge} ${styles[statusInfo.style]}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdMeetingRoom className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property to manage its units.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Units</h2>
          <p style={{ color: "var(--warm-gray)", fontSize: "var(--font-size-sm)" }}>
            {selectedProperty.name}
          </p>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            Add Unit
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredUnits.length === 0 ? (
          <div className={styles.emptyState}>
            <MdMeetingRoom className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Units Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No units match your search criteria"
                : "Get started by adding units to this property"}
            </p>
            {!searchTerm && (
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                Add Unit
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Floor</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th>Rent (KES)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => (
                  <tr key={unit._id}>
                    <td>
                      <strong>{unit.unitNumber}</strong>
                    </td>
                    <td>{unit.floor || "N/A"}</td>
                    <td>{unit.bedrooms || "N/A"}</td>
                    <td>{unit.bathrooms || "N/A"}</td>
                    <td>{unit.monthlyRent ? unit.monthlyRent.toLocaleString() : "N/A"}</td>
                    <td>{getStatusBadge(unit.status)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.edit}`}
                          onClick={() => openEditModal(unit)}
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() => handleDelete(unit._id, unit.unitNumber)}
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
                {editingUnit ? "Edit Unit" : "Add New Unit"}
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
                  <label className={styles.formLabel}>Unit Number *</label>
                  <input
                    type="text"
                    name="unitNumber"
                    className={styles.formInput}
                    value={formData.unitNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., A101, B205, BLDG1-301"
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                  <small style={{
                    display: "block",
                    marginTop: "4px",
                    color: "var(--warm-gray)",
                    fontSize: "12px"
                  }}>
                    Must be unique across all properties. Tenants will use this to register.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Floor</label>
                  <input
                    type="number"
                    name="floor"
                    className={styles.formInput}
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="e.g., 1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    className={styles.formInput}
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    className={styles.formInput}
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 1"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Monthly Rent (KES)</label>
                  <input
                    type="number"
                    name="monthlyRent"
                    className={styles.formInput}
                    value={formData.monthlyRent}
                    onChange={handleInputChange}
                    placeholder="e.g., 25000"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    name="status"
                    className={styles.formSelect}
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    name="description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Additional details about this unit..."
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
                  {editingUnit ? "Update Unit" : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
