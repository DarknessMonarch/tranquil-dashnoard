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
      value: formatCurrency(analytics?.totalRevenue || 750000),
      trend: "+12.5%",
      trendUp: true,
      icon: MdAttachMoney,
      color: "blue",
    },
    {
      label: "Collected",
      value: formatCurrency(analytics?.collected || 675000),
      trend: "+8.3%",
      trendUp: true,
      icon: MdCheckCircle,
      color: "green",
    },
    {
      label: "Arrears",
      value: formatCurrency(analytics?.arrears || 75000),
      trend: "-5.2%",
      trendUp: false,
      icon: MdWarning,
      color: "orange",
    },
    {
      label: "Occupancy Rate",
      value: `${analytics?.occupancyRate || 89}%`,
      trend: "+3.1%",
      trendUp: true,
      icon: MdApartment,
      color: "purple",
    },
  ];

  const recentActivities = [
    {
      type: "payment",
      title: "Payment Received",
      description: "John Doe - Unit 101 - KES 25,000",
      time: "2 hours ago",
      icon: MdCheckCircle,
    },
    {
      type: "maintenance",
      title: "Maintenance Request",
      description: "Leaking faucet - Unit 204",
      time: "5 hours ago",
      icon: MdBuild,
    },
    {
      type: "tenant",
      title: "New Tenant",
      description: "Jane Smith moved into Unit 305",
      time: "1 day ago",
      icon: MdPeople,
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
                <div
                  className={`${styles.metricTrend} ${
                    metric.trendUp ? styles.up : styles.down
                  }`}
                >
                  {metric.trendUp ? <MdTrendingUp /> : <MdTrendingDown />}
                  {metric.trend}
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

        {/* Recent Activity */}
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Recent Activity</h3>
            <a href="#" className={styles.viewAllLink}>
              View All
            </a>
          </div>
          <div className={styles.activityList}>
            {recentActivities.map((activity, idx) => (
              <div key={idx} className={styles.activityItem}>
                <div
                  className={`${styles.activityIcon} ${
                    styles[activity.type]
                  }`}
                >
                  <activity.icon />
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>{activity.title}</div>
                  <div className={styles.activityDescription}>
                    {activity.description}
                  </div>
                </div>
                <div className={styles.activityTime}>{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
