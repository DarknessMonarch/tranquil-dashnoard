'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { useLandlordStore } from '@/app/store/LandlordStore';
import styles from '@/app/styles/tenantDetail.module.css';
import {
  MdArrowBack,
  MdBusiness,
  MdHome,
  MdPeople,
  MdAnalytics,
  MdReceipt,
  MdApartment,
  MdCheckCircle,
  MdAttachMoney,
  MdBuild,
  MdAdd,
  MdEdit,
  MdDelete,
  MdInfo,
  MdWater,
  MdElectricBolt,
  MdDescription,
  MdLocationOn,
  MdCampaign,
} from 'react-icons/md';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id;

  const { fetchPropertyById, fetchPropertyUnits, fetchPropertyTenants, fetchPropertyBills, fetchAnnouncements, createAnnouncement, deleteAnnouncement } = useLandlordStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unit modal state
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitFormData, setUnitFormData] = useState({
    unitNumber: '',
    floor: '',
    bedrooms: 1,
    bathrooms: 1,
    rentAmount: '',
    status: 'vacant',
  });

  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    message: '',
  });

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [propertyData, unitsData, tenantsData, billsData, announcementsResult] = await Promise.all([
        fetchPropertyById(propertyId),
        fetchPropertyUnits(propertyId),
        fetchPropertyTenants(propertyId),
        fetchPropertyBills(propertyId),
        fetchAnnouncements(propertyId),
      ]);

      setProperty(propertyData);
      setUnits(unitsData);
      setTenants(tenantsData);
      setBills(billsData);

      // Handle announcements result
      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data);
      } else {
        setAnnouncements([]);
      }

      // Calculate analytics
      const totalUnits = unitsData.length;
      const occupiedUnits = unitsData.filter(u => u.status === 'occupied').length;
      const totalRevenue = billsData.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0);

      // Count pending maintenance requests from bills or set to 0
      const pendingMaintenance = 0; // Will be implemented when maintenance endpoint is available

      setAnalytics({
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0,
        totalRevenue,
        pendingMaintenance,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading property data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateUnit = () => {
    setEditingUnit(null);
    setUnitFormData({
      unitNumber: '',
      floor: '',
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: '',
      status: 'vacant',
    });
    setShowUnitModal(true);
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      unitNumber: unit.unitNumber,
      floor: unit.floor || '',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      rentAmount: unit.rentAmount,
      status: unit.status,
    });
    setShowUnitModal(true);
  };

  const handleDeleteUnit = async (unitId) => {
    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/landlord/units/${unitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete unit');
      }

      alert('Unit deleted successfully');
      loadPropertyData();
    } catch (err) {
      alert('Error deleting unit: ' + err.message);
    }
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();

    try {
      const url = editingUnit
        ? `/api/landlord/units/${editingUnit._id}`
        : '/api/landlord/units';

      const method = editingUnit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...unitFormData,
          property: propertyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save unit');
      }

      alert(editingUnit ? 'Unit updated successfully' : 'Unit created successfully');
      setShowUnitModal(false);
      loadPropertyData();
    } catch (err) {
      alert('Error saving unit: ' + err.message);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();

    if (!announcementFormData.title.trim() || !announcementFormData.message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const result = await createAnnouncement(propertyId, announcementFormData);
      if (result.success) {
        alert('Announcement created successfully');
        setShowAnnouncementModal(false);
        setAnnouncementFormData({ title: '', message: '' });
        loadPropertyData();
      } else {
        alert('Error creating announcement: ' + result.message);
      }
    } catch (err) {
      alert('Error creating announcement: ' + err.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const result = await deleteAnnouncement(announcementId);
      if (result.success) {
        alert('Announcement deleted successfully');
        loadPropertyData();
      } else {
        alert('Error deleting announcement: ' + result.message);
      }
    } catch (err) {
      alert('Error deleting announcement: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    return `${styles.statusBadge} ${styles[statusLower] || ''}`;
  };

  const getBillStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    return `${styles.statusBadge} ${styles[statusLower] || ''}`;
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

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <MdHome className={styles.loadingIcon} />
            <p className={styles.loadingText}>Loading property details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !property) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            <p>Error: {error || 'Property not found'}</p>
            <button onClick={() => router.push('/admin/properties')} className={styles.backButton}>
              Back to Properties
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MdInfo, count: null },
    { id: 'units', label: 'Units', icon: MdApartment, count: units.length },
    { id: 'tenants', label: 'Tenants', icon: MdPeople, count: tenants.length },
    { id: 'analytics', label: 'Analytics', icon: MdAnalytics, count: null },
    { id: 'bills', label: 'Bills', icon: MdReceipt, count: bills.length },
    { id: 'announcements', label: 'Announcements', icon: MdCampaign, count: announcements.length },
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => router.push('/admin/properties')} className={styles.backButton}>
            <MdArrowBack size={20} />
            Back to Properties
          </button>
          <h1 className={styles.title}>
            <MdBusiness size={32} />
            {property.name}
          </h1>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} ${styles.totalUnitsCard}`}>
            <div className={styles.cardIcon}>
              <MdApartment size={32} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Units</p>
              <p className={styles.cardValue}>{analytics?.totalUnits || 0}</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.occupiedUnitsCard}`}>
            <div className={styles.cardIcon}>
              <MdCheckCircle size={32} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Occupied Units</p>
              <p className={styles.cardValue}>{analytics?.occupiedUnits || 0}</p>
              <p className={styles.cardSubtext}>{analytics?.occupancyRate}% occupancy</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.totalRevenueCard}`}>
            <div className={styles.cardIcon}>
              <MdAttachMoney size={32} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Revenue</p>
              <p className={styles.cardValue}>{formatCurrency(analytics?.totalRevenue || 0)}</p>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.pendingMaintenanceCard}`}>
            <div className={styles.cardIcon}>
              <MdBuild size={32} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Pending Maintenance</p>
              <p className={styles.cardValue}>{analytics?.pendingMaintenance || 0}</p>
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <MdBusiness size={24} />
                    <h3>Property Information</h3>
                  </div>
                  <div className={styles.infoCardContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Name:</span>
                      <span className={styles.infoValue}>{property.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Address:</span>
                      <span className={styles.infoValue}>
                        <MdLocationOn size={16} />
                        {property.address}
                      </span>
                    </div>
                    {property.description && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Description:</span>
                        <span className={styles.infoValue}>{property.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <MdApartment size={24} />
                    <h3>Unit Statistics</h3>
                  </div>
                  <div className={styles.infoCardContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Total Units:</span>
                      <span className={styles.infoValue}>{analytics?.totalUnits || 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Occupied:</span>
                      <span className={styles.infoValue}>
                        {analytics?.occupiedUnits || 0}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Vacant:</span>
                      <span className={styles.infoValue}>
                        {analytics?.vacantUnits || 0}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Occupancy Rate:</span>
                      <span className={styles.infoValue}>{analytics?.occupancyRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Units Tab */}
          {activeTab === 'units' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Units</h2>
                <button onClick={handleCreateUnit} className={styles.createButton}>
                  <MdAdd size={20} />
                  Add Unit
                </button>
              </div>

              {units.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdApartment size={64} />
                  <p>No units found for this property</p>
                  <button onClick={handleCreateUnit} className={styles.createButton}>
                    <MdAdd size={20} />
                    Create First Unit
                  </button>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Unit Number</th>
                        <th>Floor</th>
                        <th>Bedrooms</th>
                        <th>Bathrooms</th>
                        <th>Rent Amount</th>
                        <th>Status</th>
                        <th>Tenant</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr key={unit._id}>
                          <td>{unit.unitNumber}</td>
                          <td>{unit.floor || '-'}</td>
                          <td>{unit.bedrooms}</td>
                          <td>{unit.bathrooms}</td>
                          <td>{formatCurrency(unit.rentAmount)}</td>
                          <td>
                            <span className={getStatusClass(unit.status)}>
                              {unit.status}
                            </span>
                          </td>
                          <td>{unit.tenant?.username || '-'}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                onClick={() => handleEditUnit(unit)}
                                className={styles.iconButton}
                                title="Edit"
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(unit._id)}
                                className={styles.iconButton}
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
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Tenants</h2>
              </div>

              {tenants.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdPeople size={64} />
                  <p>No tenants found in this property</p>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Unit</th>
                        <th>Monthly Rent</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((tenant) => (
                        <tr
                          key={tenant._id}
                          onClick={() => router.push(`/admin/tenants/${tenant._id}`)}
                          className={styles.clickableRow}
                        >
                          <td><strong>{tenant.username}</strong></td>
                          <td>{tenant.email}</td>
                          <td>{tenant.phone || '-'}</td>
                          <td>{tenant.tenantInfo?.currentUnit?.unitNumber || '-'}</td>
                          <td>{tenant.tenantInfo?.currentUnit?.monthlyRent ? formatCurrency(tenant.tenantInfo.currentUnit.monthlyRent) : '-'}</td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/tenants/${tenant._id}`);
                              }}
                              className={styles.viewButton}
                            >
                              View Details
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className={styles.analyticsTab}>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h3>Occupancy Overview</h3>
                  <div className={styles.analyticsContent}>
                    <div className={styles.statRow}>
                      <span>Total Units:</span>
                      <strong>{analytics?.totalUnits || 0}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Occupied:</span>
                      <strong>{analytics?.occupiedUnits || 0}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Vacant:</span>
                      <strong>{analytics?.vacantUnits || 0}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Occupancy Rate:</span>
                      <strong>{analytics?.occupancyRate}%</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.analyticsCard}>
                  <h3>Revenue Summary</h3>
                  <div className={styles.analyticsContent}>
                    <div className={styles.statRow}>
                      <span>Total Revenue:</span>
                      <strong>{formatCurrency(analytics?.totalRevenue || 0)}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Paid Bills:</span>
                      <strong>{bills.filter(b => b.status === 'paid').length}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Unpaid Bills:</span>
                      <strong>
                        {bills.filter(b => b.status === 'unpaid' || b.status === 'overdue').length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className={styles.analyticsCard}>
                  <h3>Maintenance Overview</h3>
                  <div className={styles.analyticsContent}>
                    <div className={styles.statRow}>
                      <span>Pending Requests:</span>
                      <strong>{analytics?.pendingMaintenance || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Bills</h2>
              </div>

              {bills.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdReceipt size={64} />
                  <p>No bills found for this property</p>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Tenant</th>
                        <th>Unit</th>
                        <th>Period</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill._id}>
                          <td>{bill.tenant?.username || '-'}</td>
                          <td>{bill.unit?.unitNumber || '-'}</td>
                          <td>
                            {bill.billingPeriod?.month}/{bill.billingPeriod?.year}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Announcements</h2>
                <button onClick={() => setShowAnnouncementModal(true)} className={styles.createButton}>
                  <MdAdd size={20} />
                  Create Announcement
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdCampaign size={64} />
                  <p>No announcements for this property</p>
                  <button onClick={() => setShowAnnouncementModal(true)} className={styles.createButton}>
                    <MdAdd size={20} />
                    Create First Announcement
                  </button>
                </div>
              ) : (
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((announcement) => (
                        <tr key={announcement._id}>
                          <td><strong>{announcement.title}</strong></td>
                          <td className={styles.truncate}>{announcement.message}</td>
                          <td>{announcement.createdAt ? formatDate(announcement.createdAt) : '-'}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement._id)}
                                className={styles.iconButton}
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
          )}
        </div>
      </div>

      {/* Unit Modal */}
      {showUnitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUnitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUnit ? 'Edit Unit' : 'Create New Unit'}</h2>
              <button onClick={() => setShowUnitModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleSaveUnit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Unit Number *</label>
                <input
                  type="text"
                  value={unitFormData.unitNumber}
                  onChange={(e) => setUnitFormData({ ...unitFormData, unitNumber: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Floor</label>
                <input
                  type="text"
                  value={unitFormData.floor}
                  onChange={(e) => setUnitFormData({ ...unitFormData, floor: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Bedrooms *</label>
                  <input
                    type="number"
                    min="0"
                    value={unitFormData.bedrooms}
                    onChange={(e) => setUnitFormData({ ...unitFormData, bedrooms: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bathrooms *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitFormData.bathrooms}
                    onChange={(e) => setUnitFormData({ ...unitFormData, bathrooms: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Rent Amount (KES) *</label>
                <input
                  type="number"
                  min="0"
                  value={unitFormData.rentAmount}
                  onChange={(e) => setUnitFormData({ ...unitFormData, rentAmount: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status *</label>
                <select
                  value={unitFormData.status}
                  onChange={(e) => setUnitFormData({ ...unitFormData, status: e.target.value })}
                  required
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowUnitModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingUnit ? 'Update Unit' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Announcement</h2>
              <button onClick={() => setShowAnnouncementModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={announcementFormData.title}
                  onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                  placeholder="e.g., Water Outage Schedule"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message *</label>
                <textarea
                  value={announcementFormData.message}
                  onChange={(e) => setAnnouncementFormData({ ...announcementFormData, message: e.target.value })}
                  placeholder="Enter announcement message..."
                  rows="5"
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAnnouncementModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
