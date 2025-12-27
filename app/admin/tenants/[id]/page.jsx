'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/app/components/AdminLayout';
import { useAuthStore } from '@/app/store/AuthStore';
import { useLandlordStore } from '@/app/store/LandlordStore';
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
  MdAdd,
  MdDelete,
} from 'react-icons/md';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id;
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    getTenantById,
    fetchTenantBills,
    fetchTenantPayments,
    fetchTenantMaintenance,
    createBill,
  } = useLandlordStore();

  const [activeTab, setActiveTab] = useState('bills');
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bill generation modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billFormData, setBillFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: '',
    // Bill items
    includeRent: true,
    includeWater: false,
    includeElectricity: false,
    includeMaintenance: false,
    includeOther: false,
    // Item details
    waterUnitPrice: '',
    waterConsumption: '',
    waterMeterReading: '',
    electricityUnitPrice: '',
    electricityConsumption: '',
    electricityMeterReading: '',
    maintenanceAmount: '',
    maintenanceDetails: '',
    otherAmount: '',
    otherDetails: '',
  });

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tenant details
      const tenantResult = await getTenantById(tenantId);
      if (!tenantResult.success) {
        throw new Error(tenantResult.message || 'Failed to fetch tenant');
      }
      setTenant(tenantResult.data);

      // Fetch bills
      const billsResult = await fetchTenantBills(tenantId);
      if (billsResult.success) {
        setBills(billsResult.data || []);
      }

      // Fetch payments
      const paymentsResult = await fetchTenantPayments(tenantId);
      if (paymentsResult.success) {
        setPayments(paymentsResult.data || []);
      }

      // Fetch maintenance requests
      const maintenanceResult = await fetchTenantMaintenance(tenantId);
      if (maintenanceResult.success) {
        setMaintenanceRequests(maintenanceResult.data || []);
      }

      // Fetch feedback
      try {
        const { accessToken } = useAuthStore.getState();
        const feedbackResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/feedback/tenant/${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        const feedbackData = await feedbackResponse.json();
        console.log('Feedback response:', feedbackData);
        if (feedbackData.status === 'success') {
          setFeedback(feedbackData.data || []);
        } else {
          console.error('Feedback fetch failed:', feedbackData.message);
        }
      } catch (err) {
        console.error('Error loading feedback:', err);
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

  const handleGenerateBill = async (e) => {
    e.preventDefault();

    const { month, year, dueDate, includeRent, includeWater, includeElectricity, includeMaintenance, includeOther } = billFormData;

    if (!month || !year || !dueDate) {
      toast.error('Please fill in month, year, and due date');
      return;
    }

    if (!includeRent && !includeWater && !includeElectricity && !includeMaintenance && !includeOther) {
      toast.error('Please select at least one bill item');
      return;
    }

    if (!tenant?.tenantInfo?.currentUnit || !tenant?.tenantInfo?.currentProperty) {
      toast.error('Tenant must be assigned to a unit');
      return;
    }

    try {
      const items = [];
      let totalAmount = 0;

      // Add rent item
      if (includeRent) {
        const rentAmount = tenant.tenantInfo.currentUnit.monthlyRent || 0;
        items.push({
          type: 'rent',
          amount: rentAmount,
          details: `Rent for ${tenant.tenantInfo.currentUnit.unitNumber}`,
        });
        totalAmount += rentAmount;
      }

      // Add water item
      if (includeWater) {
        const { waterUnitPrice, waterConsumption, waterMeterReading } = billFormData;
        if (!waterUnitPrice || !waterConsumption) {
          toast.error('Please fill in water unit price and consumption');
          return;
        }
        const waterAmount = parseFloat(waterUnitPrice) * parseFloat(waterConsumption);
        items.push({
          type: 'water',
          amount: waterAmount,
          unitPrice: parseFloat(waterUnitPrice),
          consumption: parseFloat(waterConsumption),
          meterReading: waterMeterReading ? parseFloat(waterMeterReading) : undefined,
          details: 'Water consumption charges',
        });
        totalAmount += waterAmount;
      }

      // Add electricity item
      if (includeElectricity) {
        const { electricityUnitPrice, electricityConsumption, electricityMeterReading } = billFormData;
        if (!electricityUnitPrice || !electricityConsumption) {
          toast.error('Please fill in electricity unit price and consumption');
          return;
        }
        const electricityAmount = parseFloat(electricityUnitPrice) * parseFloat(electricityConsumption);
        items.push({
          type: 'electricity',
          amount: electricityAmount,
          unitPrice: parseFloat(electricityUnitPrice),
          consumption: parseFloat(electricityConsumption),
          meterReading: electricityMeterReading ? parseFloat(electricityMeterReading) : undefined,
          details: 'Electricity consumption charges',
        });
        totalAmount += electricityAmount;
      }

      // Add maintenance item
      if (includeMaintenance) {
        const { maintenanceAmount, maintenanceDetails } = billFormData;
        if (!maintenanceAmount) {
          toast.error('Please fill in maintenance amount');
          return;
        }
        items.push({
          type: 'service_fee',
          amount: parseFloat(maintenanceAmount),
          details: maintenanceDetails || 'Maintenance charges',
        });
        totalAmount += parseFloat(maintenanceAmount);
      }

      // Add other item
      if (includeOther) {
        const { otherAmount, otherDetails } = billFormData;
        if (!otherAmount) {
          toast.error('Please fill in other charges amount');
          return;
        }
        items.push({
          type: 'other',
          amount: parseFloat(otherAmount),
          details: otherDetails || 'Other charges',
        });
        totalAmount += parseFloat(otherAmount);
      }

      // Validate that we have at least one item
      if (items.length === 0) {
        toast.error('Bill must have at least one item');
        console.error('Bill generation failed: No items in array');
        return;
      }

      // Debug logging
      console.log('Generating bill with items:', items);

      const billData = {
        tenant: tenantId,
        unit: tenant.tenantInfo.currentUnit._id,
        property: tenant.tenantInfo.currentProperty._id || tenant.tenantInfo.currentProperty,
        billingPeriod: {
          month: parseInt(month),
          year: parseInt(year),
        },
        items: items,
        totalAmount: totalAmount,
        paidAmount: 0,
        status: 'unpaid',
        dueDate: dueDate,
      };

      const result = await createBill(billData);

      if (result.success) {
        toast.success('Bill generated successfully');
        setShowBillModal(false);
        setBillFormData({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          dueDate: '',
          includeRent: true,
          includeWater: false,
          includeElectricity: false,
          includeMaintenance: false,
          includeOther: false,
          waterUnitPrice: '',
          waterConsumption: '',
          waterMeterReading: '',
          electricityUnitPrice: '',
          electricityConsumption: '',
          electricityMeterReading: '',
          maintenanceAmount: '',
          maintenanceDetails: '',
          otherAmount: '',
          otherDetails: '',
        });
        loadTenantData();
      } else {
        toast.error(result.message || 'Failed to generate bill');
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('An error occurred while generating bill');
    }
  };

  const handleDeleteBill = async (billId) => {
    // Use toast.promise instead of window.confirm
    toast.promise(
      new Promise((resolve, reject) => {
        const deleteConfirm = window.confirm('Are you sure you want to delete this bill? This action cannot be undone.');
        if (!deleteConfirm) {
          reject(new Error('Cancelled'));
          return;
        }

        const { accessToken } = useAuthStore.getState();
        fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/landlord/bills/${billId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success') {
              loadTenantData();
              resolve('Bill deleted successfully');
            } else {
              reject(new Error(data.message || 'Failed to delete bill'));
            }
          })
          .catch(err => {
            console.error('Error deleting bill:', err);
            reject(err);
          });
      }),
      {
        loading: 'Deleting bill...',
        success: (message) => message,
        error: (err) => err.message === 'Cancelled' ? '' : err.message || 'Failed to delete bill',
      }
    );
  };

  const handleUpdateMaintenanceStatus = async (requestId, newStatus) => {
    try {
      const { accessToken } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/landlord/maintenance/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success(`Maintenance status updated to ${newStatus}`);
        // Refresh maintenance list
        loadTenantData();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast.error('Failed to update status');
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
    { id: 'feedback', label: 'Feedback', icon: MdEmail, count: feedback.length },
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
                <button onClick={() => setShowBillModal(true)} className={styles.createButton}>
                  <MdAdd size={20} />
                  Generate Bill
                </button>
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
                        <th>Categories</th>
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
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {bill.items && bill.items.length > 0 ? (
                                bill.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      background: item.type === 'rent' ? 'var(--primary-light)' :
                                                  item.type === 'water' ? '#E3F2FD' :
                                                  item.type === 'electricity' ? '#FFF3E0' :
                                                  item.type === 'service_fee' ? '#F3E5F5' :
                                                  'var(--light-gray)',
                                      color: item.type === 'rent' ? 'var(--primary-color)' :
                                             item.type === 'water' ? '#1976D2' :
                                             item.type === 'electricity' ? '#F57C00' :
                                             item.type === 'service_fee' ? '#7B1FA2' :
                                             'var(--dark-gray)'
                                    }}
                                  >
                                    {item.type === 'service_fee' ? 'Service' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>No items</span>
                              )}
                            </div>
                          </td>
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
                              onClick={() => handleDeleteBill(bill._id)}
                              className={styles.iconButton}
                              title="Delete"
                            >
                              <MdDelete size={18} />
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
                        <th>Actions</th>
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
                          <td>
                            <select
                              value={request.status}
                              onChange={(e) => handleUpdateMaintenanceStatus(request._id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="submitted">Submitted</option>
                              <option value="active">Active</option>
                              <option value="assigned">Assigned</option>
                              <option value="on-site">On Site</option>
                              <option value="resolved">Resolved</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Feedback & Messages</h2>
              </div>

              {feedback.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdEmail size={64} />
                  <p>No feedback from tenant</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px', padding: '20px' }}>
                  {feedback.map((item) => {
                    const getTypeColor = (type) => {
                      switch(type) {
                        case 'bill_dispute': return '#e74c3c';
                        case 'complaint': return '#f39c12';
                        case 'request': return 'var(--secondary-color)';
                        default: return 'var(--primary-color)';
                      }
                    };

                    const getTypeIcon = (type) => {
                      switch(type) {
                        case 'bill_dispute': return MdReceipt;
                        case 'complaint': return MdBuild;
                        case 'request': return MdAdd;
                        default: return MdEmail;
                      }
                    };

                    const typeColor = getTypeColor(item.type);
                    const TypeIcon = getTypeIcon(item.type);

                    return (
                      <div key={item._id} style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        {/* Header Section */}
                        <div style={{
                          padding: '16px 20px',
                          backgroundColor: `${typeColor}10`,
                          borderBottom: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {/* Type Icon */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            backgroundColor: `${typeColor}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <TypeIcon size={24} color={typeColor} />
                          </div>

                          {/* Title and Type */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                              margin: '0 0 4px 0',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: 'var(--dark-gray)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.subject}
                            </h3>
                            <span style={{
                              fontSize: '13px',
                              color: typeColor,
                              fontWeight: '500'
                            }}>
                              {item.type.replace('_', ' ').charAt(0).toUpperCase() + item.type.replace('_', ' ').slice(1)}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            backgroundColor: item.status === 'open' ? 'var(--warning-light)' :
                                           item.status === 'in_progress' ? 'var(--secondary-light)' :
                                           item.status === 'resolved' ? 'var(--success-light)' : 'var(--warm-gray-light)',
                            color: item.status === 'open' ? 'var(--warning-color)' :
                                  item.status === 'in_progress' ? 'var(--secondary-color)' :
                                  item.status === 'resolved' ? 'var(--success-color)' : 'var(--warm-gray)',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Content Section */}
                        <div style={{ padding: '20px' }}>
                          <p style={{
                            margin: '0 0 16px 0',
                            color: 'var(--dark-gray)',
                            lineHeight: '1.6',
                            fontSize: '14px'
                          }}>
                            {item.message}
                          </p>

                          {/* Footer with Priority, Date, and Replies */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            {/* Priority Badge */}
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              border: `1.5px solid ${
                                item.priority === 'urgent' ? '#d63031' :
                                item.priority === 'high' ? '#e67e22' :
                                item.priority === 'medium' ? '#95a5a6' : '#27ae60'
                              }`,
                              color: item.priority === 'urgent' ? '#d63031' :
                                    item.priority === 'high' ? '#e67e22' :
                                    item.priority === 'medium' ? '#95a5a6' : '#27ae60',
                              backgroundColor: item.priority === 'urgent' ? '#fee' :
                                             item.priority === 'high' ? '#ffeaa7' :
                                             item.priority === 'medium' ? '#ecf0f1' : '#d4f1d4',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              🏴 {item.priority.toUpperCase()}
                            </span>

                            {/* Date */}
                            <span style={{
                              fontSize: '13px',
                              color: 'var(--warm-gray)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              🕐 {formatDate(item.createdAt)}
                            </span>

                            <div style={{ flex: 1 }} />

                            {/* Replies Count */}
                            {item.replies && item.replies.length > 0 && (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: 'var(--secondary-light)',
                                color: 'var(--secondary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                💬 {item.replies.length} {item.replies.length === 1 ? 'Reply' : 'Replies'}
                              </span>
                            )}
                          </div>

                          {/* Replies Section */}
                          {item.replies && item.replies.length > 0 && (
                            <div style={{
                              marginTop: '20px',
                              paddingTop: '20px',
                              borderTop: '1px solid var(--border-color)'
                            }}>
                              <p style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '12px',
                                color: 'var(--warm-gray)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Conversation
                              </p>
                              {item.replies.map((reply, idx) => (
                                <div key={idx} style={{
                                  padding: '12px 16px',
                                  backgroundColor: 'var(--light-gray)',
                                  borderRadius: '8px',
                                  marginBottom: '8px',
                                  borderLeft: '3px solid var(--primary-color)'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '6px'
                                  }}>
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: 'var(--primary-color)'
                                    }}>
                                      {reply.sender?.username || 'User'}
                                    </span>
                                    <span style={{
                                      fontSize: '11px',
                                      color: 'var(--warm-gray)'
                                    }}>
                                      {formatDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    color: 'var(--dark-gray)',
                                    lineHeight: '1.5'
                                  }}>
                                    {reply.message}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bill Generation Modal */}
      {showBillModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBillModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h2>Generate Bill</h2>
              <button onClick={() => setShowBillModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleGenerateBill} className={styles.modalForm}>
              {/* Period Selection */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Month *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={billFormData.month}
                    onChange={(e) => setBillFormData({ ...billFormData, month: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Year *</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={billFormData.year}
                    onChange={(e) => setBillFormData({ ...billFormData, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Due Date *</label>
                <input
                  type="date"
                  value={billFormData.dueDate}
                  onChange={(e) => setBillFormData({ ...billFormData, dueDate: e.target.value })}
                  required
                />
              </div>

              {/* Bill Items Selection */}
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--light-gray)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Select Bill Items:</h3>

                {/* Rent */}
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={billFormData.includeRent}
                      onChange={(e) => setBillFormData({ ...billFormData, includeRent: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>🏠 Rent</span>
                    <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--warm-gray)' }}>
                      ({tenant?.tenantInfo?.currentUnit?.monthlyRent ? formatCurrency(tenant.tenantInfo.currentUnit.monthlyRent) : 'N/A'})
                    </span>
                  </label>
                </div>

                {/* Water */}
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={billFormData.includeWater}
                      onChange={(e) => setBillFormData({ ...billFormData, includeWater: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>💧 Water</span>
                  </label>
                  {billFormData.includeWater && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {/* Show previous water reading from unit data */}
                      {tenant?.tenantInfo?.currentUnit?.lastWaterReading && (
                        <div style={{
                          padding: '12px',
                          background: 'var(--light-blue)',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          borderLeft: '3px solid var(--primary-color)'
                        }}>
                          <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '4px' }}>Previous Water Reading</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {tenant.tenantInfo.currentUnit.lastWaterReading.value} units
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '2px' }}>
                            Recorded: {new Date(tenant.tenantInfo.currentUnit.lastWaterReading.date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      <div className={styles.formRow} style={{ marginBottom: '12px' }}>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Current Meter Reading *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={billFormData.waterMeterReading}
                            onChange={(e) => {
                              const currentReading = parseFloat(e.target.value) || 0;
                              const previousReading = tenant?.tenantInfo?.currentUnit?.lastWaterReading?.value || 0;
                              const consumption = Math.max(0, currentReading - previousReading);
                              setBillFormData({
                                ...billFormData,
                                waterMeterReading: e.target.value,
                                waterConsumption: consumption > 0 ? consumption.toFixed(2) : billFormData.waterConsumption
                              });
                            }}
                            placeholder="0.00"
                            required={billFormData.includeWater}
                            style={{ fontSize: '14px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '4px', display: 'block' }}>
                            {tenant?.tenantInfo?.currentUnit?.lastWaterReading ? 'Consumption will be auto-calculated' : 'Enter current meter reading'}
                          </span>
                        </div>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Consumption (Units) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={billFormData.waterConsumption}
                            onChange={(e) => setBillFormData({ ...billFormData, waterConsumption: e.target.value })}
                            placeholder="0.00"
                            required={billFormData.includeWater}
                            style={{ fontSize: '14px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '4px', display: 'block' }}>
                            Or enter manually
                          </span>
                        </div>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Price per Unit (KES) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={billFormData.waterUnitPrice}
                            onChange={(e) => setBillFormData({ ...billFormData, waterUnitPrice: e.target.value })}
                            placeholder="0.00"
                            required={billFormData.includeWater}
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      {billFormData.waterConsumption && billFormData.waterUnitPrice && (
                        <div style={{
                          padding: '12px',
                          background: 'var(--secondary-light)',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderLeft: '3px solid var(--secondary-color)'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--dark-gray)' }}>
                            {billFormData.waterConsumption} units × {formatCurrency(parseFloat(billFormData.waterUnitPrice))}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
                            {formatCurrency(parseFloat(billFormData.waterConsumption) * parseFloat(billFormData.waterUnitPrice))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Electricity */}
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={billFormData.includeElectricity}
                      onChange={(e) => setBillFormData({ ...billFormData, includeElectricity: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>⚡ Electricity</span>
                  </label>
                  {billFormData.includeElectricity && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div className={styles.formRow} style={{ marginBottom: '12px' }}>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Previous Reading</label>
                          <input
                            type="number"
                            step="0.01"
                            value={billFormData.electricityMeterReading}
                            onChange={(e) => setBillFormData({ ...billFormData, electricityMeterReading: e.target.value })}
                            placeholder="0.00"
                            style={{ fontSize: '14px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '4px', display: 'block' }}>Optional - for reference</span>
                        </div>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Consumption (kWh) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={billFormData.electricityConsumption}
                            onChange={(e) => setBillFormData({ ...billFormData, electricityConsumption: e.target.value })}
                            placeholder="0.00"
                            required={billFormData.includeElectricity}
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                        <div className={styles.formGroup} style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Price per kWh (KES) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={billFormData.electricityUnitPrice}
                            onChange={(e) => setBillFormData({ ...billFormData, electricityUnitPrice: e.target.value })}
                            placeholder="0.00"
                            required={billFormData.includeElectricity}
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      {billFormData.electricityConsumption && billFormData.electricityUnitPrice && (
                        <div style={{
                          padding: '12px',
                          background: 'var(--secondary-light)',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderLeft: '3px solid var(--secondary-color)'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--dark-gray)' }}>
                            {billFormData.electricityConsumption} kWh × {formatCurrency(parseFloat(billFormData.electricityUnitPrice))}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
                            {formatCurrency(parseFloat(billFormData.electricityConsumption) * parseFloat(billFormData.electricityUnitPrice))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Maintenance */}
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={billFormData.includeMaintenance}
                      onChange={(e) => setBillFormData({ ...billFormData, includeMaintenance: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>🔧 Maintenance/Service Fee</span>
                  </label>
                  {billFormData.includeMaintenance && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div className={styles.formGroup} style={{ margin: 0, marginBottom: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Amount (KES) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={billFormData.maintenanceAmount}
                          onChange={(e) => setBillFormData({ ...billFormData, maintenanceAmount: e.target.value })}
                          placeholder="0.00"
                          required={billFormData.includeMaintenance}
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Details</label>
                        <input
                          type="text"
                          value={billFormData.maintenanceDetails}
                          onChange={(e) => setBillFormData({ ...billFormData, maintenanceDetails: e.target.value })}
                          placeholder="e.g., Monthly service fee"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Other */}
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={billFormData.includeOther}
                      onChange={(e) => setBillFormData({ ...billFormData, includeOther: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>📄 Other Charges</span>
                  </label>
                  {billFormData.includeOther && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div className={styles.formGroup} style={{ margin: 0, marginBottom: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Amount (KES) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={billFormData.otherAmount}
                          onChange={(e) => setBillFormData({ ...billFormData, otherAmount: e.target.value })}
                          placeholder="0.00"
                          required={billFormData.includeOther}
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Details *</label>
                        <input
                          type="text"
                          value={billFormData.otherDetails}
                          onChange={(e) => setBillFormData({ ...billFormData, otherDetails: e.target.value })}
                          placeholder="Description of charges"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowBillModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
