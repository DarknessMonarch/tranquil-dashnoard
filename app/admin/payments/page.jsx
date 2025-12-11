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
  MdDelete,
  MdPayment,
  MdClose,
} from "react-icons/md";

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    payments,
    bills,
    isLoading,
    fetchPayments,
    fetchBills,
    recordPayment,
    deletePayment,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bill: "",
    tenant: "",
    unit: "",
    amount: "",
    paymentMethod: "mpesa",
    mpesaCode: "",
    description: "",
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

    fetchPayments(selectedProperty._id);
    fetchBills(selectedProperty._id);
  }, [isAuth, isLandlord, isAdmin, selectedProperty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If bill is selected, automatically populate tenant and unit
    if (name === "bill" && value) {
      const selectedBill = bills.find(b => b._id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tenant: selectedBill?.tenant?._id || selectedBill?.tenant || "",
        unit: selectedBill?.unit?._id || selectedBill?.unit || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openCreateModal = () => {
    setFormData({
      bill: "",
      tenant: "",
      unit: "",
      amount: "",
      paymentMethod: "mpesa",
      mpesaCode: "",
      description: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bill) {
      toast.error("Bill is required");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Valid amount is required");
      return;
    }

    // Prepare payment data - exclude bill field and ensure all required fields are present
    const paymentData = {
      tenant: formData.tenant,
      unit: formData.unit,
      property: selectedProperty._id,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      description: formData.description || `Payment for ${formData.paymentMethod}`,
      status: "completed",
    };

    // Add mpesaCode only if payment method is mpesa and code is provided
    if (formData.paymentMethod === "mpesa" && formData.mpesaCode) {
      paymentData.mpesaCode = formData.mpesaCode;
    }

    try {
      const result = await recordPayment(paymentData);

      if (result.success) {
        toast.success("Payment recorded successfully");
        setShowModal(false);
        fetchPayments(selectedProperty._id);
        fetchBills(selectedProperty._id);
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (paymentId, mpesaCode) => {
    if (!confirm(`Are you sure you want to delete payment ${mpesaCode || 'this'}?`)) {
      return;
    }

    const result = await deletePayment(paymentId);
    if (result.success) {
      toast.success("Payment deleted successfully");
      fetchPayments(selectedProperty._id);
    } else {
      toast.error(result.message || "Failed to delete payment");
    }
  };

  const getMethodBadge = (method) => {
    const methodMap = {
      mpesa: { style: "success", label: "M-Pesa" },
      bank_transfer: { style: "info", label: "Bank Transfer" },
      cash: { style: "warning", label: "Cash" },
      card: { style: "info", label: "Card" },
    };
    const info = methodMap[method] || methodMap.cash;
    return <span className={`${styles.badge} ${styles[info.style]}`}>{info.label}</span>;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { style: "success", label: "Completed" },
      pending: { style: "warning", label: "Pending" },
      failed: { style: "error", label: "Failed" },
    };
    const info = statusMap[status] || statusMap.pending;
    return <span className={`${styles.badge} ${styles[info.style]}`}>{info.label}</span>;
  };

  const filteredPayments = (payments || []).filter((payment) => {
    const tenantName = payment.tenant?.username || payment.tenant?.email || "";
    const mpesaCode = payment.mpesaCode || "";
    const search = searchTerm.toLowerCase();
    return (
      tenantName.toLowerCase().includes(search) ||
      mpesaCode.toLowerCase().includes(search)
    );
  });

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdPayment className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property from the dropdown to manage payments
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Payments</h2>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            Record Payment
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredPayments.length === 0 ? (
          <div className={styles.emptyState}>
            <MdPayment className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Payments Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No payments match your search criteria"
                : "Get started by recording your first payment"}
            </p>
            {!searchTerm && (
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                Record Payment
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Code/Reference</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.createdAt || payment.paymentDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{payment.tenant?.username || payment.tenant?.email || "N/A"}</strong>
                    </td>
                    <td>${payment.amount?.toLocaleString() || 0}</td>
                    <td>{getMethodBadge(payment.paymentMethod)}</td>
                    <td>{payment.mpesaCode || payment.paystackReference || "N/A"}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() => handleDelete(payment._id, payment.mpesaCode)}
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
              <h3 className={styles.modalTitle}>Record Payment</h3>
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
                  <label className={styles.formLabel}>Bill *</label>
                  <select
                    name="bill"
                    className={styles.formSelect}
                    value={formData.bill}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Bill</option>
                    {(bills || []).map((bill) => (
                      <option key={bill._id} value={bill._id}>
                        {bill.unit?.unitNumber} - {bill.tenant?.username} - $
                        {bill.totalAmount} ({bill.billingPeriod?.month}/
                        {bill.billingPeriod?.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    className={styles.formInput}
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    className={styles.formSelect}
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    M-Pesa Code (if applicable)
                  </label>
                  <input
                    type="text"
                    name="mpesaCode"
                    className={styles.formInput}
                    value={formData.mpesaCode}
                    onChange={handleInputChange}
                    placeholder="e.g., QA123456789"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    name="description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description of this payment..."
                    rows={3}
                    required
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
