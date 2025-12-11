"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminDashboard.module.css";

import {
  MdAttachMoney,
  MdTrendingUp,
  MdTrendingDown,
  MdApartment,
  MdPeople,
  MdBuild,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    analytics,
    fetchAnalytics,
    maintenanceRequests,
    fetchMaintenanceRequests,
  } = useLandlordStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (selectedProperty) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [selectedProperty, isAuth, isLandlord, isAdmin]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAnalytics(selectedProperty._id),
        fetchMaintenanceRequests(selectedProperty._id),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(analytics?.currentMonth?.totalRevenue || 0),
      icon: MdAttachMoney,
      color: "blue",
    },
    {
      label: "Collected",
      value: formatCurrency(analytics?.currentMonth?.collectedRevenue || 0),
      icon: MdCheckCircle,
      color: "green",
    },
    {
      label: "Arrears",
      value: formatCurrency(analytics?.currentMonth?.arrears || 0),
      icon: MdWarning,
      color: "orange",
    },
    {
      label: "Occupancy Rate",
      value: `${analytics?.occupancyRate || 0}%`,
      icon: MdApartment,
      color: "purple",
    },
  ];

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdApartment className={styles.emptyStateIcon} />
          <h2 className={styles.emptyStateTitle}>No Property Selected</h2>
          <p className={styles.emptyStateDescription}>
            Please select a property from the dropdown above or create a new property to get started.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => router.push("/admin/properties")}
          >
            Manage Properties
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboardGrid}>
        {/* Metrics */}
        <div className={styles.metricsGrid}>
          {metrics.map((metric, idx) => (
            <div key={idx} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIcon} ${styles[metric.color]}`}>
                  <metric.icon />
                </div>
              </div>
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.metricValue}>{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Revenue Trend</h3>
              <select className={styles.chartFilter}>
                <option>Last 6 Months</option>
                <option>Last Year</option>
                <option>All Time</option>
              </select>
            </div>
            <div className={styles.chartContent}>
              <p style={{ color: "var(--warm-gray)" }}>
                Chart visualization will be displayed here
              </p>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Occupancy Overview</h3>
              <select className={styles.chartFilter}>
                <option>Current Month</option>
                <option>Last Month</option>
                <option>Last Quarter</option>
              </select>
            </div>
            <div className={styles.chartContent}>
              <p style={{ color: "var(--warm-gray)" }}>
                Chart visualization will be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Maintenance Summary */}
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Maintenance Overview</h3>
          </div>
          <div className={styles.activityList}>
            {maintenanceRequests.length > 0 ? (
              maintenanceRequests.slice(0, 5).map((request, idx) => (
                <div key={idx} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles.maintenance}`}>
                    <MdBuild />
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>
                      {request.category?.charAt(0).toUpperCase() + request.category?.slice(1)} Request
                    </div>
                    <div className={styles.activityDescription}>
                      {request.description?.substring(0, 50)}... - Unit {request.unit?.unitNumber}
                    </div>
                  </div>
                  <div className={styles.activityTime}>
                    <span className={`${styles.statusBadge} ${styles[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--warm-gray)" }}>
                No maintenance requests
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
