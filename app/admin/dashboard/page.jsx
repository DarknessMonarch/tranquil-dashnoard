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
    properties,
    analytics,
    fetchAnalytics,
    fetchProperties,
  } = useLandlordStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    loadDashboardData();
  }, [isAuth, isLandlord, isAdmin]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAnalytics(), // Fetch analytics for all properties
        fetchProperties(), // Fetch all properties
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
      label: "Total Properties",
      value: properties?.length || 0,
      icon: MdApartment,
      color: "blue",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(analytics?.currentMonth?.totalRevenue || 0),
      icon: MdAttachMoney,
      color: "green",
    },
    {
      label: "Collected",
      value: formatCurrency(analytics?.currentMonth?.collectedRevenue || 0),
      icon: MdCheckCircle,
      color: "purple",
    },
    {
      label: "Arrears",
      value: formatCurrency(analytics?.currentMonth?.arrears || 0),
      icon: MdWarning,
      color: "orange",
    },
  ];

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

        {/* Properties Overview */}
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Properties Overview</h3>
            <button
              className={styles.primaryButton}
              onClick={() => router.push("/admin/properties")}
            >
              View All
            </button>
          </div>
          <div className={styles.activityList}>
            {properties && properties.length > 0 ? (
              properties.slice(0, 5).map((property, idx) => (
                <div
                  key={idx}
                  className={styles.activityItem}
                  onClick={() => router.push(`/admin/properties/${property._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`${styles.activityIcon} ${styles.blue}`}>
                    <MdApartment />
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>
                      {property.name}
                    </div>
                    <div className={styles.activityDescription}>
                      {property.address?.street || property.address} - {property.totalUnits || 0} units
                    </div>
                  </div>
                  <div className={styles.activityTime}>
                    <span className={`${styles.statusBadge} ${styles.success}`}>
                      Active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--warm-gray)" }}>
                No properties found. Create your first property to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
