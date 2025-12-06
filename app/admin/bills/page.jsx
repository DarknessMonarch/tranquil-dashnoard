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
  MdReceipt,
  MdClose,
} from "react-icons/md";

export default function BillsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    bills,
    units,
    isLoading,
    fetchBills,
    fetchUnits,
    createBill,
    updateBill,
    deleteBill,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    unit: "",
    tenant: "",
    billingPeriod: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
    dueDate: "",
    items: [
      { description: "Rent", amount: 0, type: "rent" },
    ],
  });

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    fetchBills(selectedProperty._id);
    fetchUnits(selectedProperty._id);
  }, [isAuth, isLandlord, isAdmin, selectedProperty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", amount: 0, type: "other" }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const openCreateModal = () => {
    setEditingBill(null);
    setFormData({
      unit: "",
      tenant: "",
      billingPeriod: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      dueDate: "",
      items: [
        { description: "Rent", amount: 0, type: "rent" },
      ],
    });
    setShowModal(true);
  };

  const openEditModal = (bill) => {
    setEditingBill(bill);
    setFormData({
      unit: bill.unit?._id || bill.unit,
      tenant: bill.tenant?._id || bill.tenant,
      billingPeriod: bill.billingPeriod || {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : "",
      items: bill.items || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.unit) {
      toast.error("Unit is required");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const billData = {
      ...formData,
      property: selectedProperty._id,
      totalAmount,
    };

    try {
      let result;
      if (editingBill) {
        result = await updateBill(editingBill._id, billData);
      } else {
        result = await createBill(billData);
      }

      if (result.success) {
        toast.success(
          editingBill
            ? "Bill updated successfully"
            : "Bill created successfully"
        );
        setShowModal(false);
        fetchBills(selectedProperty._id);
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (billId, unitNumber) => {
    if (!confirm(`Are you sure you want to delete bill for unit ${unitNumber}?`)) {
      return;
    }

    const result = await deleteBill(billId);
    if (result.success) {
      toast.success("Bill deleted successfully");
      fetchBills(selectedProperty._id);
    } else {
      toast.error(result.message || "Failed to delete bill");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { style: "success", label: "Paid" },
      partial: { style: "warning", label: "Partial" },
      unpaid: { style: "error", label: "Unpaid" },
      overdue: { style: "error", label: "Overdue" },
    };
    const info = statusMap[status] || statusMap.unpaid;
    return <span className={`${styles.badge} ${styles[info.style]}`}>{info.label}</span>;
  };

  const filteredBills = bills.filter((bill) => {
    const unitNumber = bill.unit?.unitNumber || "";
    const tenantName = bill.tenant?.username || bill.tenant?.email || "";
    const search = searchTerm.toLowerCase();
    return (
      unitNumber.toLowerCase().includes(search) ||
      tenantName.toLowerCase().includes(search)
    );
  });

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdReceipt className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property from the dropdown to manage bills
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Bills</h2>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            Generate Bill
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredBills.length === 0 ? (
          <div className={styles.emptyState}>
            <MdReceipt className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Bills Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No bills match your search criteria"
                : "Get started by generating your first bill"}
            </p>
            {!searchTerm && (
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                Generate Bill
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Tenant</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <strong>{bill.unit?.unitNumber || "N/A"}</strong>
                    </td>
                    <td>{bill.tenant?.username || bill.tenant?.email || "N/A"}</td>
                    <td>
                      {bill.billingPeriod?.month}/{bill.billingPeriod?.year}
                    </td>
                    <td>${bill.totalAmount?.toLocaleString() || 0}</td>
                    <td>${bill.paidAmount?.toLocaleString() || 0}</td>
                    <td>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "N/A"}</td>
                    <td>{getStatusBadge(bill.status)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.edit}`}
                          onClick={() => openEditModal(bill)}
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() => handleDelete(bill._id, bill.unit?.unitNumber)}
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
                {editingBill ? "Edit Bill" : "Generate New Bill"}
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
                  <label className={styles.formLabel}>Unit *</label>
                  <select
                    name="unit"
                    className={styles.formSelect}
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.unitNumber} - {unit.tenant?.username || "Vacant"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    className={styles.formInput}
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bill Items</label>
                  {formData.items.map((item, index) => (
                    <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        className={styles.formSelect}
                        value={item.type}
                        onChange={(e) => handleItemChange(index, "type", e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="rent">Rent</option>
                        <option value="water">Water</option>
                        <option value="electricity">Electricity</option>
                        <option value="service_fee">Service Fee</option>
                        <option value="penalty">Penalty</option>
                        <option value="other">Other</option>
                      </select>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className={styles.secondaryButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className={styles.secondaryButton}
                    style={{ marginTop: "10px" }}
                  >
                    Add Item
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Amount</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={`$${formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)}`}
                    disabled
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
                  {editingBill ? "Update Bill" : "Generate Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
