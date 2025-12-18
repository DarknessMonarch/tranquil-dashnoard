'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { useAuthStore } from '@/app/store/AuthStore';
import styles from '@/app/styles/tenantDetail.module.css';
import {
  MdArrowBack,
  MdPerson,
  MdReceipt,
  MdPayment,
  MdBuild,
  MdEmail,
  MdPhone,
  MdHome,
  MdAttachMoney,
  MdWater,
  MdAdd,
} from 'react-icons/md';

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id;
  const { accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState('bills');
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Water expense modal state
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [waterExpenseData, setWaterExpenseData] = useState({
    meterReading: '',
    consumption: '',
    unitPrice: '',
    details: '',
  });

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tenant details
      const tenantResponse = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!tenantResponse.ok) throw new Error('Failed to fetch tenant');
      const tenantData = await tenantResponse.json();
      setTenant(tenantData.data);

      // Fetch bills
      const billsResponse = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}/bills`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (billsResponse.ok) {
        const billsData = await billsResponse.json();
        setBills(billsData.data.bills || billsData.data || []);
      }

      // Fetch payments
      const paymentsResponse = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.data.payments || paymentsData.data || []);
      }

      // Fetch maintenance requests
      const maintenanceResponse = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}/maintenance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRequests(maintenanceData.data.requests || maintenanceData.data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading tenant data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBillStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    return `${styles.statusBadge} ${styles[statusLower] || ''}`;
  };

  const getMaintenanceStatusClass = (status) => {
    const statusLower = status?.toLowerCase().replace('_', '').replace('-', '');
    const statusMap = {
      'inprogress': 'inProgress',
      'completed': 'completed',
      'pending': 'pending'
    };
    const className = statusMap[statusLower] || '';
    return `${styles.statusBadge} ${styles[className]}`;
  };

  const getPriorityClass = (priority) => {
    const priorityLower = priority?.toLowerCase();
    return `${styles.statusBadge} ${styles[priorityLower] || ''}`;
  };

  const handleAddWaterExpense = (bill) => {
    setSelectedBill(bill);
    setWaterExpenseData({
      meterReading: '',
      consumption: '',
      unitPrice: '',
      details: `Water consumption for ${bill.billingPeriod?.month}/${bill.billingPeriod?.year}`,
    });
    setShowWaterModal(true);
  };

  const handleSaveWaterExpense = async (e) => {
    e.preventDefault();

    if (!waterExpenseData.consumption || !waterExpenseData.unitPrice) {
      alert('Please fill in consumption and unit price');
      return;
    }

    try {
      const response = await fetch(`${SERVER_API}/landlord/bills/${selectedBill._id}/water-expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(waterExpenseData),
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert('Water expense added successfully');
        setShowWaterModal(false);
        loadTenantData(); // Reload to show updated bill
      } else {
        alert('Error adding water expense: ' + data.message);
      }
    } catch (err) {
      alert('Error adding water expense: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <MdHome className={styles.loadingIcon} />
            <p className={styles.loadingText}>Loading tenant details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !tenant) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            <p>Error: {error || 'Tenant not found'}</p>
            <button onClick={() => router.back()} className={styles.backButton}>
              Go Back
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate summary statistics
  const totalBilled = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const totalPaid = bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
  const balance = totalBilled - totalPaid;
  const maintenanceCount = maintenanceRequests.length;

  const tabs = [
    { id: 'bills', label: 'Bills', icon: MdReceipt, count: bills.length },
    { id: 'payments', label: 'Payments', icon: MdPayment, count: payments.length },
    { id: 'maintenance', label: 'Maintenance', icon: MdBuild, count: maintenanceCount },
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <MdArrowBack size={20} />
            Back
          </button>
          <h1 className={styles.title}>
            <MdPerson size={32} />
            {tenant.name || tenant.username}
          </h1>
        </div>

        {/* Tenant Info Cards */}
        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} ${styles.emailCard}`}>
            <div className={styles.cardIcon}>
              <MdEmail size={28} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Email</p>
              <p className={`${styles.cardValue} ${styles.small}`}>{tenant.email}</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.phoneCard}`}>
            <div className={styles.cardIcon}>
              <MdPhone size={28} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Phone</p>
              <p className={`${styles.cardValue} ${styles.small}`}>{tenant.phone || 'N/A'}</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.unitCard}`}>
            <div className={styles.cardIcon}>
              <MdHome size={28} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Unit</p>
              <p className={styles.cardValue}>{tenant.tenantInfo?.currentUnit?.unitNumber || 'N/A'}</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
            <div className={styles.cardIcon}>
              <MdAttachMoney size={28} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Balance</p>
              <p className={styles.cardValue}>{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
              {tab.count !== null && <span className={styles.tabCount}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.content}>
          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Bills</h2>
              </div>

              {bills.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdReceipt size={64} />
                  <p>No bills found for this tenant</p>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill._id}>
                          <td>{bill.billingPeriod?.month}/{bill.billingPeriod?.year}</td>
                          <td>{formatCurrency(bill.totalAmount)}</td>
                          <td>{formatCurrency(bill.paidAmount)}</td>
                          <td>{formatCurrency(bill.totalAmount - bill.paidAmount)}</td>
                          <td>
                            <span className={getBillStatusClass(bill.status)}>
                              {bill.status}
                            </span>
                          </td>
                          <td>{bill.dueDate ? formatDate(bill.dueDate) : '-'}</td>
                          <td>
                            <button
                              onClick={() => handleAddWaterExpense(bill)}
                              className={styles.createButton}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              title="Add Water Expense"
                            >
                              <MdWater size={16} />
                              Add Water
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Payments</h2>
              </div>

              {payments.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdPayment size={64} />
                  <p>No payments found for this tenant</p>
                </div>
              ) : (
                <div className={styles.tableCard}>
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
                          <td>{formatDate(payment.paymentDate || payment.createdAt)}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td className={styles.capitalize}>{payment.paymentMethod || 'Card'}</td>
                          <td>{payment.reference || '-'}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles.completed}`}>
                              {payment.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Maintenance Requests</h2>
              </div>

              {maintenanceRequests.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdBuild size={64} />
                  <p>No maintenance requests found</p>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceRequests.map((request) => (
                        <tr key={request._id}>
                          <td className={styles.capitalize}>{request.category}</td>
                          <td className={styles.truncate}>{request.description}</td>
                          <td>
                            <span className={getPriorityClass(request.priority)}>
                              {request.priority}
                            </span>
                          </td>
                          <td>
                            <span className={getMaintenanceStatusClass(request.status)}>
                              {request.status?.replace('_', ' ').replace('-', ' ')}
                            </span>
                          </td>
                          <td>{formatDate(request.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Water Expense Modal */}
      {showWaterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowWaterModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Water Expense</h2>
              <button onClick={() => setShowWaterModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleSaveWaterExpense} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Meter Reading (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={waterExpenseData.meterReading}
                  onChange={(e) => setWaterExpenseData({ ...waterExpenseData, meterReading: e.target.value })}
                  placeholder="e.g., 1234.5"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Consumption (units) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={waterExpenseData.consumption}
                  onChange={(e) => setWaterExpenseData({ ...waterExpenseData, consumption: e.target.value })}
                  placeholder="e.g., 25"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Unit Price (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={waterExpenseData.unitPrice}
                  onChange={(e) => setWaterExpenseData({ ...waterExpenseData, unitPrice: e.target.value })}
                  placeholder="e.g., 50"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Details (optional)</label>
                <textarea
                  value={waterExpenseData.details}
                  onChange={(e) => setWaterExpenseData({ ...waterExpenseData, details: e.target.value })}
                  placeholder="Additional details..."
                  rows="3"
                />
              </div>

              <div style={{ padding: '12px', background: 'var(--light-gray)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                <strong>Total Water Charge: </strong>
                {formatCurrency(
                  (parseFloat(waterExpenseData.consumption) || 0) * (parseFloat(waterExpenseData.unitPrice) || 0)
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowWaterModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Add Water Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
