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
  MdPeople,
  MdClose,
} from "react-icons/md";

export default function TenantsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    tenants,
    units,
    isLoading,
    fetchTenants,
    fetchUnits,
    createTenant,
    updateTenant,
    deleteTenant,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    unit: "",
  });

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (selectedProperty) {
      fetchTenants(selectedProperty._id);
      fetchUnits(selectedProperty._id);
    }
  }, [selectedProperty, isAuth, isLandlord, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setFormData({
      username: "",
      email: "",
      phone: "",
      password: "",
      unit: "",
    });
    setShowModal(true);
  };

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      username: tenant.username || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      password: "",
      unit: tenant.currentUnit?._id || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!editingTenant && !formData.password) {
      toast.error("Password is required for new tenants");
      return;
    }

    const tenantData = { ...formData };
    if (editingTenant && !formData.password) {
      delete tenantData.password;
    }

    try {
      let result;
      if (editingTenant) {
        result = await updateTenant(editingTenant._id, tenantData);
      } else {
        result = await createTenant(tenantData);
      }

      if (result.success) {
        toast.success(
          editingTenant
            ? "Tenant updated successfully"
            : "Tenant created successfully"
        );
        setShowModal(false);
        if (selectedProperty) {
          fetchTenants(selectedProperty._id);
        }
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (tenantId, tenantName) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenantName}"?`)) {
      return;
    }

    const result = await deleteTenant(tenantId);
    if (result.success) {
      toast.success("Tenant deleted successfully");
      if (selectedProperty) {
        fetchTenants(selectedProperty._id);
      }
    } else {
      toast.error(result.message || "Failed to delete tenant");
    }
  };

  const filteredTenants = (tenants || []).filter((tenant) => {
    const search = searchTerm.toLowerCase();
    return (
      tenant.username?.toLowerCase().includes(search) ||
      tenant.email?.toLowerCase().includes(search) ||
      tenant.phone?.toLowerCase().includes(search) ||
      tenant.currentUnit?.unitNumber?.toLowerCase().includes(search)
    );
  });

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdPeople className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property from the dropdown to manage tenants
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tenants</h2>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            Add Tenant
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredTenants.length === 0 ? (
          <div className={styles.emptyState}>
            <MdPeople className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Tenants Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No tenants match your search criteria"
                : "Get started by adding your first tenant"}
            </p>
            {!searchTerm && (
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                Add Tenant
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <strong>{tenant.username || "N/A"}</strong>
                    </td>
                    <td>{tenant.email || "N/A"}</td>
                    <td>{tenant.phone || "N/A"}</td>
                    <td>{tenant.currentUnit?.unitNumber || "Unassigned"}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.success}`}>
                        Active
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.edit}`}
                          onClick={() => openEditModal(tenant)}
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() =>
                            handleDelete(tenant._id, tenant.username)
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

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingTenant ? "Edit Tenant" : "Add New Tenant"}
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
                  <label className={styles.formLabel}>Name *</label>
                  <input
                    type="text"
                    name="username"
                    className={styles.formInput}
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    className={styles.formInput}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className={styles.formInput}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +254712345678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Password {!editingTenant && "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={styles.formInput}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingTenant ? "Leave blank to keep current" : "Enter password"}
                    required={!editingTenant}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assign Unit</label>
                  <select
                    name="unit"
                    className={styles.formSelect}
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    <option value="">No Unit</option>
                    {(units || []).filter(u => u.status === "vacant" || u._id === formData.unit).map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.unitNumber} - {unit.bedrooms}BR ${unit.monthlyRent}
                      </option>
                    ))}
                  </select>
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
                  {editingTenant ? "Update Tenant" : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
