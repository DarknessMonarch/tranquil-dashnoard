'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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

  const {
    fetchPropertyById,
    fetchPropertyUnits,
    fetchPropertyTenants,
    fetchNotices,
    createNotice,
    deleteNotice,
    createUnit,
    updateUnit,
    deleteUnit,
  } = useLandlordStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [notices, setNotices] = useState([]);
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
    monthlyRent: '',
    status: 'vacant',
  });

  // Notice modal state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeFormData, setNoticeFormData] = useState({
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
      const [propertyData, unitsData, tenantsData, noticesResult] = await Promise.all([
        fetchPropertyById(propertyId),
        fetchPropertyUnits(propertyId),
        fetchPropertyTenants(propertyId),
        fetchNotices(propertyId),
      ]);

      setProperty(propertyData);
      setUnits(unitsData);
      setTenants(tenantsData);

      // Handle notices result
      if (noticesResult.success) {
        setNotices(noticesResult.data);
      } else {
        setNotices([]);
      }

      // Calculate analytics
      const totalUnits = unitsData.length;
      const occupiedUnits = unitsData.filter(u => u.status === 'occupied').length;
      const totalRevenue = 0; // Revenue tracking moved to tenant bills section

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
      monthlyRent: '',
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
      monthlyRent: unit.monthlyRent,
      status: unit.status,
    });
    setShowUnitModal(true);
  };

  const handleDeleteUnit = async (unitId) => {
    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteUnit(unitId);
      if (result.success) {
        toast.success('Unit deleted successfully');
        loadPropertyData();
      } else {
        throw new Error(result.message || 'Failed to delete unit');
      }
    } catch (err) {
      toast.error('Error deleting unit: ' + err.message);
    }
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();

    try {
      let result;

      if (editingUnit) {
        result = await updateUnit(propertyId, editingUnit._id, unitFormData);
      } else {
        result = await createUnit(propertyId, unitFormData);
      }

      if (result.success) {
        toast.success(editingUnit ? 'Unit updated successfully' : 'Unit created successfully');
        setShowUnitModal(false);
        loadPropertyData();
      } else {
        throw new Error(result.message || 'Failed to save unit');
      }
    } catch (err) {
      toast.error('Error saving unit: ' + err.message);
    }
  };

  const handleSaveNotice = async (e) => {
    e.preventDefault();

    if (!noticeFormData.title.trim() || !noticeFormData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await createNotice(propertyId, noticeFormData);
      if (result.success) {
        toast.success('Notice created successfully');
        setShowNoticeModal(false);
        setNoticeFormData({ title: '', message: '' });
        loadPropertyData();
      } else {
        toast.error('Error creating notice: ' + result.message);
      }
    } catch (err) {
      toast.error('Error creating notice: ' + err.message);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      const result = await deleteNotice(noticeId);
      if (result.success) {
        toast.success('Notice deleted successfully');
        loadPropertyData();
      } else {
        toast.error('Error deleting notice: ' + result.message);
      }
    } catch (err) {
      toast.error('Error deleting notice: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
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
    { id: 'notices', label: 'Notices', icon: MdCampaign, count: notices.length },
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
                        {property.address
                          ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.country || ''}`.replace(/^, |, $/g, '').replace(/, ,/g, ',') || 'N/A'
                          : 'N/A'}
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
                          <td>{formatCurrency(unit.monthlyRent)}</td>
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
                      <span>Total Tenants:</span>
                      <strong>{tenants.length}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Total Units:</span>
                      <strong>{analytics?.totalUnits || 0}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Occupied Units:</span>
                      <strong>{analytics?.occupiedUnits || 0}</strong>
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

          {/* Notices Tab */}
          {activeTab === 'notices' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2>Notices</h2>
                <button onClick={() => setShowNoticeModal(true)} className={styles.createButton}>
                  <MdAdd size={20} />
                  Create Notice
                </button>
              </div>

              {notices.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdCampaign size={64} />
                  <p>No notices for this property</p>
             
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
                      {notices.map((notice) => (
                        <tr key={notice._id}>
                          <td><strong>{notice.title}</strong></td>
                          <td className={styles.truncate}>{notice.message}</td>
                          <td>{notice.createdAt ? formatDate(notice.createdAt) : '-'}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                onClick={() => handleDeleteNotice(notice._id)}
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
                  value={unitFormData.monthlyRent}
                  onChange={(e) => setUnitFormData({ ...unitFormData, monthlyRent: e.target.value })}
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

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNoticeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Notice</h2>
              <button onClick={() => setShowNoticeModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleSaveNotice} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={noticeFormData.title}
                  onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                  placeholder="e.g., Water Outage Schedule"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message *</label>
                <textarea
                  value={noticeFormData.message}
                  onChange={(e) => setNoticeFormData({ ...noticeFormData, message: e.target.value })}
                  placeholder="Enter notice message..."
                  rows="5"
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowNoticeModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Create Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
