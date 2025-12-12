"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/tenantDetail.module.css";
import {
  MdArrowBack,
  MdPerson,
  MdEmail,
  MdPhone,
  MdHome,
  MdCalendarToday,
  MdAttachMoney,
  MdReceipt,
  MdBuild,
  MdHistory,
} from "react-icons/md";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuth, isLandlord, isAdmin, accessToken } = useAuthStore();

  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (params.id) {
      fetchTenantDetails();
    }
  }, [params.id, isAuth, isLandlord, isAdmin]);

  const fetchTenantDetails = async () => {
    try {
      setIsLoading(true);

      const [tenantRes, billsRes, paymentsRes, maintenanceRes] =
        await Promise.all([
          fetch(`${SERVER_API}/landlord/tenants/${params.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${SERVER_API}/landlord/tenants/${params.id}/bills`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${SERVER_API}/landlord/tenants/${params.id}/payments`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${SERVER_API}/landlord/tenants/${params.id}/maintenance`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

      const [tenantData, billsData, paymentsData, maintenanceData] =
        await Promise.all([
          tenantRes.json(),
          billsRes.json(),
          paymentsRes.json(),
          maintenanceRes.json(),
        ]);

      if (tenantData.status === "success") {
        setTenant(tenantData.data);
      }

      if (billsData.status === "success") {
        setBills(billsData.data || []);
      }

      if (paymentsData.status === "success") {
        setPayments(paymentsData.data || []);
      }

      if (maintenanceData.status === "success") {
        setMaintenance(maintenanceData.data || []);
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      toast.error("Failed to load tenant details");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalPaid = () => {
    return payments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
  };

  const calculateTotalBilled = () => {
    return bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  };

  const calculateBalance = () => {
    return calculateTotalBilled() - calculateTotalPaid();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { style: "success", label: "Paid" },
      unpaid: { style: "warning", label: "Unpaid" },
      overdue: { style: "error", label: "Overdue" },
      partial: { style: "info", label: "Partial" },
      pending: { style: "warning", label: "Pending" },
      completed: { style: "success", label: "Completed" },
      "in-progress": { style: "info", label: "In Progress" },
    };
    const statusInfo = statusMap[status] || { style: "default", label: status };
    return (
      <span className={`${styles.badge} ${styles[statusInfo.style]}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading tenant details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!tenant) {
    return (
      <AdminLayout>
        <div className={styles.error}>
          <h3>Tenant not found</h3>
          <button
            className={styles.primaryButton}
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <MdArrowBack size={20} />
            Back to Tenants
          </button>
          <h1 className={styles.title}>{tenant.username}</h1>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <MdReceipt size={24} />
            </div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Total Billed</p>
              <h3 className={styles.summaryValue}>
                {formatCurrency(calculateTotalBilled())}
              </h3>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <MdAttachMoney size={24} />
            </div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Total Paid</p>
              <h3 className={styles.summaryValue}>
                {formatCurrency(calculateTotalPaid())}
              </h3>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <MdHistory size={24} />
            </div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Balance</p>
              <h3
                className={`${styles.summaryValue} ${
                  calculateBalance() > 0 ? styles.negative : styles.positive
                }`}
              >
                {formatCurrency(calculateBalance())}
              </h3>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <MdBuild size={24} />
            </div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Maintenance Requests</p>
              <h3 className={styles.summaryValue}>{maintenance.length}</h3>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "overview" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <MdPerson size={18} />
            Overview
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "bills" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("bills")}
          >
            <MdReceipt size={18} />
            Bills ({bills.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "payments" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("payments")}
          >
            <MdAttachMoney size={18} />
            Payments ({payments.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "maintenance" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("maintenance")}
          >
            <MdBuild size={18} />
            Maintenance ({maintenance.length})
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === "overview" && (
            <div className={styles.overviewSection}>
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Personal Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <MdPerson className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Name</p>
                      <p className={styles.infoValue}>{tenant.username}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MdEmail className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Email</p>
                      <p className={styles.infoValue}>{tenant.email}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MdPhone className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Phone</p>
                      <p className={styles.infoValue}>
                        {tenant.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MdHome className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Unit</p>
                      <p className={styles.infoValue}>
                        {tenant.currentUnit?.unitNumber || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MdCalendarToday className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Move-in Date</p>
                      <p className={styles.infoValue}>
                        {formatDate(tenant.leaseStart)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MdCalendarToday className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Lease End</p>
                      <p className={styles.infoValue}>
                        {formatDate(tenant.leaseEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bills" && (
            <div className={styles.tableCard}>
              {bills.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdReceipt size={48} />
                  <p>No bills found for this tenant</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Balance</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id}>
                        <td>
                          {bill.billingPeriod?.month}/{bill.billingPeriod?.year}
                        </td>
                        <td>{formatCurrency(bill.totalAmount)}</td>
                        <td>{formatCurrency(bill.balance)}</td>
                        <td>{formatDate(bill.dueDate)}</td>
                        <td>{getStatusBadge(bill.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className={styles.tableCard}>
              {payments.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdAttachMoney size={48} />
                  <p>No payments found for this tenant</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{formatDate(payment.paymentDate)}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td className={styles.capitalize}>
                          {payment.paymentMethod}
                        </td>
                        <td>{payment.transactionId || "N/A"}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className={styles.tableCard}>
              {maintenance.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdBuild size={48} />
                  <p>No maintenance requests from this tenant</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((request) => (
                      <tr key={request._id}>
                        <td>{request.ticketId}</td>
                        <td className={styles.capitalize}>
                          {request.category}
                        </td>
                        <td className={styles.truncate}>
                          {request.description}
                        </td>
                        <td>{getStatusBadge(request.priority)}</td>
                        <td>{getStatusBadge(request.status)}</td>
                        <td>{formatDate(request.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
